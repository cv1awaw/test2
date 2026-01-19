// 100% FREE YOUTUBE TRANSCRIPT API (V9 - VIATOSIS PROXY)
// This version routes through the Viatosis backend which is currently working.

function doGet(e) {
    var videoId = e.parameter.v;
    var lang = e.parameter.lang || 'en';

    if (!videoId) return jsonResponse({ status: "active", version: "v9-viatosis" });

    try {
        var url = "https://www.viatosis.tech/api/youtube-transcripts";
        var payload = {
            videoId: videoId,
            country: "us"
        };

        var response = UrlFetchApp.fetch(url, {
            method: 'post',
            contentType: 'application/json',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://www.viatosis.tech',
                'Referer': 'https://www.viatosis.tech/viatosis-caption-lab'
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });

        var responseCode = response.getResponseCode();
        if (responseCode !== 200) {
            return jsonResponse({ error: "Viatosis Proxy Failed: " + responseCode + " " + response.getContentText() });
        }

        var data = JSON.parse(response.getContentText());

        if (!data.ok || !data.data || !data.data.transcripts) {
            return jsonResponse({ error: "No transcript found in Viatosis response." });
        }

        // Map their format to ours
        var items = data.data.transcripts.map(function (t) {
            return {
                text: t.text,
                start: t.start,
                duration: t.duration
            };
        });

        return jsonResponse({
            success: true,
            transcript: items,
            language: "en", // they seem to default to english/auto
            language_name: "English",
            source: "Viatosis Proxy"
        });

    } catch (err) {
        return jsonResponse({ error: "Server Error: " + err.toString() });
    }
}

function jsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
