const fetch = require('node-fetch');

const LIST_URL = "https://raw.githubusercontent.com/TeamPiped/Piped-Backend/master/instances.json";
// Alternative lists or hardcoded checks if that fails
const FALLBACKS = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.io",
    "https://pipedapi.drgns.space",
    "https://api.piped.privacy.com.de",
    "https://pa.il.ax",
    "https://p.e4.qe",
    "https://pipedapi.smnz.de",
    "https://api-piped.mha.fi"
];

const VIDEO_ID = "jNQXAC9IVRw"; // Me at the zoo

async function findWorkingPiped() {
    console.log("Fetching Piped Instance List...");
    let instances = [];

    try {
        const res = await fetch(LIST_URL);
        if (res.ok) {
            const data = await res.json();
            // Data format: [ { name, api_url, locations, ... } ]
            instances = data.map(d => d.api_url);
        }
    } catch (e) {
        console.log("Failed to fetch list, using fallbacks.");
    }

    if (instances.length === 0) instances = FALLBACKS;

    // De-duplicate and Clean
    instances = [...new Set(instances)].filter(u => u && u.startsWith('http'));

    console.log(`Checking ${instances.length} instances...`);

    for (const url of instances) {
        // Strip trailing slash
        const base = url.replace(/\/$/, "");
        process.stdout.write(`Testing ${base} ... `);

        try {
            const start = Date.now();
            // Timeout 3s
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

            const res = await fetch(`${base}/streams/${VIDEO_ID}`, {
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (res.ok) {
                const data = await res.json();
                if (data.subtitles && data.subtitles.length > 0) {
                    console.log(`✅ OK (${Date.now() - start}ms)`);
                    console.log(`>>> FOUND WORKING INSTANCE: ${base} <<<`);
                    // Try to fetch one sub to be sure
                    const subUrl = data.subtitles[0].url;
                    console.log(`    Sub URL: ${subUrl}`);
                    return;
                } else {
                    console.log("❌ No Subs");
                }
            } else {
                console.log(`❌ ${res.status}`);
            }
        } catch (e) {
            console.log(`❌ Error (${e.code || e.message})`);
        }
    }
    console.log("No working instances found.");
}

findWorkingPiped();
