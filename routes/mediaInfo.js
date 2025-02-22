const express = require('express')
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio')
const DOMAIN = process.env.DOMAIN || "https://dopebox.to";
const flixhqURL = 'https://flixhq.to';

router.get("/movie/:query", async (req, res) => {
    try {
        let url = `${DOMAIN}/movie/${req.params.query.replace(/\s/g, '-')}`
        let response = await axios.get(url);
        let html = response.data;
        let $ = cheerio.load(html);
        let backgroundImage = $(".cover_follow").css('background-image').replace("url", "").replace("(", "").replace(")", "");
        let title = $(".heading-name").find("a").text();
        let movieId = $(".heading-name").find("a").attr("href");
        let filmPoster = $(".film-poster-img").attr("src");
        let duration = $(".duration").text();
        let description = $(".description").text();
        let releaseDate = $('div.row-line:contains("Released:")').text().trim().replace("Released: ", "");
        let genre = $('div.row-line:contains("Genre:") > a')
            .map((i, el) => $(el).text().split('&'))
            .get()
            .map(v => v.trim());
        let cast = $('div.row-line:contains("Casts:") > a')
            .map((i, el) => $(el).text())
            .get();
        let country = $('div.row-line:contains("Country:") > a:nth-child(2)').text();
        let production = $('div.row-line:contains("Production:") > a')
            .map((i, el) => $(el).text().split('&'))
            .get()
            .map(v => v.trim());
        let rating = $(".imdb").text().replace("IMDB: ", "");
        let type = movieId.split('/')[0] === 'tv' ? 'TVSERIES' : "MOVIE";
        res.json({ backgroundImage, title, movieId, filmPoster, duration, description, releaseDate, genre, cast, country, production, rating, type });
    } catch (error) {
        throw error
    }
})



router.get("/tv/:query", async (req, res) => {
    try {
        let url = `${DOMAIN}/tv/${req.params.query.replace(/\s/g, '-')}`
        let response = await axios.get(url);
        let html = response.data;
        let $ = cheerio.load(html);
        let backgroundImage = $(".cover_follow").css('background-image').replace("url", "").replace("(", "").replace(")", "");
        let title = $(".heading-name").find("a").text();
        let movieId = $(".heading-name").find("a").attr("href");
        let filmPoster = $(".film-poster-img").attr("src");
        let duration = $(".duration").text();
        let description = $(".description").text();
        let releaseDate = $('div.row-line:contains("Released:")').text().trim().replace("Released: ", "");
        let genre = $('div.row-line:contains("Genre:") > a')
            .map((i, el) => $(el).text().split('&'))
            .get()
            .map(v => v.trim());
        let cast = $('div.row-line:contains("Casts:") > a')
            .map((i, el) => $(el).text())
            .get();
        let country = $('div.row-line:contains("Country:") > a:nth-child(2)').text();
        let production = $('div.row-line:contains("Production:") > a')
            .map((i, el) => $(el).text().split('&'))
            .get()
            .map(v => v.trim());
        let rating = $(".imdb").text().replace("IMDB: ", "");
        let type = movieId.split('/')[0] === 'tv' ? 'TVSERIES' : "MOVIE";
        res.json({ backgroundImage, title, movieId, filmPoster, duration, description, releaseDate, genre, cast, country, production, rating, type });
    } catch (error) {
        throw error
    }
})

router.get("/flixhq", async (req, res) => {
    let mediaId = req.query.id;
    try {
        const details = {};

        if (!mediaId.startsWith(flixhqURL)) {
            mediaId = `${flixhqURL}/${mediaId}`;
        }
        const { data } = await axios.get(mediaId);
        let $ = cheerio.load(data);

        const recommendationsArray = [];
        $(
            'div.movie_information > div.container > div.m_i-related > div.film-related > section.block_area > div.block_area-content > div.film_list-wrap > div.flw-item'
        ).each((i, el) => {
            recommendationsArray.push({
                id: $(el).find('div.film-poster > a').attr('href'),
                title: $(el).find('div.film-detail > h3.film-name > a').text(),
                image: $(el).find('div.film-poster > img').attr('data-src'),
                duration:
                    $(el).find('div.film-detail > div.fd-infor > span.fdi-duration').text().replace('m', '') ?? null,
                type:
                    $(el).find('div.film-detail > div.fd-infor > span.fdi-type').text().toLowerCase() === 'tv'
                        ? 'TV Series'
                        : 'Movie' ?? null,
            });
        });

        details.id = mediaId.split('to/').pop();
        details.uid = $('.watch_block').attr('data-id');
        details.title = $('.heading-name > a:nth-child(1)').text();
        details.movieId = $('.heading-name').find('a').attr('href').replace("/", "");
        details.backgroundImage = $(".w_b-cover").css('background-image').replace("url", "").replace("(", "").replace(")", "");
        details.filmPoster = $('.m_i-d-poster > div:nth-child(1) > img:nth-child(1)').attr('src');
        details.description = $('.description').text();
        details.type = details.id.split('/')[0] === 'tv' ? 'TV Series' : 'Movie';
        details.releaseDate = $('div.row-line:nth-child(3)').text().replace('Released: ', '').trim();
        details.genres = $('div.row-line:nth-child(2) > a')
            .map((i, el) => $(el).text().split('&'))
            .get()
            .map(v => v.trim());
        details.casts = $('div.row-line:nth-child(5) > a')
            .map((i, el) => $(el).text())
            .get();
        details.tags = $('div.row-line:nth-child(6) > h2')
            .map((i, el) => $(el).text())
            .get();
        details.production = $('div.row-line:nth-child(4) > a:nth-child(2)').text();
        details.country = $('div.row-line:nth-child(1) > a:nth-child(2)').text();
        details.duration = $('span.item:nth-child(3)').text();
        details.rating = parseFloat($('span.item:nth-child(2)').text());
        details.recommendations = recommendationsArray;
        details.season = 1;
        if (details.type === 'TV Series') {
            const { data } = await axios.get(ajaxReqUrl(details.uid, 'tv', true));
            const $$ = cheerio.load(data);
            const seasonsIds = $$('.dropdown-menu > a')
                .map((i, el) => $(el).attr('data-id'))
                .get();

            details.episodes = [];
            
            for (const id of seasonsIds) {
                const { data } = await axios.get(ajaxReqUrl(id, 'season'));
                const $$$ = cheerio.load(data);

                $$$('.nav > li')
                    .map((i, el) => {
                        const episode = {
                            seasonId : id,
                            id: $$$(el).find('a').attr('id').split('-')[1],
                            title: $$$(el).find('a').attr('title'),
                            number: parseInt($$$(el).find('a').attr('title').split(':')[0].slice(3).trim()),
                            season: details.season,
                            url: `${flixhqURL}/ajax/v2/episode/servers/${$$$(el).find('a').attr('id').split('-')[1]}`,
                        };
                        details.episodes?.push(episode);
                    })
                    .get();
                details.season++;
            }
        } else {
            details.episodes = [
                {
                    id: details.uid,
                    title: details.title,
                    url: `${flixhqURL}/ajax/movie/episodes/${details.uid}`,
                },
            ];
        }

        return res.status(200).json({ msg: "Successfull",details });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message, errmsg: "Internal Server Error" });
    }

});


const ajaxReqUrl = (id, type, isSeasons = false) =>
    `${flixhqURL}/ajax/${type === 'movie' ? type : `v2/${type}`}/${isSeasons ? 'seasons' : 'episodes'}/${id}`;



module.exports = router
