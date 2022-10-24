const express = require('express')
const router = express.Router()
const axios = require('axios').default.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
})
const cheerio = require('cheerio')
const DOMAIN = process.env.DOMAIN || "https://dopebox.to"

router.get('/', (req, res) => {
	res.send('<h3>Search instructions...</h3><p>TV-SHOWS - /search/tv/[query]</p><p>MOVIES - /search/movie/[query]</p>')
})

router.get('/:query', async(req, res) => {
    try {
        let url = `${DOMAIN}/search/${req.params.query.replace(/\s/g,'-')}`
        let response = (await axios.get(url)).data;
        let $ = cheerio.load(response);
        let result = ($('.flw-item').map((i,el)=>{
		let rating,quality,year;
            if($(el).find('.film-name a').attr('href').startsWith('/movie/')){
                $(el).find('.fdi-item').each((i,el)=>{
                    switch(i){
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
                return{
                    id: $(el).find('.film-name a').attr('href').split('-').pop(),
                    title: $(el).find('.film-name a').attr('title'),
                    type: "movie",
                    imgUrl : $(el).find('.film-poster').find('img').attr('data-src'),
                    href: $(el).find('.film-name a').attr('href'),
                    rating : rating,
                    quality : quality,
                    year : year,
                }
            }else{
                return{
                    id: $(el).find('.film-name a').attr('href').split('-').pop(),
                    title: $(el).find('.film-name a').attr('title'),
                    type: "tv",
                    imgUrl : $(el).find('.film-poster').find('img').attr('data-src'),
                    href: $(el).find('.film-name a').attr('href'),
                    rating : rating,
                    quality : quality,
                    year : year,
                }
            }
        })).get();
        res.json(result);
    } catch(e) {
        res.send(e)
        throw Error(e)
    }
})

module.exports = router
