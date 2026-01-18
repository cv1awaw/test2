
const { Innertube, UniversalCache } = require('youtubei.js');
const { YoutubeTranscript } = require('youtube-transcript');

(async () => {
    const videoId = 'PVEi8KnD56o'; // The user's new failing video
    console.log(`Debug: Testing video ${videoId}`);

    // Test 1: Innertube
    console.log('\n--- Test 1: Innertube ---');
    try {
        const yt = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true
        });
        const info = await yt.getInfo(videoId);
        console.log(`Title: ${info.basic_info.title}`);

        try {
            const data = await info.getTranscript();
            console.log('Innertube: Success (Default)');
        } catch (e) {
            console.log('Innertube: Failed default fetch:', e.message);
        }

        if (info.captions && info.captions.caption_tracks) {
            console.log('Available Tracks:', info.captions.caption_tracks.map(t => t.language_code));
        } else {
            console.log('No caption tracks found via Innertube.');
        }

    } catch (e) {
        console.error('Innertube Critical Error:', e);
    }

    // Test 2: youtube-transcript
    console.log('\n--- Test 2: youtube-transcript ---');
    try {
        console.log('Trying default (en)...');
        await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        console.log('youtube-transcript: Success (en)');
    } catch (e) {
        console.log('youtube-transcript (en) failed:', e.message);
    }

    try {
        console.log('Trying Arabic (ar)...');
        await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ar' });
        console.log('youtube-transcript: Success (ar)');
    } catch (e) {
        console.log('youtube-transcript (ar) failed:', e.message);
    }

})();
