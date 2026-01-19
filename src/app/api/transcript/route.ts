
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { url, lang } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // 1. Extract Video ID
        const match = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
        const videoId = match ? match[1] : null;

        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        // 2. Check for Custom Free API URL (Google Apps Script)
        const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

        if (!googleScriptUrl) {
            return NextResponse.json({
                error: "Missing 'GOOGLE_SCRIPT_URL'. Please deploy the provided 'google_apps_script.js' to Google Apps Script and add the URL to .env.",
                success: false
            }, { status: 500 });
        }

        console.log(`[GoogleProxy] Fetching transcript for ${videoId} via custom script...`);

        // 3. Call Google Script
        // Script expects: ?v=VIDEO_ID&lang=LANG
        const scriptUrl = new URL(googleScriptUrl);
        scriptUrl.searchParams.set('v', videoId);
        if (lang) scriptUrl.searchParams.set('lang', lang);

        const res = await fetch(scriptUrl.toString(), {
            method: 'GET',
            cache: 'no-store'
        });

        if (!res.ok) {
            // Usually returns a 200 with error json, but if not:
            throw new Error(`Google Script Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        if (data.error) {
            return NextResponse.json({ error: data.error, success: false });
        }

        return NextResponse.json({
            success: true,
            transcript: data.transcript,
            language_name: data.language_name || lang || 'Unknown',
            // Mock empty list as the script finds the best one automatically
            available_languages: []
        });

    } catch (error: any) {
        console.error("Transcript API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
