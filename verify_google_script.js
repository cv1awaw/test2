const fetch = require('node-fetch');

// User provided URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyDENL0LaKRQH6k5qhyBJy66vLdQ609batNQcbRrP_NNDpK70X72VLt_eizIoOUo1h3sg/exec";
const VIDEO_ID = "PVEi8KnD56o"; // Previous test video

async function testScript() {
    console.log("Testing Google Script URL...");
    const url = `${SCRIPT_URL}?v=${VIDEO_ID}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status}`);
        }

        const data = await res.json();
        console.log("Status:", data.success ? "SUCCESS" : "FAILED");
        if (data.transcript) {
            console.log("Transcript found!");
            console.log("First line:", data.transcript[0]);
            console.log("Total lines:", data.transcript.length);
        } else {
            console.log("Error from Script:", data.error);
        }
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testScript();
