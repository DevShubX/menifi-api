const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')
const DOMAIN = process.env.DOMAIN || "https://dopebox.to"
const websocket = require('ws');
const cryptojs = require('crypto-js');
const {main} = require('../utils/rabbit');


const substringAfter = (str, toFind) => {
    const index = str.indexOf(toFind);
    return index == -1 ? '' : str.substring(index + toFind.length);
  };
  
const substringBefore = (str, toFind) => {
    const index = str.indexOf(toFind);
    return index == -1 ? '' : str.substring(0, index);
};
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
                console.log('Video not found.');
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
            console.log(err);
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
            downloadLink : "",
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
            // let res;
            let sources = undefined;
            let plaintext = undefined;
            // res = await axios.get(
            //     `${isAlternative ? this.host2 : this.host}/ajax/embed-4/getSources?id=${id}`,
            //     options
            // );

            // //const res = await this.wss(id!);
            // const isJson = (str) => {
            //     try {
            //         JSON.parse(str);
            //     } catch (e) {
            //         return false;
            //     }
            //     return true;
            // };
            // if (!isJson(res.data.sources)) {
            //     let { data: key } = await axios.get('https://raw.githubusercontent.com/theonlymo/keys/e4/key');

            //     key = substringBefore(substringAfter(key, '"blob-code blob-code-inner js-file-line">'), '</td>');

            //     if (!key) {
            //     key = await (
            //         await axios.get('https://raw.githubusercontent.com/theonlymo/keys/e4/key')
            //     ).data;
            //     }

            //     const sourcesArray = res.data.sources.split("");
            //     let extractedKey = "";

            //     let currentIndex = 0;
            //     for (const index of key) {
            //         const start = index[0] + currentIndex;
            //         const end = start + index[1];
            //         for (let i = start; i < end; i++) {
            //             extractedKey += res.data.sources[i];
            //             sourcesArray[i] = "";
            //         }
            //         currentIndex += index[i];
            //     }

            //     key = extractedKey;
            //     res.data.sources = sourcesArray.join("");

            //     const decryptedVal = cryptojs.AES.decrypt(res.data.sources, key).toString(cryptojs.enc.Utf8);
            //     sources = isJson(decryptedVal) ? JSON.parse(decryptedVal) : res.data.sources;
            //     plaintext = sources;
            // }

            const res = await main(id);
            
            plaintext = res.sources;
           
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
            result.downloadLink = `${isAlternative ? this.host2 : this.host }/embed/m-download/${id}`;
            return result;
        } catch (err) {
            console.log(err);
        }
    };

    // wss = async (iframeId) => {
    //     const ws = new websocket.WebSocket('wss://wsx.dokicloud.one/socket.io/?EIO=4&transport=websocket');
    //     ws.onopen = () => {
    //         ws.send('40');
    //     };
    //     return await new Promise(resolve => {
    //         let sid = '';
    //         let res = { sid: '', sources: [], tracks: [] };
    //         ws.onmessage = e => {
    //             const data = e.data.toString();
    //             if (data.startsWith('40')) {
    //                 res.sid = JSON.parse(data.slice(2)).sid;
    //                 ws.send(`42["getSources",{"id":"${iframeId}"}]`);
    //             } else if (data.startsWith('42["getSources"')) {
    //                 const ress = JSON.parse(data.slice(2))[1];
    //                 res.sources = ress.sources;
    //                 res.tracks = ress.tracks;
    //                 resolve(res);
    //             }
    //         };
    //     });
    // };
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
    
};
const fetchEpisodeServers = async (episodeId, mediaId)=> {
    let newEpisodeId = "";
    try {
        if (!episodeId.startsWith(DOMAIN + '/ajax') && !mediaId.includes('movie')){
            newEpisodeId = `${DOMAIN}/ajax/v2/episode/servers/${episodeId}`;
        }
        else{
            newEpisodeId = `${DOMAIN}/ajax/movie/episodes/${episodeId}`;
        };
        const data = await axios.get(newEpisodeId);
        const $ = cheerio.load(data.data);
        const servers = $('li')
            .map((i, el) => {
                const server = {
                    name: mediaId.includes('movie')
                        ? $(el).find('a').find('span').text().toLowerCase()
                        : $(el).find('a').find('span').text().toLowerCase(),
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
    //   throw new Error((err).message);
    }
  };

router.get('/sources', async (req, res) => {
    let episodeId = req.query.episodeId;
    let mediaId = req.query.mediaId;
    let server = req.query.server || "vidcloud";

    if (episodeId == undefined || req.query.href == '') {
        return res.status(400).json({ message: "Missing episodeId", status: 400 });
    }
    else if (mediaId === undefined || req.query.mediaId === '') {
        return res.status(400).json({ message: "Missing mediaId", status: 400 });
    }
    try {
        const servers = await fetchEpisodeServers(episodeId, mediaId);
        const i = servers.findIndex((s, index) => s.name === server);
        if (i === -1) {
            console.log(`Server ${servers} not found`);
        }
        const { data } = await axios.get(
            `${DOMAIN}/ajax/get_link/${servers[i].url.split('.').slice(-1).shift()}`,
        );
        const serverUrl = new URL(data.link);
        const result =  await fetchEpisodeSources(serverUrl.href, mediaId, server);
        res.status(200).send(result);
    } catch (err) {
        res.status(403).send({"Error":"Sources not founded"});
    }
    // const result = await fetchEpisodeSources(req.query.episodeId, req.query.mediaId, req.query.server).catch((err) => res.send({Error:"Error While obtaining"}));
})


module.exports = router
