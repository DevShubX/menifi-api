const app = require('express')()
require('dotenv').config()
const PORT = process.env.PORT || 8080

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

const routes = require('./routes');

app.use("/api",routes);

app.listen(PORT, () => {
	console.log(`It is listening on http://localhost:${PORT}`)
})
