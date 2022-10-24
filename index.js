const app = require('express')()
require('dotenv').config()
const PORT = process.env.PORT || 3000
const TIMEOUT = process.env.TIMEOUT || 5000;
const cors = require("cors")
var corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
    port: PORT,
}

app.use(cors(corsOptions));

// Root
app.get('/', cors(),(req, res) => {
    res.sendFile(`${__dirname}/index.html`)
})

// Search (Movie or Tv-Show)
app.use('/search', require('./routes/search'))

// Get
app.use('/movie', require('./routes/movie'))
app.use('/tv', require('./routes/tv'))

// Get links
app.use('/links', require('./routes/getLinks'))


app.use('/info',require('./routes/mediaInfo'))
// app.use(timeout(2000))

app.listen(PORT, () => {
	console.log(`It is listening on http://localhost:${PORT}`)
})

    // .setTimeout(2000, () => {
// })
