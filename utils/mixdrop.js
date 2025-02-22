const axios = require('axios');

class MixDrop {
    serverName = 'MixDrop';
    sources = [];

    extract = async (videoUrl) => {
        try {
            const { data } = await axios.get(videoUrl.href);

            console.log(data);

            const formated = eval(/(eval)(\(f.*?)(\n<\/script>)/s.exec(data)[2].replace('eval', ''));

            const [poster, source] = formated
                .match(/poster="([^"]+)"|wurl="([^"]+)"/g)
                .map((x) => x.split(`="`)[1].replace(/"/g, ''))
                .map((x) => (x.startsWith('http') ? x : `https:${x}`));

            this.sources.push({
                url: source,
                isM3U8: source.includes('.m3u8'),
                poster: poster,
            });

            return this.sources;
        } catch (err) {
            console.log(err);
        }
    };
}

module.exports = {MixDrop};
