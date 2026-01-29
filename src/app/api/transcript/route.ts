
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

        // --- SECURITY GUARD ---
        // Prevent others from "stealing" or using your API.
        const origin = req.headers.get('origin');
        const referer = req.headers.get('referer');

        // Allow requests ONLY from your hosted domain and localhost (for testing)
        // We check if the request comes from "vercel.app" or "localhost"
        const isAllowed = (origin && (origin.includes('vercel.app') || origin.includes('localhost'))) ||
            (referer && (referer.includes('vercel.app') || referer.includes('localhost')));

        if (!isAllowed) {
            console.error(`[Security] Blocked request from: ${origin || referer}`);
            return NextResponse.json({ error: "Access Denied. This API is protected." }, { status: 403 });
        }
        // ----------------------

        console.log(`[ViatosisProxy] Fetching transcript for ${videoId}...`);

        // 2. Call Viatosis Backend directly (Bypassing Google Script)
        // This acts as a client-side fetch from the User's local server.
        // It keeps the User totally free from deploying Google Scripts.
        const VIATOSIS_URL = "https://www.viatosis.tech/api/youtube-transcripts";

        // Note: URL is hardcoded per user request. 
        // Security is handled by the Origin/Referer check above.

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
                lang: lang || 'en', // Forward the requested language
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
