// 100% FREE YOUTUBE TRANSCRIPT API (V5 - ANDROID CLIENT)
// This version uses the Mobile App API which is much harder to block.

// 1. Paste into Code.gs
// 2. Deploy -> Manage Deployments -> New Version -> Deploy

function doGet(e) {
    try {
        var videoId = e.parameter.v;
        var lang = e.parameter.lang || 'en';
        if (!videoId) return jsonResponse({ error: "Missing 'v' param" });

        // Try Android Client (Most Robust)
        var transcript = fetchTranscript(videoId, lang);

        if (!transcript) {
            return jsonResponse({ error: "No captions found. Video might be age-gated." });
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

function fetchTranscript(videoId, targetLang) {
    // ANDROID CLIENT PAYLOAD (Bypasses most blocks)
    var payload = {
        context: {
            client: {
                clientName: 'ANDROID',
                clientVersion: '16.20.35',
                hl: 'en',
                gl: 'US',
                androidSdkVersion: 29
            }
        },
        videoId: videoId
    };

    var response = UrlFetchApp.fetch("https://www.youtube.com/youtubei/v1/player", {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    });

    var text = response.getContentText();
    var data = JSON.parse(text);

    // 2. Extract Captions
    var tracks = null;
    if (data.captions && data.captions.playerCaptionsTracklistRenderer) {
        tracks = data.captions.playerCaptionsTracklistRenderer.captionTracks;
    }

    if (!tracks) return null;

    // 3. Find Best Track
    var track = tracks.find(function (t) { return t.languageCode === targetLang; });
    if (!track) track = tracks.find(function (t) { return t.languageCode === 'en'; });
    if (!track) track = tracks[0];

    if (!track) return null;

    // 4. Fetch XML Transcript
    var xmlContent = UrlFetchApp.fetch(track.baseUrl, { muteHttpExceptions: true }).getContentText();
    return {
        items: parseXmlTranscript(xmlContent),
        langCode: track.languageCode,
        langName: track.name.simpleText
    };
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
