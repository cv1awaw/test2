
const COBALT_INSTANCES = [
    'https://co.wuk.sh',
    'https://api.cobalt.tools',
    'https://cobalt.steamodded.eu',
    'https://dl.khub.ky'
];

async function testCobalt(videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    for (const instance of COBALT_INSTANCES) {
        console.log(`Checking ${instance}...`);
        try {
            const res = await fetch(`${instance}/api/json`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    isAudioOnly: true
                })
            });

            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const data = await res.json();
                console.log("Response:", JSON.stringify(data).substring(0, 200));

                // Cobalt might not return subtitles in the main JSON unless configured?
                // But let's see what we get.
            } else {
                console.log("Error body:", (await res.text()).substring(0, 100));
            }
        } catch (e) {
            console.log("Fetch failed:", e.message);
        }
    }
}

testCobalt('PVEi8KnD56o');
