const fetch = require('node-fetch');

const PROXY = "https://corsproxy.io/?";
const VIDEO_ID = "jNQXAC9IVRw";
const URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

async function testCorsProxy() {
    console.log("Testing CORS Proxy...");
    const target = `${PROXY}${encodeURIComponent(URL)}`;
    console.log("Fetching:", target);

    try {
        const res = await fetch(target);
        if (!res.ok) {
            console.log(`Failed: ${res.status}`);
            return;
        }

        const html = await res.text();
        console.log("HTML Length:", html.length);

        const hasCaptions = html.indexOf('"captionTracks"') > -1;
        const isSignin = html.indexOf('Sign in') > -1;

        console.log("Has Captions:", hasCaptions);
        console.log("Is Signin:", isSignin);

        if (hasCaptions) {
            const match = html.match(/"captionTracks":(\[.*?\])/);
            if (match) {
                console.log("Found JSON:", match[1].slice(0, 100) + "...");
            }
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testCorsProxy();
