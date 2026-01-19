
import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Use Edge for speed

export async function POST(req: Request) {
    try {
        const { url, lang } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // 1. Check for API Key
        const apiKey = process.env.SUPADATA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                error: "Missing API Key. Please get a free key from https://supadata.ai and add 'SUPADATA_API_KEY' to your .env file.",
                success: false
            }, { status: 401 });
        }

        console.log(`[Supadata] Fetching transcript for ${url} (Lang: ${lang || 'en'})`);

        // 2. Call Supadata API
        // Doc: GET https://api.supadata.ai/v1/transcript?url=...&lang=...
        const apiUrl = new URL('https://api.supadata.ai/v1/transcript');
        apiUrl.searchParams.set('url', url);
        if (lang) apiUrl.searchParams.set('lang', lang);

        const res = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("[Supadata] Error:", data);
            return NextResponse.json({
                error: `Supadata API Error: ${data.message || res.statusText}`,
                success: false
            }, { status: res.status });
        }

        // 3. Transform Response
        // Supadata returns: { content: "...", segments: [{ text, start, duration, offset }] }
        // We need to map it to our format: { text, start, duration }

        if (!data.segments) {
            return NextResponse.json({ error: "No transcript segments found.", success: false });
        }

        const transcript = data.segments.map((s: any) => ({
            text: s.text,
            start: s.start, // or s.offset
            duration: s.duration
        }));

        return NextResponse.json({
            success: true,
            transcript: transcript,
            language_name: data.language || lang || 'Unknown',
            available_languages: [] // Supadata might not return list of *other* languages easily in one call, but that's fine.
        });

    } catch (error: any) {
        console.error("Transcript API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
