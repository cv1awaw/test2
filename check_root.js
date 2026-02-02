const fetch = require('node-fetch');

async function checkRoot() {
    console.log("Checking Root...");
    const res = await fetch("https://youtube-transcript-api-tau-one.vercel.app/");
    console.log(await res.text());
}
checkRoot();
