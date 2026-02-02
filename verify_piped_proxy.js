const fetch = require('node-fetch');

// List of top Piped instances
const INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.io",
    "https://pipedapi.drgns.space",
    "https://api.piped.privacy.com.de"
];
const VIDEO_ID = "jNQXAC9IVRw";

async function testPiped() {
    console.log("Testing Piped API Instances...");

    for (const base of INSTANCES) {
        console.log(`\nTesting: ${base}`);
        try {
            const res = await fetch(`${base}/streams/${VIDEO_ID}`);
            if (!res.ok) {
                console.log(`Failed: ${res.status}`);
                continue;
            }
            const data = await res.json();

            if (data.subtitles && data.subtitles.length > 0) {
                console.log("SUCCESS! Found subtitles.");
                console.log("First Sub:", data.subtitles[0]);

                // Test Fetching actual VTT/JSON
                const subUrl = data.subtitles[0].url;
                console.log("Fetching sub content from:", subUrl);
                const subRes = await fetch(subUrl);
                const subText = await subRes.text();
                console.log("Sub content length:", subText.length);
                return; // Found one that works
            } else {
                console.log("No subtitles found in response.");
            }

        } catch (e) {
            console.error("Error:", e.message);
        }
    }
}

testPiped();
