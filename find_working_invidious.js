const fetch = require('node-fetch');

const LIST_URL = "https://api.invidious.io/instances.json?sort_by=health";
const VIDEO_ID = "jNQXAC9IVRw";

async function findInvidious() {
    console.log("Fetching Invidious List...");
    let instances = [];

    try {
        const res = await fetch(LIST_URL);
        if (res.ok) {
            const data = await res.json();
            // Flatten generic structure
            // format: [ [name, { uri, type, api: true ... }] ]
            data.forEach(group => {
                const uri = group[1].uri;
                const api = group[1].api;
                const type = group[1].type;
                if (api && type === 'https') {
                    instances.push(uri);
                }
            });
        }
    } catch (e) {
        console.log("Failed to fetch list.");
    }

    // Fallbacks
    if (instances.length === 0) {
        instances = [
            "https://inv.nadeko.net",
            "https://invidious.drgns.space",
            "https://vid.puffyan.us",
            "https://invidious.fdn.fr"
        ];
    }

    // Limit to top 15 to save time
    instances = instances.slice(0, 15);
    console.log(`Checking ${instances.length} instances...`);

    for (const base of instances) {
        const url = base.replace(/\/$/, "");
        process.stdout.write(`Testing ${url} ... `);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            // Invidious API: /api/v1/captions/VIDEO_ID
            const res = await fetch(`${url}/api/v1/captions/${VIDEO_ID}`, {
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (res.ok) {
                const data = await res.json();
                // Expect array of captions
                if (data.captions) { // V1 structure sometimes { captions: [...] } or just [...]
                    console.log("✅ OK (V1 Object)");
                    console.log(`>>> FOUND: ${url} <<<`);
                    return;
                } else if (Array.isArray(data) && data.length > 0) {
                    console.log("✅ OK (Array)");
                    console.log(`>>> FOUND: ${url} <<<`);
                    return;
                } else {
                    console.log("❌ Empty response");
                }
            } else {
                console.log(`❌ ${res.status}`);
            }
        } catch (e) {
            console.log(`❌ Error`);
        }
    }
    console.log("No working Invidious instances found.");
}

findInvidious();
