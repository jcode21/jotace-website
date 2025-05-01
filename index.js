let eventsDataToday = [];
let eventsDataNext = [];
let channelsData = [];

async function fetchData() {
    const loading = document.getElementById("loadingScreen");
    loading.style.display = "flex"; // Mostrar loading

    try {
        let API = `${HOSTS.API_DATA}/generic`
        const response = await fetch(API);
        if (!response.ok) throw new Error(`Error en la API: ${response.status}`);

        const data = await response.json();

        if (data && data.categories) {
            const { eventsToday, eventsNext } = filterEventsDataFromAPI(data.categories);
            eventsDataToday = eventsToday;
            eventsDataNext = eventsNext;
            channelsData = data.channels
            renderCards(eventsDataToday, 'divRowsCurrentEvents');
            renderCards(eventsDataNext, 'divRowsNextEvents', true);
            renderChannels(channelsData);
        }

        const date = new Date();
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        document.getElementById("title-agenda").innerText = `Agenda - ${date.toLocaleDateString('es-ES', options)}`;
        document.getElementById("title-agenda-next").innerText = `Próximos Eventos`;
    } catch (error) {
        console.error("Error al obtener datos:", error);
    } finally {
        loading.style.display = "none"; // Ocultar loading
    }
}


function filterEventsDataFromAPI(data) {
    if (!Array.isArray(data)) {
        console.error("Error: 'data' no es una lista válida.", data);
        return { eventsToday: [], eventsNext: [] };
    }

    const eventsToday = [];
    const eventsNext = [];

    const now = new Date();
    const todayStr = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const nowTime = now.getTime();
    const xHoursAgoTime = nowTime - X_HOUR * 3600 * 1000;

    const FIFTEEN_MIN_MS = 15 * 60 * 1000;
    const X_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

    data.forEach(category => {
        if (!category.championShips) return;

        category.championShips.forEach(championship => {

            championship.matchDays.forEach(matchDay => {
                matchDay.matchs.forEach(match => {
                    const matchDateTime = parseDateTimeObject(match.dateTime);
                    if (!matchDateTime) return;

                    if(match.show == 'N') return;

                    const matchDateStr = matchDateTime.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
                    if (matchDateStr !== todayStr) return;

                    const matchEndTime = matchDateTime.getTime() + match.eventDuration * 60 * 1000;
                    if (matchEndTime >= xHoursAgoTime) {

                        const timeUntilStart = matchDateTime.getTime() - nowTime;
                        const timeSinceStart = nowTime - matchDateTime.getTime();

                        let status = "PENDING";
                        if (timeSinceStart >= 0 && nowTime <= matchEndTime) {
                            status = "LIVE";
                        } else if (timeUntilStart <= FIFTEEN_MIN_MS && timeUntilStart > 0) {
                            status = "NEXT";
                        } else if (nowTime > matchEndTime) {
                            status = "FINALIZED";
                        }

                        eventsToday.push({
                            ...match,
                            date: matchDateTime,
                            championshipName: championship.name,
                            status
                        });
                    }
                });
            });

            championship.matchDays.forEach(matchDay => {
                const nextMatches = matchDay.matchs.filter(match => {
                    const matchDateTime = parseDateTimeObject(match.dateTime);
                    if (!matchDateTime) return false;

                    const matchTime = matchDateTime.getTime();
                    const timeUntilMatch = matchTime - nowTime;

                    return matchTime > nowTime && timeUntilMatch <= X_DAYS_MS;
                });

                if (nextMatches.length > 0) {
                    eventsNext.push(...nextMatches.slice(0, X_RECORDS_ADDITIONAL).map(match => ({
                        ...match,
                        championshipName: championship.name
                    })));
                }
            });

        });
    });

    eventsToday.sort((a, b) => a.date - b.date);

    const finalizedEvents = eventsToday.filter(event => event.status === "FINALIZED");
    const nonFinalizedEvents = eventsToday.filter(event => event.status !== "FINALIZED");

    eventsToday.length = 0;
    eventsToday.push(...nonFinalizedEvents, ...finalizedEvents);

    eventsNext.sort((a, b) => a.date - b.date);

    return { eventsToday, eventsNext };
}

function parseDateTimeObject(dateTimeObj) {
    if (!dateTimeObj || typeof dateTimeObj.seconds !== 'number') return null;
    return new Date(dateTimeObj.seconds * 1000);
}

function renderCards(data, elementId, showDate = false) {

    const div = document.getElementById(elementId);
    div.innerHTML = '';

    let rows = '';

    console.log(data)

    if (!data.length) {
        return;
    }

    data.forEach(match => {
        const matchDateTime = match.date || parseDateTimeObject(match.dateTime);
        if (!matchDateTime) return;

        const filteredLinks = match.links.filter(link => !link.url.includes(".m3u8"));

        rows += getRow(match, matchDateTime, filteredLinks, showDate);

    });

    div.innerHTML = rows;
}

function searchEvents() {
    const searchInput = document.getElementById("searchEvent").value.toLowerCase();
    if (!eventsDataToday.length) {
        console.warn("No hay datos de eventos cargados.");
        return;
    }

    const filteredData = eventsDataToday.filter(event =>
        event.championshipName.toLowerCase().includes(searchInput) ||
        event.homeTeam.toLowerCase().includes(searchInput) ||
        event.visitingTeam.toLowerCase().includes(searchInput)
    );

    renderCards(filteredData, 'tBodyToday');
}

function renderChannels(data) {

    const divRowsChannels = document.getElementById("divRowsChannels");
    divRowsChannels.innerHTML = "";

    const containerNavBar = document.getElementById("containerNavBar");
    containerNavBar.innerHTML = "";

    const sortedData = [...data].sort((a, b) => Number(a.order) - Number(b.order));

    let cards = ''
    sortedData.forEach(channel => {
        if (channel.show === 'Y' && channel.links.length > 0) {

            const li = document.createElement("li");
            li.classList.add("cursor-pointer");

            if (channel.links[0].url.includes(".m3u8")) {

                cards += `
                        <div class="col-12 col-md-3 col-sm-4 mb-4">
                            <div class="card text-center card-border-green shadow-sm">
                                <div class="card-body">
                                    <img src="/img/channels/espn.png" alt="${channel.name} Logo" class="mb-1" style="width: 100px; height: auto;">
                                    <h6 class="card-title fw-bold">${channel.name}</h6>
                                    <a href="play/play.html?channelId=${channel.id}&linkId=${channel.links[0].id}" target="_blank"
                                                class="btn btn-primary btn-sm px-2 py-1 shadow-sm rounded-pill"
                                                style="font-size: 0.75rem;">
                                        <i class="bi bi-play-fill me-1"></i>Ver canal
                                    </a>
                                </div>
                            </div>
                        </div>
                
                `;

                li.innerHTML = `
                    <a href="play/play.html?channelId=${channel.id}&linkId=${channel.links[0].id}"
                       target="_blank" class="dropdown-item">
                        ${channel.name}
                    </a>`;

            } else {

                cards += `
                        <div class="col-12 col-md-3 col-sm-4 mb-4">
                            <div class="card text-center card-border-green shadow-sm">
                                <div class="card-body">
                                    <img src="/img/channels/espn.png" alt="${channel.name} Logo" class="mb-1" style="width: 100px; height: auto;">
                                    <h6 class="card-title fw-bold">${channel.name}</h6>
                                    <a href="channel/channel.html?channelId=${channel.id}&linkId=${channel.links[0].id}" target="_blank"
                                                class="btn btn-primary btn-sm px-2 py-1 shadow-sm rounded-pill"
                                                style="font-size: 0.75rem;">
                                        <i class="bi bi-play-fill me-1"></i>Ver canal
                                    </a>
                                </div>
                            </div>
                        </div>
                
                `;

                li.innerHTML = `
                    <a href="channel/channel.html?channelId=${channel.id}&linkId=${channel.links[0].id}"
                       target="_blank" class="dropdown-item">
                        ${channel.name}
                    </a>`;

            }

            containerNavBar.append(li);
        }
    });

    divRowsChannels.innerHTML = cards;
}

function getRow(match, matchDateTime, links, showDate) {

    const matchDateStr = matchDateTime.toLocaleDateString("es-ES");
    const matchTimeStr = matchDateTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    const matchDisplayTime = showDate ? `🗓️ ${matchDateStr} ${matchTimeStr}` : `🕒 ${matchTimeStr}`;


    let linksHTML = ``;
    links.forEach(link => {
        linksHTML +=
            `
        <a href="channel/channel.html?matchId=${match.id}&linkId=${link.id}" target="_blank"
                                                class="btn btn-primary btn-sm px-2 py-1 shadow-sm rounded-pill"
                                                style="font-size: 0.75rem;">
                                                <i class="bi bi-play-fill me-1"></i>${link.name}
                                            </a>
        `;
    });

    let cardBorderClass = '';
    let circleVsClass = ''
    let textChampionNameClass = '';

    switch (match.status) {
        case "LIVE":
            cardBorderClass = 'card-border-green';
            circleVsClass = 'vs-circle-green'
            textChampionNameClass + 'text-green';
            break;
        case "NEXT":
            cardBorderClass = 'card-border-orange';
            circleVsClass = 'vs-circle-orange'
            textChampionNameClass + 'text-orange';
            break;
        case "PENDING":
            cardBorderClass = 'card-border-pending';
            circleVsClass = 'vs-circle-pending'
            textChampionNameClass + '';
            break;
        case "FINALIZED":
            cardBorderClass = 'card-border-red';
            circleVsClass = 'vs-circle-red'
            textChampionNameClass + 'text-red';
            break;
        default:
            cardBorderClass = 'card-border-pending';
            circleVsClass = 'vs-circle-pending';
            textChampionNameClass + '';
            break;
    }


    let row = `
    <div class="row">
                        <div class="col-12 mb-3">
                            <div class="card shadow-sm border-start border-1 ${cardBorderClass}">
                                <div class="card-body py-2 px-3 dark-mode rounded">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <div class="small fw-bold text-uppercase ${textChampionNameClass}">
                                            🏆 ${match.championshipName}
                                        </div>
                                        <div class="small fw-bold">
                                           ${matchDisplayTime}
                                        </div>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <div class="text-center small">
                                            <strong>🏠 ${match.homeTeam}</strong>
                                        </div>
                                        <span class="vs-circle ${circleVsClass}">vs</span>
                                        <div class="text-center small">
                                            <strong>✈️ ${match.visitingTeam}</strong>
                                        </div>
                                    </div>
                                    <div class="d-flex justify-content-between small mb-2 px-1">
                                        <div>👨‍🦰 ${match.referee}</div>
                                        <div>🏟️ ${match.venue}</div>
                                    </div>
                                    <div class="text-center mb-1">
                                        <div class="d-flex flex-wrap justify-content-center gap-2">
                                            ${linksHTML}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
    `;


    return row;
}

document.getElementById("searchEvent").addEventListener("input", searchEvents);
document.addEventListener("DOMContentLoaded", fetchData);
