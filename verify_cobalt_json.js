const fetch = require('node-fetch');

// Cobalt Public API (often updated, check cobalt.tools/instances for others)
const COBALT_API = "https://api.cobalt.tools/api/json";
const VIDEO_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw"; // Me at the zoo

async function testCobalt() {
    console.log("Testing Cobalt API for Subtitles...");

    try {
        const res = await fetch(COBALT_API, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: VIDEO_URL,
                downloadMode: "auto", // or "audio" to be lighter?
                subtitles: "json" // Request subtitles as JSON
            })
        });

        if (!res.ok) {
            console.log(`Status: ${res.status}`);
            const txt = await res.text();
            console.log("Body:", txt);
            return;
        }

        const data = await res.json();
        console.log("Success!");
        console.log("Data keys:", Object.keys(data));

        // Check for subtitles logic (Cobalt might return a separate URL or embedded)
        console.log("Full Response:", JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testCobalt();
