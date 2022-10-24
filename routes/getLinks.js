const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')
const DOMAIN = process.env.DOMAIN || "https://dopebox.to"

module.exports = router
