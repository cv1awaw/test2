const fetch = require('node-fetch');

const URL = "https://youtube-transcript-api-tau-one.vercel.app/transcript";

async function testJayPaun() {
    console.log("Testing JayPaun API (Example Video)...");

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: "https://www.youtube.com/watch?v=gTfsFeXgoKI"
            })
        });

        const data = await res.json();
        console.log("FULL DATA:");
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Failed:", e.message);
    }
}

testJayPaun();
