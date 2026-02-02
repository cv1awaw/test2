const fetch = require('node-fetch');

// List of potential V10-compatible public instances
const INSTANCES = [
    "https://api.cobalt.tools", // Official (might rate limit)
    "https://cobalt.da.gd",
    "https://cobalt.tools",
    "https://api.cobalt.7.5.2.2.ip6.name",
    "https://co.wuk.sh"
];

const VIDEO_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw"; // Me at the zoo

async function testCobaltV10() {
    console.log("Testing Cobalt V10 API Instances for JSON Subtitles...");

    for (const base of INSTANCES) {
        console.log(`\nTesting: ${base}`);
        // V10 endpoint is usually just POST /
        const url = `${base}/`; // or /api/json depending on version, V10 document says POST /

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: VIDEO_URL,
                    downloadMode: "auto",
                    subtitles: "json"
                })
            });

            if (!res.ok) {
                console.log(`Failed ${res.status}: ${await res.text().catch(e => e.message)}`);
                continue;
            }

            const txt = await res.text();
            let data;
            try { data = JSON.parse(txt); } catch (e) { console.log("Invalid JSON"); continue; }

            console.log("Success!");
            // Check if status is error inside JSON
            if (data.status === 'error') {
                console.log("API returned error:", data.text);
                continue;
            }

            console.log("Keys:", Object.keys(data));
            if (data.url) console.log("Download URL:", data.url);

            // Just need one working
            break;
        } catch (e) {
            console.error("Connection Error:", e.message);
        }
    }
}

testCobaltV10();
