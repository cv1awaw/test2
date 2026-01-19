
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

        console.log(`[ViatosisProxy] Fetching transcript for ${videoId}...`);

        // 2. Call Viatosis Backend directly (Bypassing Google Script)
        // This acts as a client-side fetch from the User's local server.
        // It keeps the User totally free from deploying Google Scripts.
        // URL is hidden in Environment Variables for security.
        const VIATOSIS_URL = process.env.VIATOSIS_API_URL || "";

        if (!VIATOSIS_URL) {
            console.error("Missing VIATOSIS_API_URL in environment variables.");
            return NextResponse.json({ error: "Configuration Error: Missing API URL" }, { status: 500 });
        }

        const res = await fetch(VIATOSIS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // Origin/Referer are critical for their backend to accept the request
                'Origin': 'https://www.viatosis.tech',
                'Referer': 'https://www.viatosis.tech/viatosis-caption-lab'
            },
            body: JSON.stringify({
                videoId: videoId,
                country: "us"
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("Viatosis Error:", errText);
            return NextResponse.json({ error: `Viatosis API Error: ${res.status}` }, { status: res.status });
        }

        const data = await res.json();

        if (!data.ok || !data.data || !data.data.transcripts) {
            return NextResponse.json({ error: "No transcript found in Viatosis response." }, { status: 404 });
        }

        // 3. Map format
        const items = data.data.transcripts.map((t: any) => ({
            text: t.text,
            start: t.start,
            duration: t.duration
        }));

        return NextResponse.json({
            success: true,
            transcript: items,
            language_name: "English", // Default assumption
            available_languages: []
        });

    } catch (error: any) {
        console.error("Transcript API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
