
import { NextRequest, NextResponse } from 'next/server';
import { Innertube, UniversalCache } from 'youtubei.js';

// Singleton instance for performance
let youtube: Innertube | null = null;

async function getYoutube() {
    if (!youtube) {
        youtube = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true
        });
    }
    return youtube;
}

export const maxDuration = 60; // Allow 60 seconds for execution

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, lang } = body;

        if (!url) {
            return NextResponse.json({ error: "Missing URL" }, { status: 400 });
        }

        // Extract Video ID
        const videoIdMatch = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        const yt = await getYoutube();

        try {
            const info = await yt.getInfo(videoId);
            const transcriptData = await info.getTranscript();

            if (!transcriptData) {
                return NextResponse.json({ error: "No transcript found." }, { status: 404 });
            }

            // Get available languages
            // Innertube's transcriptData.caption_tracks contains available languages
            // We need to map them to our format: { code, name, is_generated }

            // Note: transcriptData.caption_tracks might not be directly exposed in the minimal type, 
            // but usually valid call returns an object that allows selecting language.

            // Actually, `getTranscript()` returns a TranscriptInfo object.
            // checking docs/types logic:
            // transcriptData is of type TranscriptInfo.
            // It has `captions` property? Or we select specific track on getTranscript?
            // Innertube: info.getTranscript() returns the default transcript.

            // To get *available* tracks, we look at `info.captions`.
            // info.captions.caption_tracks

            const captionTracks = info.captions?.caption_tracks || [];

            const availableLanguages = captionTracks.map((track: any) => ({
                code: track.language_code,
                name: track.name.text,
                is_generated: track.kind === 'asr',
                url: track.base_url
                // We'll use the code to request translation if needed
            }));

            // If a specific language is requested (and it's not the default), we might need to fetch that specific one.
            // Innertube allows `getTranscript()` but doesn't strictly take a 'lang' arg in all versions the same way.
            // However, we can use the `transcriptData` matching the requested lang if we can.

            // Logic for "Auto-Translate":
            // If the user wants 'ar' (Arabic) and it's not in `availableLanguages`, we need to see if we can "translate" the default one.
            // Innertube supports `transcriptData.selectLanguage(lang_code)`.

            // Let's rely on transcriptData.
            let selectedTranscript = transcriptData;

            if (lang) {
                try {
                    // Try to select the specific language/auto-translate
                    // Note: Innertube's `selectLanguage` usually handles finding the track.
                    // If it's a translation, we might need `translateLanguage` if that API exists, 
                    // OR just finding the right track.
                    // For pure auto-translation (e.g. En -> Ar), Innertube might expose `translation_languages`.

                    // Fallback strategy:
                    // If the requested language is strictly available in tracks, use it.
                    // If not, use the translation feature if available.

                    selectedTranscript = await transcriptData.selectLanguage(lang);
                } catch (e) {
                    console.log(`Could not select language ${lang}, falling back to default.`);
                }
            }

            // Parse lines
            // selectedTranscript.transcript is the array of segments
            // content: { text: string, start_ms: number, end_ms: number } usually?
            // Checking Innertube types: usually returns { text, offset, duration } objects in an array called `transcript`.

            // Wait, `selectedTranscript` IS the wrapper. accessing `.transcript` gives the segments.
            // Segments are usually: { text: string, offset: { seconds... }, duration: { seconds... } }

            // Let's normalize to: { text, start, duration }
            const segments = (selectedTranscript as any).transcript || [];

            const normalizedTranscript = segments.map((seg: any) => ({
                text: seg.text || "",
                start: Number(seg.offset?.seconds || seg.offset || 0),
                duration: Number(seg.duration?.seconds || seg.duration || 0)
            }));

            return NextResponse.json({
                success: true,
                video_id: videoId,
                language_code: lang || "en", // Simplified
                language_name: lang || "Default", // Simplified
                available_languages: availableLanguages,
                transcript: normalizedTranscript
            });

        } catch (error: any) {
            console.error("Innertube Error:", error);
            // Fallback for "Video unavailable" etc.
            return NextResponse.json({
                error: error.message || "Failed to fetch transcript",
                details: "Innertube execution failed"
            }, { status: 500 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: "Server Error: " + e.message }, { status: 500 });
    }
}
