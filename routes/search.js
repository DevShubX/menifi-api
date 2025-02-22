const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')
const DOMAIN = process.env.DOMAIN || "https://flixhq.to"

router.get('/search', async (req, res) => {
    const query = req.query.query;
    try {
        let url = `${DOMAIN}/search/${query.replace(/\s/g, '-')}`
        let response = (await axios.get(url)).data;
        let $ = cheerio.load(response);
        let result = ($('.flw-item').map((i, el) => {
            let rating, quality, year;
            if ($(el).find('.film-name a').attr('href').startsWith('/movie/')) {
                $(el).find('.fdi-item').each((i, el) => {
                    switch (i) {
                        case 0:
                            rating = $(el).text();

                            break;
                        case 1:
                            quality = $(el).text();

                            break;
                        case 2:
                            year = $(el).text();
                            break;
                        default:
                            break;
                    }
                })
                return {
                    id: $(el).find('.film-name a').attr('href').split('-').pop(),
                    title: $(el).find('.film-name a').attr('title'),
                    type: "movie",
                    imgUrl: $(el).find('.film-poster').find('img').attr('data-src'),
                    href: $(el).find('.film-name a').attr('href').slice(1),
                    rating: rating,
                    quality: quality,
                    year: year,
                }
            } else {
                return {
                    id: $(el).find('.film-name a').attr('href').split('-').pop(),
                    title: $(el).find('.film-name a').attr('title'),
                    type: "tv",
                    imgUrl: $(el).find('.film-poster').find('img').attr('data-src'),
                    href: $(el).find('.film-name a').attr('href').slice(1),
                    rating: rating,
                    quality: quality,
                    year: year,
                }
            }
        })).get();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(500).json({errmsg : "Internal Server Error"});
    }
})

module.exports = router
