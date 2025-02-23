const axios = require('axios');

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';

class VidCloud {
    serverName = 'VidCloud';
    sources = [];

    extract = async (
        videoUrl,
        referer = 'https://flixhq.to/'
    ) => {
        const result = {
            sources: [],
            subtitles: [],
        };
        try {
            const options = {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Referer: videoUrl.href,
                    'User-Agent': USER_AGENT,
                },
            };

            let resp = await axios.post(`${process.env.SOURCE_EXTRACT_API}/api/rabbit/extract`,
                {
                    "embedLink": videoUrl.href,
                    "referer": referer,
                });
            
            const res = resp.data;
            const sources = res.sources;

            this.sources = sources.map((s) => ({
                url: s.file,
                isM3U8: s.file.includes('.m3u8') || s.file.endsWith('m3u8'),
            }));

            result.sources.push(...this.sources);

            result.sources = [];
            this.sources = [];

            for (const source of sources) {
                const { data } = await axios.get(source.file, options);
                const urls = data
                    .split('\n')
                    .filter((line) => line.includes('.m3u8') || line.endsWith('m3u8'));
                const qualities = data.split('\n').filter((line) => line.includes('RESOLUTION='));

                const TdArray = qualities.map((s, i) => {
                    const f1 = s.split('x')[1];
                    const f2 = urls[i];

                    return [f1, f2];
                });

                for (const [f1, f2] of TdArray) {
                    this.sources.push({
                        url: f2,
                        quality: f1,
                        isM3U8: f2.includes('.m3u8') || f2.endsWith('m3u8'),
                    });
                }
                result.sources.push(...this.sources);
            }

            result.sources.push({
                url: sources[0].file,
                isM3U8: sources[0].file.includes('.m3u8') || sources[0].file.endsWith('m3u8'),
                quality: 'auto',
            });

            result.subtitles = res.tracks.map((s) => ({
                url: s.file,
                lang: s.label ? s.label : 'Default (maybe)',
            }));

            return result;
        } catch (err) {
            throw err;
        }
    };
}

module.exports = {VidCloud};
