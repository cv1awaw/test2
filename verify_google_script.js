const fetch = require('node-fetch');

// User provided URL (V4)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwPvzAmNC4DM7TbqHm9MxVOLtXzawJIDm3Ja4qLfyeF7a4yugxdIjlXAaJtLpyUkgWo2A/exec";
const VIDEO_ID = "jNQXAC9IVRw"; // Me at the zoo (Control Test)

async function testScript() {
    console.log("Testing Google Script URL...");
    console.log("URL:", SCRIPT_URL);
    console.log("Video:", VIDEO_ID);
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
