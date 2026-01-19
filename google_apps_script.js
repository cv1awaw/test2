// 100% FREE YOUTUBE TRANSCRIPT API (HOSTED ON GOOGLE)
// 1. Go to https://script.google.com/
// 2. Click "New Project"
// 3. Paste this code into Code.gs
// 4. Click "Deploy" -> "New Deployment" -> Select type "Web app"
// 5. Set "Who has access" to "Anyone"
// 6. Copy the "Web App URL" and use it in your project as 'GOOGLE_SCRIPT_URL'

function doGet(e) {
    try {
        var videoId = e.parameter.v; // ?v=VIDEO_ID
        var lang = e.parameter.lang || 'en';

        if (!videoId) {
            return jsonResponse({ error: "Missing 'v' parameter (YouTube Video ID)" });
        }

        // 1. Fetch Video Page to find Caption Tracks
        var videoPageUrl = "https://www.youtube.com/watch?v=" + videoId;
        var pageContent = UrlFetchApp.fetch(videoPageUrl, {
            muteHttpExceptions: true,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        }).getContentText();

        // 2. Extract "captionTracks" JSON
        var regex = /"captionTracks":(\[.*?\])/;
        var match = pageContent.match(regex);

        if (!match || !match[1]) {
            return jsonResponse({ error: "No captions found for this video. It might be age-restricted or have no subtitles." });
        }

        var tracks = JSON.parse(match[1]);

        // 3. Select the best track
        // Prioritize requested lang, then English, then first available
        var track = tracks.find(function (t) { return t.languageCode === lang; });
        if (!track) track = tracks.find(function (t) { return t.languageCode === 'en'; });
        if (!track) track = tracks[0];

        if (!track) {
            return jsonResponse({ error: "No suitable track found" });
        }

        // 4. Fetch the Transcript XML from the baseUrl
        var xmlContent = UrlFetchApp.fetch(track.baseUrl, { muteHttpExceptions: true }).getContentText();

        // 5. Parse XML to JSON
        var transcript = parseXmlTranscript(xmlContent);

        // 6. Return Result
        return jsonResponse({
            success: true,
            transcript: transcript,
            language: track.languageCode,
            language_name: track.name.simpleText
        });

    } catch (err) {
        return jsonResponse({ error: "Server Error: " + err.toString() });
    }
}

function parseXmlTranscript(xml) {
    var items = [];
    // Simple regex parser for <text start="X" dur="Y">Content</text>
    // Note: XmlService is better but regex is faster for this simple format
    var regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]+)<\/text>/g;
    var match;

    // HTML Entity Decoder helper
    var decode = function (str) {
        return str.replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    };

    while ((match = regex.exec(xml)) !== null) {
        items.push({
            start: parseFloat(match[1]),
            duration: parseFloat(match[2]),
            text: decode(match[3])
        });
    }
    return items;
}

function jsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
