
const VIDEO_ID = '-g4vvXrnEOY'; // The specific video failing for the user

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
    'https://api.piped.yt.drgnz.club',
    'https://pipedapi.ducks.party',
    'https://pipedapi.nosebs.ru',
    'https://api.piped.frontendfriendly.xyz'
];

const INVIDIOUS_INSTANCES = [
    'https://inv.tux.pizza',
    'https://vid.puffyan.us',
    'https://invidious.jing.rocks',
    'https://yt.artemislena.eu',
    'https://invidious.projectsegfau.lt',
    'https://invidious.privacydev.net',
    'https://iv.ggtyler.dev',
    'https://invidious.lunar.icu',
    'https://inv.bp.projectsegfau.lt',
    'https://yewtu.be',
    'https://invidious.drgns.space',
    'https://invidious.fdn.fr',
    'https://invidious.perennialteks.com',
    'https://invidious.no-logs.com',
    'https://inv.zzls.xyz'
];

async function verifyAll() {
    console.log(`Verifying instances for Video ID: ${VIDEO_ID}`);
    const working = [];

    // Check Piped
    console.log('\n--- CHECKING PIPED ---');
    for (const instance of PIPED_INSTANCES) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`${instance}/streams/${VIDEO_ID}`, { signal: controller.signal });
            clearTimeout(id);

            if (res.ok) {
                const data = await res.json();
                const subs = data.subtitles || [];
                if (subs.length > 0) {
                    console.log(`✅ MATCH: ${instance} (${subs.length} subs)`);

                    // Verify VTT fetch
                    const vttRes = await fetch(subs[0].url);
                    if (vttRes.ok) {
                        console.log(`   -> VTT content verified.`);
                        working.push({ type: 'piped', url: instance });
                    }
                } else {
                    console.log(`❌ ${instance} (No subtitles)`);
                }
            } else {
                console.log(`❌ ${instance} (Status ${res.status})`);
            }
        } catch (e) {
            console.log(`❌ ${instance} (${e.message})`);
        }
    }

    // Check Invidious (Backup)
    console.log('\n--- CHECKING INVIDIOUS ---');
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`${instance}/api/v1/captions/${VIDEO_ID}`, { signal: controller.signal });
            clearTimeout(id);

            if (res.ok) {
                const tracks = await res.json();
                if (tracks.length > 0) {
                    console.log(`✅ MATCH: ${instance} (${tracks.length} tracks)`);
                    working.push({ type: 'invidious', url: instance });
                } else {
                    console.log(`❌ ${instance} (No tracks)`);
                }
            } else {
                console.log(`❌ ${instance} (Status ${res.status})`);
            }
        } catch (e) {
            console.log(`❌ ${instance} (${e.message})`);
        }
    }

    console.log('\n=== WORKING INSTANCES ===');
    console.log(JSON.stringify(working, null, 2));
}

verifyAll();
