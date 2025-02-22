const express = require("express");
const route = express.Router();

const getLinks = require('./routes/getLinks');
const mediaInfo = require('./routes/mediaInfo');
const movie = require('./routes/movie');
const search = require('./routes/search');
const tv = require('./routes/tv');

route.use('/',search);
route.use('/movie',movie);
route.use('/tv',tv);
route.use('/info',mediaInfo);
route.use('/links',getLinks);

module.exports = route;