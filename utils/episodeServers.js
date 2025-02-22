const axios = require('axios')
const cheerio = require('cheerio')
const DOMAIN = process.env.DOMAIN || "https://flixhq.to"

const fetchEpisodeServers = async (episodeId, mediaId) => {
    let newEpisodeId = "";
    try {
        if (!episodeId.startsWith(DOMAIN + '/ajax') && !mediaId.includes('movie')) {
            newEpisodeId = `${DOMAIN}/ajax/v2/episode/servers/${episodeId}`;
        }
        else {
            newEpisodeId = `${DOMAIN}/ajax/movie/episodes/${episodeId}`;
        };
        const data = await axios.get(newEpisodeId);
        const $ = cheerio.load(data.data);
        const servers = $('.nav > li')
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
        console.log(err);
    }
};


module.exports = {fetchEpisodeServers};
