const fetch = require('node-fetch');

// Check the docs to find the real endpoint
const URL = "https://youtube-transcript-api-tau-one.vercel.app/openapi.json";

async function checkDocs() {
    try {
        const res = await fetch(URL);
        if (res.ok) {
            const data = await res.json();
            console.log("Found OpenAPI Spec!");
            // Log paths
            console.log("Paths:", JSON.stringify(data.paths, null, 2));
        } else {
            console.log("No OpenAPI found at /openapi.json");
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}

checkDocs();
