const fetch = require('node-fetch');

const URL = "https://www.viatosis.tech/api/youtube-transcripts";
const VIDEO_ID = "jNQXAC9IVRw";

async function testViatosis() {
    console.log("Testing Viatosis Backend...");

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Mimic browser headers slightly to avoid basic bot blocks
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://www.viatosis.tech',
                'Referer': 'https://www.viatosis.tech/viatosis-caption-lab'
            },
            body: JSON.stringify({
                videoId: VIDEO_ID,
                country: "us"
            })
        });

        console.log(`Status: ${res.status}`);

        if (!res.ok) {
            console.log("Error:", await res.text());
            return;
        }

        const data = await res.json();
        console.log("Success!");
        console.log(JSON.stringify(data, null, 2).slice(0, 500));

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

testViatosis();
