const express = require('express')
const router = express.Router()
const axios = require('axios').default.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
})
const cheerio = require('cheerio')
const DOMAIN = process.env.DOMAIN || "https://dopebox.to"


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
        let description = $(".description").text()
        res.json({backgroundImage,title,movieId,filmPoster,duration,description});
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
        res.json({backgroundImage,title,movieId,filmPoster,duration,description});
    }catch (error){
        throw error
    }
})


module.exports = router
