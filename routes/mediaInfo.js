const express = require('express')
const router = express.Router()
const axios = require('axios').default.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
})
const cheerio = require('cheerio')
const DOMAIN = process.env.DOMAIN || "https://dopebox.to";
const DOMAIN2 = 'https://flixhq.to';

router.get("/movie/:query",async(req,res)=>{
    try{
        let url = `${DOMAIN}/movie/${req.params.query.replace(/\s/g,'-')}`
        let response = await axios.get(url);
        let html = response.data;
        let $  = cheerio.load(html);
        let backgroundImage = $(".cover_follow").css('background-image').replace("url","").replace("(","").replace(")","");
        let title = $(".heading-name").find("a").text();
        let movieId = $(".heading-name").find("a").attr("href");
        let filmPoster = $(".film-poster-img").attr("src");
        let duration = $(".duration").text();
        let description = $(".description").text();
        let releaseDate = $('div.row-line:contains("Released:")').text().trim().replace("Released: ","");
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
        let rating = $(".imdb").text().replace("IMDB: ","");
        let type = movieId.split('/')[0] === 'tv' ? 'TVSERIES' : "MOVIE";
        res.json({backgroundImage,title,movieId,filmPoster,duration,description,releaseDate,genre,cast,country,production,rating,type});
    }catch (error){
        throw error
    }
})



router.get("/tv/:query",async(req,res)=>{
    try{
        let url = `${DOMAIN}/tv/${req.params.query.replace(/\s/g,'-')}`
        let response = await axios.get(url);
        let html = response.data;
        let $  = cheerio.load(html);
        let backgroundImage = $(".cover_follow").css('background-image').replace("url","").replace("(","").replace(")","");
        let title = $(".heading-name").find("a").text();
        let movieId = $(".heading-name").find("a").attr("href");
        let filmPoster = $(".film-poster-img").attr("src");
        let duration = $(".duration").text();
        let description = $(".description").text();
        let releaseDate = $('div.row-line:contains("Released:")').text().trim().replace("Released: ","");
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
        let rating = $(".imdb").text().replace("IMDB: ","");
        let type = movieId.split('/')[0] === 'tv' ? 'TVSERIES' : "MOVIE";
        res.json({backgroundImage,title,movieId,filmPoster,duration,description,releaseDate,genre,cast,country,production,rating,type});
    }catch (error){
        throw error
    }
})


router.get("/flixhq/movie/:query",async(req,res)=>{
    try{
        let mediaId = req.params.query.replace(/\s/g,'-');
        let url = `${DOMAIN2}/movie/${mediaId}`;
        console.log(url)
        let response = await axios.get(url);
        let html = response.data;
        let $  = cheerio.load(html);


        const uid = $('.watch_block').attr('data-id');
        let id = mediaId.split('to/').pop();
        let title = $('.heading-name > a:nth-child(1)').text();
        let filmPoster = $('.m_i-d-poster > div:nth-child(1) > img:nth-child(1)').attr('src');
        let backgroundImage = $(".w_b-cover").css('background-image').replace("url","").replace("(","").replace(")","");
        let description = $('.description').text();
        let type = id.split('/')[0] === 'tv' ? 'TVSERIES' : 'MOVIE';
        let releaseDate = $('div.row-line:nth-child(3)').text().replace('Released: ', '').trim();
        let genres = $('div.row-line:nth-child(2) > a')
            .map((i, el) => $(el).text().split('&'))
            .get()
            .map(v => v.trim());
        let casts = $('div.row-line:nth-child(5) > a')
            .map((i, el) => $(el).text())
            .get();
        let tags = $('div.row-line:nth-child(6) > h2')
            .map((i, el) => $(el).text())
            .get();
        let production = $('div.row-line:nth-child(4) > a:nth-child(2)').text();
        let country = $('div.row-line:nth-child(1) > a:nth-child(2)').text();
        let duration = $('span.item:nth-child(3)').text();
        let rating = parseFloat($('span.item:nth-child(2)').text());

        let ajaxReqUrl = (id, type, isSeasons=false) =>
            `${DOMAIN2}/ajax/${type === 'movie' ? type : `v2/${type}`}/${
            isSeasons ? 'seasons' : 'episodes'
            }/${id}`;
        
        let episodes = [];

        episodes = [
        {
            id: uid,
            title: title + ' Movie',
            url: `${DOMAIN2}/ajax/movie/episodes/${uid}`,
        },
        ];
        res.json({
            title,
            id,
            filmPoster,
            backgroundImage,
            description,
            type,
            releaseDate,
            genres,
            casts,
            tags,
            production,
            country,
            duration,
            rating,
            episodes,

        });
    }catch (error){
        throw error
    }
})


router.get("/flixhq/tv/:query",async(req,res)=>{
    try{
        let mediaId = req.params.query.replace(/\s/g,'-');
        let url = `${DOMAIN2}/movie/${mediaId}`;
        let response = await axios.get(url);
        let html = response.data;
        let $  = cheerio.load(html);


        const uid = $('.watch_block').attr('data-id');
        let id = mediaId.split('to/').pop();
        let title = $('.heading-name > a:nth-child(1)').text();
        let backgroundImage = $(".w_b-cover").css('background-image').replace("url","").replace("(","").replace(")","");
        let filmPoster = $('.m_i-d-poster > div:nth-child(1) > img:nth-child(1)').attr('src');
        let description = $('.description').text();
        let type = id.split('/')[0] === 'tv' ? 'TVSERIES' : 'MOVIE';
        let releaseDate = $('div.row-line:nth-child(3)').text().replace('Released: ', '').trim();
        let genres = $('div.row-line:nth-child(2) > a')
            .map((i, el) => $(el).text().split('&'))
            .get()
            .map(v => v.trim());
        let casts = $('div.row-line:nth-child(5) > a')
            .map((i, el) => $(el).text())
            .get();
        let tags = $('div.row-line:nth-child(6) > h2')
            .map((i, el) => $(el).text())
            .get();
        let production = $('div.row-line:nth-child(4) > a:nth-child(2)').text();
        let country = $('div.row-line:nth-child(1) > a:nth-child(2)').text();
        let duration = $('span.item:nth-child(3)').text();
        let rating = parseFloat($('span.item:nth-child(2)').text());

        let ajaxReqUrl = (id, type, isSeasons=false) =>
            `${DOMAIN2}/ajax/${type === 'movie' ? type : `v2/${type}`}/${
            isSeasons ? 'seasons' : 'episodes'
            }/${id}`;


        const { data } = await axios.get(ajaxReqUrl(uid, 'tv', true));
        const $$ = cheerio.load(data);
        const seasonsIds = $$('.dropdown-menu > a')
        .map((i, el) => $(el).attr('data-id'))
        .get();

        let episodes = [];
        let season = 1;
        for (const id of seasonsIds) {
        const { data } = await axios.get(ajaxReqUrl(id, 'season'));
        const $$$ = cheerio.load(data);

        $$$('.nav > li')
            .map((i, el) => {
            const episode = {
                id: $$$(el).find('a').attr('id').split('-')[1],
                title: $$$(el).find('a').attr('title'),
                number: parseInt($$$(el).find('a').attr('title').split(':')[0].slice(3).trim()),
                season: season,
                url: `${DOMAIN2}/ajax/v2/episode/servers/${$$$(el).find('a').attr('id').split('-')[1]}`,
            };
            episodes?.push(episode);
            })
            .get();
        season++;
        }
        
        res.json({
            title,
            id,
            filmPoster,
            backgroundImage,
            description,
            type,
            releaseDate,
            genres,
            casts,
            tags,
            production,
            country,
            duration,
            rating,
            episodes,

        });
    }catch (error){
        throw error;
    }
})


module.exports = router
