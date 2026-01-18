
import { NextRequest, NextResponse } from 'next/server';
import { Innertube, UniversalCache } from 'youtubei.js';
import { YoutubeTranscript } from 'youtube-transcript';
// @ts-ignore
import { HttpsProxyAgent } from 'https-proxy-agent';

// Singleton instance for performance
let youtube: Innertube | null = null;

async function getYoutube() {
    if (!youtube) {
        try {
            console.log("[Transcript] Initializing Innertube with ANDROID client...");

            const options: any = {
                cache: new UniversalCache(false),
                generate_session_locally: true,
                retrieve_player: false,
                // @ts-ignore
                device_type: 'ANDROID' // Force Android client
            };

            // Add Proxy if available in Env
            if (process.env.PROXY_URL) {
                console.log("[Transcript] Using Proxy: " + process.env.PROXY_URL);
                options.http_agent = new HttpsProxyAgent(process.env.PROXY_URL);
            }

            youtube = await Innertube.create(options);
        } catch (e) {
            console.error("Innertube Init Error:", e);
            throw e;
        }
    }
    return youtube;
}

export const maxDuration = 60; // Allow 60 seconds for execution

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, lang } = body;
        console.log(`[Transcript] Request for URL: ${url}, Lang: ${lang}`);

        if (!url) {
            return NextResponse.json({ error: "Missing URL" }, { status: 400 });
        }

        const videoIdMatch = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        const yt = await getYoutube();
        let errorLog: string[] = [];

        // 0. Get Basic Info
        let info;
        try {
            console.log(`[Transcript] Fetching info for ${videoId}`);
            info = await yt.getInfo(videoId);
            console.log(`[Transcript] Info fetched. Title: ${info.basic_info.title}`);
        } catch (e: any) {
            console.error("[Transcript] getInfo failed:", e);
            return NextResponse.json({ error: `Video unavailable: ${e.message}` }, { status: 404 });
        }

        // Prepare available languages for decision making
        const captionTracks = info.captions?.caption_tracks || [];
        const availableLanguages = captionTracks.map((track: any) => ({
            code: track.language_code,
            name: track.name.text,
            is_generated: track.kind === 'asr',
            url: track.base_url
        }));

        // Determine target language (User preference > First available > 'en')
        const targetLang = lang || (availableLanguages.length > 0 ? availableLanguages[0].code : 'en');
        console.log(`[Transcript] Targets: RequestLang=${lang}, DetectedFirst=${availableLanguages[0]?.code}, FinalTarget=${targetLang}`);

        // 1. Try Innertube Transcript
        let transcriptData: any = null;
        try {
            console.log(`[Transcript] Attempting Innertube transcript fetch...`);
            transcriptData = await info.getTranscript();
        } catch (innerError: any) {
            const msg = `Innertube Method Failed: ${innerError.message}`;
            console.error(msg);
            errorLog.push(msg);

            // 1b. Manual XML Fetch (Robust Fallback for 400 errors)
            try {
                if (captionTracks.length > 0) {
                    // Find best track (try to match targetLang, otherwise first)
                    const sortTracks = [...captionTracks].sort((a: any, b: any) => {
                        if (a.language_code === targetLang) return -1;
                        if (b.language_code === targetLang) return 1;
                        return 0;
                    });
                    const bestTrack = sortTracks[0];
                    console.log(`[Transcript] Manual fetch using track: ${bestTrack.language_code}`);

                    if (bestTrack.base_url) {
                        // ADD HEADERS HERE to mimic browser
                        const xmlRes = await fetch(bestTrack.base_url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Referer': 'https://www.youtube.com/',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                            }
                        });

                        if (!xmlRes.ok) throw new Error(`XML fetch status: ${xmlRes.status}`);

                        const xmlText = await xmlRes.text();

                        // Simple Regex Parse
                        const items = [];
                        const regex = /<text start="([\d.]+)" dur="([\d.]+)">([^<]+)<\/text>/g;
                        let match;
                        while ((match = regex.exec(xmlText)) !== null) {
                            items.push({
                                text: match[3]
                                    .replace(/&amp;/g, '&')
                                    .replace(/&quot;/g, '"')
                                    .replace(/&#39;/g, "'")
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>'),
                                offset: { seconds: parseFloat(match[1]) },
                                duration: { seconds: parseFloat(match[2]) }
                            });
                        }

                        if (items.length > 0) {
                            transcriptData = { transcript: items };
                            console.log(`[Transcript] Manual XML parse successful. Items: ${items.length}`);
                        } else {
                            throw new Error("XML parsed but no items found");
                        }
                    }
                } else {
                    throw new Error("No caption tracks available for manual fetch");
                }
            } catch (manualError: any) {
                const msg = `Manual XML Method Failed: ${manualError.message}`;
                console.error(msg);
                errorLog.push(msg);
            }
        }

        // 2. Fallback to youtube-transcript library
        let fallbackTranscript: any = null;
        if (!transcriptData) {
            try {
                console.log(`[Transcript] Attempting fallback with youtube-transcript using lang: ${targetLang}...`);

                // @ts-ignore
                const backupData = await YoutubeTranscript.fetchTranscript(videoId, { lang: targetLang });

                fallbackTranscript = {
                    transcript: backupData.map((item: any) => ({
                        text: item.text,
                        offset: { seconds: item.offset / 1000 },
                        duration: { seconds: item.duration / 1000 }
                    }))
                };
                console.log(`[Transcript] Fallback successful.`);
            } catch (fallbackError: any) {
                const msg = `YoutubeTranscript (Lang=${targetLang}) Failed: ${fallbackError.message}`;
                console.error(msg);
                errorLog.push(msg);

                // 2b. BLIND FALLBACK: Try without any language param (let library decide)
                try {
                    console.log(`[Transcript] Attempting BLIND fallback (no lang)...`);
                    // @ts-ignore
                    const blindData = await YoutubeTranscript.fetchTranscript(videoId);

                    fallbackTranscript = {
                        transcript: blindData.map((item: any) => ({
                            text: item.text,
                            offset: { seconds: item.offset / 1000 },
                            duration: { seconds: item.duration / 1000 }
                        }))
                    };
                    console.log(`[Transcript] Blind fallback successful.`);
                } catch (blindError: any) {
                    const msg = `Blind Fallback Failed: ${blindError.message}`;
                    console.error(msg);
                    errorLog.push(msg);
                }
            }
        }

        // 3. Select Data
        let selectedTranscript = transcriptData || fallbackTranscript;

        if (!selectedTranscript) {
            // Return detailed errors to help debug
            return NextResponse.json({
                error: "No transcript found. All methods failed.",
                debug_log: errorLog
            }, { status: 404 });
        }

        // 4. Handle Language Selection (Only applicable if Innertube succeeded and has tracks)
        if (lang && transcriptData && !fallbackTranscript) {
            // Only try selecting language if we are using Innertube data
            try {
                // @ts-ignore 
                const translated = await transcriptData.selectLanguage(lang);
                if (translated) selectedTranscript = translated;
            } catch (e) {
                console.log(`Could not select language ${lang}, falling back.`);
            }
        }

        // 5. Normalize Output
        const segments = (selectedTranscript as any).transcript || [];

        const normalizedTranscript = segments.map((seg: any) => ({
            text: seg.text || "",
            start: Number(seg.offset?.seconds || seg.offset || 0),
            duration: Number(seg.duration?.seconds || seg.duration || 0)
        }));

        return NextResponse.json({
            success: true,
            video_id: videoId,
            language_code: lang || "en",
            language_name: lang || "Default",
            available_languages: availableLanguages,
            transcript: normalizedTranscript
        });

    } catch (e: any) {
        return NextResponse.json({ error: "Server Error: " + e.message }, { status: 500 });
    }
}
