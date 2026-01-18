
const INVIDIOUS_INSTANCES = [
    'https://inv.tux.pizza',
    'https://vid.puffyan.us',
    'https://invidious.jing.rocks',
    'https://yt.artemislena.eu',
    'https://invidious.projectsegfau.lt',
    'https://invidious.privacydev.net',
    'https://iv.ggtyler.dev',
    'https://invidious.lunar.icu',
    'https://inv.bp.projectsegfau.lt'
];

async function testInvidious(videoId) {
    for (const instance of INVIDIOUS_INSTANCES) {
        console.log(`Checking ${instance}...`);
        try {
            const res = await fetch(`${instance}/api/v1/captions/${videoId}`);
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const tracks = await res.json();
                console.log(`Tracks found: ${tracks.length}`);
                if (tracks.length > 0) {
                    const firstTrack = tracks[0];
                    console.log("First track:", firstTrack);

                    // Fetch the VTT content
                    const vttUrl = `${instance}${firstTrack.url}`;
                    console.log("Fetching VTT:", vttUrl);
                    const vttRes = await fetch(vttUrl);
                    if (vttRes.ok) {
                        const vttText = await vttRes.text();
                        console.log("VTT Start:", vttText.substring(0, 50).replace(/\n/g, '\\n'));
                        return; // Success
                    } else {
                        console.log("VTT fetch failed:", vttRes.status);
                    }
                }
            } else {
                const text = await res.text();
                console.log("Error body:", text.substring(0, 100));
            }
        } catch (e) {
            console.log("Fetch failed:", e.message);
        }
    }
}

testInvidious('PVEi8KnD56o');
