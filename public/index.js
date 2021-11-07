const ws = new WebSocket(`${location.protocol == 'http:' ? 'ws' : 'wss'}://${location.host + location.pathname}`)
let iframe, currentVideoId, playlistId

const params = Object.fromEntries(new URLSearchParams(window.location.search).entries())
ws.addEventListener('open', () => {
    if (params.playlistId) ws.send(JSON.stringify({ state: 'music', playlistId: params.playlistId }))
})

ws.addEventListener('message', (data) => {
    const msg = JSON.parse(data.data)

    if (msg.state == 'music not ready') {
        if (!document.getElementById(msg.state)) {
            const p = document.createElement("p")
            p.setAttribute('id', msg.state)
            p.innerHTML = msg.message
            document.body.appendChild(p)
        }
    }

    else if (msg.state == 'join music') {
        currentVideoId = msg.currentVideoId
        iframe = document.createElement("iframe")
        iframe.setAttribute('id', 'iframe')
        iframe.setAttribute('src', `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&start=${msg.currentVideoTimeElapsed}`)
        iframe.setAttribute('allow', 'autoplay')
        iframe.setAttribute('allow', 'fullscreen')
        document.body.appendChild(iframe)
        if (document.getElementById('music not ready')) document.getElementById('music not ready').remove()
        document.getElementById('input').style.display = 'none'
    }

    else if (msg.state == 'new music') {
        currentVideoId = msg.currentVideoId
        if (iframe) iframe.src = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1`
    }
})

document.getElementById('playlistId').onkeypress = function (e) {
    playlistId = this.value.includes("https://www.youtube.com/playlist?list=") ? this.value.slice(38) : this.value
    if ((e.code == 'Enter' || e.key == 'Enter') && ws.readyState == 1) ws.send(JSON.stringify({ state: 'music', playlistId }))
}

ws.addEventListener('close', () => window.open(location.href + '?playlistId=' + playlistId, "_self"))