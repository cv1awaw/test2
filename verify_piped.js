
const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.privacy.com.de',
    'https://pipedapi.tokhmi.xyz',
    'https://api.piped.otbea.org',
    'https://pipedapi.aeong.one',
    'https://pipedapi.smnz.de',
    'https://api.piped.projectsegfau.lt',
    'https://pipedapi.in.projectsegfau.lt',
    'https://api.piped.r4fo.com',
    'https://pipedapi.lunar.icu',
    'https://pipedapi.adminforge.de',
    'https://api.piped.yt.drgnz.club'
];

async function testPiped(videoId) {
    for (const instance of PIPED_INSTANCES) {
        console.log(`Checking ${instance}...`);
        try {
            const res = await fetch(`${instance}/streams/${videoId}`);
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const data = await res.json();
                const subtitles = data.subtitles || [];
                console.log(`Subtitles found: ${subtitles.length}`);
                if (subtitles.length > 0) {
                    console.log("First subtitle:", subtitles[0]);

                    // Try to fetch vtt
                    const vttRes = await fetch(subtitles[0].url);
                    const vttText = await vttRes.text();
                    console.log("VTT Start:", vttText.substring(0, 100));
                    return;
                }
            } else {
                const text = await res.text();
                console.log("Error body:", text.substring(0, 200));
            }
        } catch (e) {
            console.log("Fetch failed:", e.message);
        }
    }
}

testPiped('PVEi8KnD56o');
