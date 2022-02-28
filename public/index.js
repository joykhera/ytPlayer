let iframe, currentVideo, playlistId, musicLoaded

function createIframe() {
    iframe = document.createElement("iframe")
    iframe.setAttribute('id', 'iframe')
    iframe.setAttribute('src', `https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&start=${Math.floor((Date.now() - videoStartTime) / 1000)}`)
    iframe.setAttribute('allow', 'autoplay')
    iframe.setAttribute('allow', 'fullscreen')
    document.body.appendChild(iframe)
    if (document.getElementById('music not ready')) document.getElementById('music not ready').remove()
    document.getElementById('input').style.display = 'none'
}

document.getElementById('playlistId').onkeydown = function (e) {
    playlistId = this.value.includes("https://www.youtube.com/playlist?list=") ? this.value.slice(38) : this.value
    if (e.code == 'Enter' || e.key == 'Enter') loadMusic(playlistId)
}

const videos = []
let nextPageToken = true
async function loadMusic(playlistId) {
    const p = document.createElement("p")
    p.textContent = "loading"
    document.body.appendChild(p)
    while (nextPageToken) {
        const playlistBody = await (typeof nextPageToken == 'string' ?
            await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?pageToken=${nextPageToken}&part=contentDetails&key=AIzaSyB6f1sSrQtaLlJlQgBrO5MKmm_eaX_Qzxs&maxResults=50&playlistId=${playlistId}`) :
            await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&key=AIzaSyB6f1sSrQtaLlJlQgBrO5MKmm_eaX_Qzxs&maxResults=50&playlistId=${playlistId}`)).json()
        const videosBody = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=AIzaSyB6f1sSrQtaLlJlQgBrO5MKmm_eaX_Qzxs&id=${playlistBody.items.map((video) => video.contentDetails.videoId).join(',')}`)).json()
        for (const video of videosBody.items) videos.push(video)
        nextPageToken = playlistBody.nextPageToken
    }
    musicLoaded = true
    p.remove()
    simulateMusic()
    createIframe()
}

let videoStartTime;
function simulateMusic() {
    currentVideo = videos[Math.floor(Math.random() * videos.length)]
    videoStartTime = Date.now()
    currentVideo.duration = moment.duration(currentVideo.contentDetails.duration)._milliseconds
    if (iframe) iframe.src = `https://www.youtube.com/embed/${currentVideo.id}?autoplay=1`
    setTimeout(simulateMusic, currentVideo.duration);
}