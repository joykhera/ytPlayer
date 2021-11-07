import express from 'express'
import compression from 'compression'
import expressWs from 'express-ws'
import fetch from 'node-fetch'
import { parse, toSeconds } from 'iso8601-duration'

const app = express()
expressWs(app)
app.use(express.static('./public'))
app.use(compression())
app.use(express.text())
app.use(express.json())
app.listen(process.env.PORT || 3000)

const clients = []
app.ws('/', (ws) => {
    ws.on('message', async (data) => {
        const msg = JSON.parse(data)

        if (msg.state == 'music') {
            try {
                loadMusic(msg.playlistId)
                ws.send(JSON.stringify({
                    currentVideoId: currentVideo.id,
                    currentVideoTimeElapsed: Math.floor((Date.now() - videoStartTime) / 1000),
                    state: 'join music'
                }))
            } catch (error) {
                ws.send(JSON.stringify({
                    state: 'error',
                    message: error.message
                }))
            }
        }
    })

    ws.on('close', () => {
        clients.splice(clients.indexOf(ws))
        ws.close()
        ws.removeAllListeners()
    })
})

const videos = []
let nextPageToken = true;
async function loadMusic(playlistId) {
    while (nextPageToken) {
        const playlistBody = await (typeof nextPageToken == 'string' ?
            await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?pageToken=${nextPageToken}&part=contentDetails&key=AIzaSyB6f1sSrQtaLlJlQgBrO5MKmm_eaX_Qzxs&maxResults=50&playlistId=${playlistId}`) :
            await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&key=AIzaSyB6f1sSrQtaLlJlQgBrO5MKmm_eaX_Qzxs&maxResults=50&playlistId=${playlistId}`)).json()
        const videosBody = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=AIzaSyB6f1sSrQtaLlJlQgBrO5MKmm_eaX_Qzxs&id=${playlistBody.items.map((video) => video.contentDetails.videoId).join(',')}`)).json()
        for (const video of videosBody.items) videos.push(video)
        nextPageToken = playlistBody.nextPageToken
    }
    simulateMusic()
}

let currentVideo, videoStartTime, videoDuration
function simulateMusic() {
    currentVideo = videos[Math.floor(Math.random() * videos.length)]
    videoStartTime = Date.now()
    videoDuration = toSeconds(parse(currentVideo.contentDetails.duration))
    clients.forEach((ws) => ws.send(JSON.stringify({
        currentVideoId: currentVideo.id,
        state: 'new music'
    })))
    setTimeout(simulateMusic, videoDuration * 1000);
}

setInterval(() => clients.forEach((client) => client.send(JSON.stringify(''))), 30000)