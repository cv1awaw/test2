// 100% FREE YOUTUBE TRANSCRIPT API (V3 - PLAYER RESPONSE)
// 1. Go to https://script.google.com/
// 2. Paste this code into Code.gs (Overwrite everything)
// 3. Click "Deploy" -> "Manage Deployments" -> Edit -> Upload New Version -> Deploy
// 4. Use the same URL.

function doGet(e) {
    try {
        var videoId = e.parameter.v;
        var lang = e.parameter.lang || 'en';
        if (!videoId) return jsonResponse({ error: "Missing 'v' param" });

        // 1. Try Desktop Page
        var transcript = fetchTranscript(videoId, lang, false);

        // 2. Try Mobile Page
        if (!transcript) {
            transcript = fetchTranscript(videoId, lang, true);
        }

        if (!transcript) {
            return jsonResponse({ error: "No captions found. Video might be age-gated/region-locked." });
        }

        return jsonResponse({
            success: true,
            transcript: transcript.items,
            language: transcript.langCode,
            language_name: transcript.langName
        });

    } catch (err) {
        return jsonResponse({ error: "Server Error: " + err.toString() });
    }
}

function fetchTranscript(videoId, targetLang, useMobile) {
    var url = useMobile
        ? "https://m.youtube.com/watch?v=" + videoId
        : "https://www.youtube.com/watch?v=" + videoId;

    var ua = useMobile
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

    var pageContent = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
            "User-Agent": ua,
            "Accept-Language": "en-US,en;q=0.9",
            "Cookie": "CONSENT=YES+cb.20210328-17-p0.en+FX+417;"
        }
    }).getContentText();

    // Strategy A: Direct captionTracks regex
    var tracks = extractTracks(pageContent, /"captionTracks":(\[.*?\])/);

    // Strategy B: player_response regex (often escaped)
    if (!tracks) {
        var playerResp = extractAuth(pageContent, /var ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (playerResp) {
            if (playerResp.captions && playerResp.captions.playerCaptionsTracklistRenderer) {
                tracks = playerResp.captions.playerCaptionsTracklistRenderer.captionTracks;
            }
        }
    }

    if (!tracks) return null;

    // Filter Track
    var track = tracks.find(function (t) { return t.languageCode === targetLang; });
    if (!track) track = tracks.find(function (t) { return t.languageCode === 'en'; });
    if (!track) track = tracks[0];

    if (!track) return null;

    // Fetch XML
    var xmlContent = UrlFetchApp.fetch(track.baseUrl, { muteHttpExceptions: true }).getContentText();
    var items = parseXmlTranscript(xmlContent);

    return {
        items: items,
        langCode: track.languageCode,
        langName: track.name.simpleText
    };
}

function extractTracks(html, regex) {
    var match = html.match(regex);
    if (match && match[1]) {
        return JSON.parse(match[1]);
    }
    return null;
}

function extractAuth(html, regex) {
    var match = html.match(regex);
    if (match && match[1]) {
        try {
            return JSON.parse(match[1]);
        } catch (e) { }
    }
    return null;
}

function parseXmlTranscript(xml) {
    var items = [];
    var regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]+)<\/text>/g;
    var match;

    var decode = function (str) {
        if (!str) return "";
        return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\+/g, ' ');
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
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
