import { parseDateTimeObject } from './utils.js';

export function renderCards(data, elementId, showDate = false) {
    const container = document.getElementById(elementId);
    container.innerHTML = ''
    container.innerHTML = data.map(match => {
        const dt = match.date || parseDateTimeObject(match.dateTime);
        const links = match.links?.filter(l => !l.url.includes('.m3u8')) || [];
        return getRow(match, dt, links, showDate);
    }).join('');
}

export function renderChannels(channels) {
    const div = document.getElementById("divRowsChannels");
    const nav = document.getElementById("containerNavBar");
    div.innerHTML = '';
    nav.innerHTML = '';

    const sorted = [...channels].sort((a, b) => Number(a.order) - Number(b.order));

    let image = '/img/tv.png';

    sorted.forEach(ch => {
        if (ch.show !== 'Y' || !ch.links.length) return;
        const url = ch.links[0].url;
        const href = url.includes('.m3u8')
            ? `play/play.html?channelId=${ch.id}&linkId=${ch.links[0].id}`
            : `channel/channel.html?channelId=${ch.id}&linkId=${ch.links[0].id}`;

            if(ch.imageName !== undefined && ch.imageName != ''){
                image = '/img/channels/' + ch.imageName; 
            }

            //image = '/img/channels/atvsur.png'

        div.innerHTML += `
            <div class="col-12 col-md-3 col-sm-4 mb-4">
                <div class="card text-center card-border-green shadow-sm">
                    <div class="card-body">
                        <img src="${image}" alt="${ch.name} Logo" class="mb-1" style="width: 90px;">
                        <h6 class="card-title fw-bold">${ch.name}</h6>
                        <a href="${href}" target="_blank" class="btn btn-primary btn-sm px-2 py-1 shadow-sm rounded-pill" style="font-size: 0.75rem;">
                            <i class="bi bi-play-fill me-1"></i>Ver canal
                        </a>
                    </div>
                </div>
            </div>`;

        const li = document.createElement("li");
        li.className = "cursor-pointer";
        li.innerHTML = `<a href="${href}" target="_blank" class="dropdown-item">${ch.name}</a>`;
        nav.appendChild(li);
    });
}

function getRow(match, dt, links, showDate) {
    const dateStr = dt.toLocaleDateString("es-ES");
    const timeStr = dt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const displayTime = showDate ? `🗓️ ${dateStr} ${timeStr}` : `🕒 ${timeStr}`;

    const linkBtns = links.map(l => `
        <a href="channel/channel.html?matchId=${match.id}&linkId=${l.id}" target="_blank"
           class="btn btn-primary btn-sm px-2 py-1 shadow-sm rounded-pill" style="font-size: 0.75rem;">
           <i class="bi bi-play-fill me-1"></i>${l.name}
        </a>`).join('');

    const border = {
        LIVE: 'green', NEXT: 'orange', PENDING: 'pending', FINALIZED: 'red'
    }[match.status] || 'pending';

    return `
    <div class="row">
        <div class="col-12 mb-3">
            <div class="card shadow-sm border-start border-1 card-border-${border}">
                <div class="card-body py-2 px-3 dark-mode rounded">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="small fw-bold text-uppercase">${match.categoryEmoji} ${match.championshipName}</div>
                        <div class="small fw-bold">${displayTime}</div>
                    </div>
                    <div class="position-relative text-center mb-2">
                        <div class="d-flex justify-content-between">
                            <div class="small text-start"><strong>🏠 ${match.homeTeam}</strong></div>
                            <div class="small text-end"><strong>✈️ ${match.visitingTeam}</strong></div>
                        </div>
                        <span class="vs-circle vs-circle-${border} position-absolute top-50 start-50 translate-middle">vs</span>
                    </div>
                    <div class="d-flex justify-content-between small mb-2">
                        <div>${match.referee ? `👨‍🦰 ${match.referee}` : ''}</div>
                        <div>${match.venue ? `🏟️ ${match.venue}` : ''}</div>
                    </div>
                    <div class="text-center mb-1">
                        <div class="d-flex flex-wrap justify-content-center gap-2">
                            ${linkBtns}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}
