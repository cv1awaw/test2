
async function testDynamicInvidious(videoId) {
    try {
        console.log("Fetching instance list...");
        const listRes = await fetch('https://api.invidious.io/instances.json?sort_by=health');
        if (!listRes.ok) throw new Error("Could not fetch instance list");

        const data = await listRes.json();

        // Find API enabled instances
        const candidates = data.filter(item => {
            const [domain, meta] = item;
            return meta.type === 'https' && meta.api === true;
        });

        console.log(`Found ${candidates.length} API-enabled candidates.`);

        // Test the top 5
        const top5 = candidates.slice(0, 5);

        for (const item of top5) {
            const domain = item[0];
            const instance = `https://${domain}`;
            console.log(`Checking ${instance}...`);
            try {
                // Fetch captions list
                const res = await fetch(`${instance}/api/v1/captions/${videoId}`);
                if (res.ok) {
                    const tracks = await res.json();
                    if (tracks.length > 0) {
                        console.log(`SUCCESS: ${instance} returned ${tracks.length} tracks.`);
                        const vttRes = await fetch(`${instance}${tracks[0].url}`);
                        if (vttRes.ok) {
                            console.log("VTT Fetch verified.");
                            console.log(await vttRes.text().then(t => t.substring(0, 50)));
                            return;
                        }
                    }
                } else {
                    console.log(`Failed (Status ${res.status})`);
                }
            } catch (e) {
                console.log(`Error: ${e.message}`);
            }
        }

    } catch (e) {
        console.error("Global error:", e);
    }
}

testDynamicInvidious('PVEi8KnD56o');
