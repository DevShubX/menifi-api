const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')
const DOMAIN = process.env.DOMAIN || "https://dopebox.to"
const websocket = require('ws');
const cryptojs = require('crypto-js');
class MixDrop {
    serverName = 'MixDrop';
    sources = [];

    extract = async (videoUrl) => {
        try {
            const { data } = await axios.get(videoUrl.href);

            const match = cheerio.load(data)
                .html()
                .match(/(?<=p}\().*(?<=wurl).*\}/g);

            if (!match) {
                throw new Error('Video not found.');
            }
            const [p, a, c, k, e, d] = match[0].split(',').map(x => x.split('.sp')[0]);
            const formated = this.format(p, a, c, k, e, JSON.parse(d));

            const [poster, source] = formated
                .match(/(?<=poster'=").+?(?=")|(?<=wurl=").+?(?=")/g)
                .map((x) => (x.startsWith('http') ? x : `https:${x}`));

            this.sources.push({
                url: source,
                isM3U8: source.includes('.m3u8'),
                poster: poster,
            });

            return this.sources;
        } catch (err) {
            throw new Error((err).message);
        }
    };

    format = (p, a, c, k, e, d) => {
        k = k.split('|');
        e = (c) => {
            return c.toString(36);
        };
        if (!''.replace(/^/, String)) {
            while (c--) {
                d[c.toString(a)] = k[c] || c.toString(a);
            }
            k = [
                (e) => {
                    return d[e];
                },
            ];
            e = () => {
                return '\\w+';
            };
            c = 1;
        }
        while (c--) {
            if (k[c]) {
                p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]);
            }
        }
        return p;
    };
}

class VidCloud {
    serverName = 'VidCloud';
    sources = [];

    host = 'https://dokicloud.one';
    host2 = 'https://rabbitstream.net';

    extract = async (
        videoUrl,
        isAlternative = false
    ) => {
        const result = {
            sources: [],
            subtitles: [],
        };
        try {
            const id = videoUrl.href.split('/').pop()?.split('?')[0];
            const options = {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Referer: videoUrl.href,
                    'User-Agent': "USER_AGENT",
                },
            };
            let res = undefined;
            let sources = undefined;

            res = await axios.get(
                `${isAlternative ? this.host2 : this.host}/ajax/embed-4/getSources?id=${id}`,
                options
            );

            //const res = await this.wss(id!);

            const key = await axios.get(
                'https://raw.githubusercontent.com/consumet/rapidclown/rabbitstream/key.txt'
            );
            sources = cryptojs.AES.decrypt(res.data.sources, key.data).toString(cryptojs.enc.Latin1);
            let plaintext = JSON.parse(sources);
            this.sources = plaintext.map((s) => ({
                url: s.file,
                isM3U8: s.file.includes('.m3u8'),
            }));
            result.sources.push(...this.sources);
            result.sources = [];
            this.sources = [];

            for (const source of plaintext) {
                const { data } = await axios.get(source.file, options);
                const urls = data.split('\n').filter((line) => line.includes('.m3u8'));
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
                        isM3U8: f2.includes('.m3u8'),
                    });
                }
                result.sources.push(...this.sources);
            }

            result.sources.push({
                url: plaintext[0].file,
                isM3U8: plaintext[0].file.includes('.m3u8'),
                quality: 'auto',
            });

            result.subtitles = res.data.tracks.map((s) => ({
                url: s.file,
                lang: s.label ? s.label : 'Default (maybe)',
            }));
            return result;
        } catch (err) {
            throw err;
        }
    };

    wss = async (iframeId) => {
        const ws = new websocket.WebSocket('wss://wsx.dokicloud.one/socket.io/?EIO=4&transport=websocket');
        ws.onopen = () => {
            ws.send('40');
        };
        return await new Promise(resolve => {
            let sid = '';
            let res = { sid: '', sources: [], tracks: [] };
            ws.onmessage = e => {
                const data = e.data.toString();
                if (data.startsWith('40')) {
                    res.sid = JSON.parse(data.slice(2)).sid;
                    ws.send(`42["getSources",{"id":"${iframeId}"}]`);
                } else if (data.startsWith('42["getSources"')) {
                    const ress = JSON.parse(data.slice(2))[1];
                    res.sources = ress.sources;
                    res.tracks = ress.tracks;
                    resolve(res);
                }
            };
        });
    };
};
fetchEpisodeSources = async (
    episodeId,
    mediaId,
    server = "vidcloud") => {
    if (episodeId.startsWith('http')) {
        const serverUrl = new URL(episodeId);
        switch (server) {
            case "mixdrop":
                return {
                    headers: { Referer: serverUrl.href },
                    sources: await new MixDrop().extract(serverUrl),
                };
            case "vidcloud":
                return {
                    headers: { Referer: serverUrl.href },
                    sources: await new VidCloud().extract(serverUrl, true),
                };
            case "upcloud":
                return {
                    headers: { Referer: serverUrl.href },
                    sources: await new VidCloud().extract(serverUrl),
                };
            default:
                return {
                    headers: { Referer: serverUrl.href },
                    sources: await new VidCloud().extract(serverUrl),
                };
        }
    }

    try {
        const servers = await fetchEpisodeServers(episodeId, mediaId);
        const i = servers.findIndex((s, index) => s.name === server)
        if (i === -1) {
            throw new Error(`Server ${servers} not found`);
        }

        const { data } = await axios.get(
            `${DOMAIN}/ajax/get_link/${servers[0].url.split('.').slice(-1).shift()}`
        );
        const serverUrl = new URL(data.link);
        return await fetchEpisodeSources(serverUrl.href, mediaId, server);
    } catch (err) {
        console.log(err)
    }
};

fetchEpisodeServers = async (episodeId, mediaId) => {
    if (!episodeId.startsWith(DOMAIN + '/ajax') && !mediaId.includes('movie'))
        episodeId = `${DOMAIN}/ajax/v2/episode/servers/${episodeId}`;
    else episodeId = `${DOMAIN}/ajax/movie/episodes/${episodeId}`;

    try {
        const data = await axios.get(episodeId);
        const $ = cheerio.load(data.data);
        const servers = $('li')
            .map((i, el) => {
                const server = {
                    name: mediaId.includes('movie')
                        ? $(el).find('a').find('span').text().toLowerCase()
                        : $(el).find('a').find('span').text().slice(6).trim().toLowerCase(),
                    url: `${DOMAIN}/${mediaId}.${!mediaId.includes('movie')
                        ? $(el).find('a').attr('data-id')
                        : $(el).find('a').attr('data-id')
                        }`.replace(
                            !mediaId.includes('movie') ? /\/tv\// : /\/movie\//,
                            !mediaId.includes('movie') ? '/watch-tv/' : '/watch-movie/'
                        ),
                };
                return server;
            })
            .get();
        return servers;
    } catch (err) {
        throw new Error(err);
    }
};
router.get('/sources', async (req, res) => {

    if (req.query.episodeId == undefined || req.query.href == '') {
        return res.status(400).json({ message: "Missing episodeId", status: 400 })
    }
    else if (req.query.mediaId === undefined || req.query.mediaId === '') {
        return res.status(400).json({ message: "Missing mediaId", status: 400 })
    }

    try {
        const result = await fetchEpisodeSources(req.query.episodeId, req.query.mediaId, req.query.server).catch((err) => console.log(err));
        res.send(result)
    } catch (err) {
        res.json({ message: 'Something went wrong. Please try again later.' });
        console.log(err);
    }
})


module.exports = router
