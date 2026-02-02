
const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch if Node 18+

async function test() {
    const url = "https://test2-lac-gamma.vercel.app/api/chat/completions";
    console.log("Testing POST to:", url);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "chatgpt-5",
                messages: [{ role: "user", content: "hello" }]
            })
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
    } catch (e) {
        console.log("Error:", e);
    }
}

test();
