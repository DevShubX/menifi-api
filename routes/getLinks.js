const express = require('express')
const router = express.Router()
const axios = require('axios')
const DOMAIN = process.env.DOMAIN || "https://flixhq.to"
const { fetchEpisodeServers } = require('../utils/episodeServers');
const { MixDrop } = require('../utils/mixdrop');
const { VidCloud } = require('../utils/vidcloud');

router.get('/sources', async (req, res) => {
    let episodeId = req.query.episodeId;
    let mediaId = req.query.mediaId; // passwithout trailing slash,
    let server = req.query.server || "vidcloud";
    let sources = {};    


    if (episodeId == undefined || req.query.href == '') {
        return res.status(400).json({ message: "Missing episodeId" });
    }
    else if (mediaId === undefined || req.query.mediaId === '') {
        return res.status(400).json({ message: "Missing mediaId" });
    }
    try {
        const servers = await fetchEpisodeServers(episodeId, mediaId);
        const i = servers.findIndex((s, index) => s.name === server);
        if (i === -1) {
            console.log(`Server ${servers} not found`);
        }sources
        const { data } = await axios.get(
            `${DOMAIN}/ajax/episode/sources/${servers[i].url.split('.').slice(-1).shift()}`
        );

        let serverUrl = new URL(data.link);


        if (serverUrl.href.startsWith('http')) {
            serverUrl = new URL(serverUrl.href);
            switch (server) {
                case 'mixdrop':
                    sources = {
                        headers: { Referer: serverUrl.href },
                        sources: await new MixDrop().extract(serverUrl),
                    };
                    break;
                case 'vidcloud':
                    sources = {
                        headers: { Referer: serverUrl.href },
                        ...(await new VidCloud().extract(serverUrl, DOMAIN)),
                    };
                    break;
                case 'upcloud':
                    sources = {
                        headers: { Referer: serverUrl.href },
                        ...(await new VidCloud().extract(serverUrl, DOMAIN)),
                    };
                    break;
                default:
                    sources = {
                        headers: { Referer: serverUrl.href },
                        sources: await new MixDrop().extract(serverUrl),
                    };
                    break;
            }
        }

        return res.status(200).json({msg : "Sources Fetched",sources});
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error : error.message,errmsg:"Internal Server Error" });
    }
    // const result = await fetchEpisodeSources(req.query.episodeId, req.query.mediaId, req.query.server).catch((err) => res.send({Error:"Error While obtaining"}));
})


module.exports = router
