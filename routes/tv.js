const express = require('express')
const router = express.Router()
const axios = require('axios');
const cheerio = require('cheerio')
const DOMAIN = process.env.DOMAIN || "https://flixhq.to"
const getCheerioData = async (link) => {
    return cheerio.load((await axios.get(link)).data)
}

router.get('/seasons/:tvId', async (req, res) => {
    try {
        if (!req.params.tvId) {
            res.status(400).json({ msg: '/seasons/:tvId - tvid missing' });

        }
        const { data } = await axios.get(`${DOMAIN}/ajax/v2/tv/seasons/${req.params.tvId}`);
        const $ = cheerio.load(data);
        let results = ($('a').map((i, el) => {
            return {
                seasonName: $(el).text().trim() || null,
                seasonId: $(el).attr('data-id') || null,
            }
        })).get()
        return res.status(200).json({ msg: 'Seasons Fetched', results });
    } catch (error) {
        return res.status(500).json({ msg: 'Internal Server Error', errmsg: error.message });

    }
})

router.get('/episodes/:seasonId', async (req, res) => {
    try {
        const { data } = await axios.get(`${DOMAIN}/ajax/v2/season/episodes/${req.params.seasonId}`);
        const $ = cheerio.load(data);
        let results = ($('.eps-item').map((i, el) => {
            return {
                episodeName: $(el).attr('title') || $(el).find('.film-poster-img').attr('title'),
                episodeId: $(el).attr('data-id') || null,
                coverImage: $(el).find(".film-poster-img").attr('src') || null,
            }
        })).get()
        res.status(200).json({ msg: 'Seasons Fetched', results });
    } catch (error) {
        res.status(500).json({ msg: 'Internal Server Error', errmsg: error.message });

    }
})

router.get('/servers/:episodeId', async (req, res) => {
    try {
        let $ = await getCheerioData(`${DOMAIN}/ajax/v2/episode/servers/${req.params.episodeId}`)
        let result = ($('a').map((i, el) => {
            return {
                server: $(el).find('span').text() || null,
                serverId: $(el).attr('data-id') || null,
                slug: $(el).attr('id') || null,
            }
        })).get()
        res.json(result)
    } catch (e) {
        res.send(e)
        throw Error(e)
    }
})

module.exports = router
