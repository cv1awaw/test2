const fetch = require('node-fetch');

// Candidate 1: JayPaun's deployment (from search results)
// Candidate 2: TubeText (from search results)
const CANDIDATES = [
    "https://youtube-transcript-api-tau-one.vercel.app/transcript?video_id=jNQXAC9IVRw",
    "https://tubetext.vercel.app/api/transcript?url=https://www.youtube.com/watch?v=jNQXAC9IVRw"
];

async function testCommunityAPIs() {
    console.log("Testing Community Vercel Deployments...");

    for (const url of CANDIDATES) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await fetch(url);
            console.log(`Status: ${res.status}`);

            if (!res.ok) {
                console.log("Error:", await res.text().catch(e => e.message));
                continue;
            }

            const data = await res.json();
            console.log("Success! JSON Keys:", Object.keys(data));

            // Allow user to see structure
            if (Array.isArray(data)) {
                console.log("Format: Array of Objects (Standard)");
                console.log("First Item:", data[0]);
            } else if (data.transcript) {
                console.log("Format: { transcript: ... }");
            }

        } catch (e) {
            console.error("Failed:", e.message);
        }
    }
}

testCommunityAPIs();
