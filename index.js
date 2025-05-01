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
            //renderTable(eventsDataToday, 'tBodyToday');
            //renderTable(eventsDataNext, 'tBodyNext', true);
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

    data.forEach(category => {
        if (!category.championShips) return;

        category.championShips.forEach(championship => {

            championship.matchDays
                .forEach(matchDay => {
                    matchDay.matchs.forEach(match => {

                        const matchDateTime = parseDateTimeObject(match.dateTime);
                        if (!matchDateTime) return;

                        // Comparación para eventos de hoy
                        const matchDateStr = matchDateTime.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
                        if (matchDateStr !== todayStr) return;

                        if (matchDateTime.getTime() >= xHoursAgoTime) {
                            eventsToday.push({ ...match, date: matchDateTime, championshipName: championship.name });
                        }

                    });
                });

            const nextDay = new Date(now);
            nextDay.setDate(now.getDate() + 1);
            const nextDayStr = nextDay.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

            let foundMatches = false;

            championship.matchDays.forEach(matchDay => {
                if (foundMatches) return;

                const nextMatches = matchDay.matchs.filter(match => {
                    const matchDateTime = parseDateTimeObject(match.dateTime);
                    if (!matchDateTime) return false;

                    const matchDateStr = matchDateTime.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
                    return matchDateStr === nextDayStr;

                });

                if (nextMatches.length > 0) {
                    eventsNext.push(...nextMatches.slice(0, X_RECORDS_ADDITIONAL).map(match => ({ ...match, championshipName: championship.name })));
                    foundMatches = true;
                }
            });

            if (!foundMatches) {
                const nextMatchDayNumber = Number(championship.currentMatchDay) + 1;

                championship.matchDays
                    .filter(matchDay => Number(matchDay.number) === nextMatchDayNumber)
                    .forEach(matchDay => {
                        const nextMatches = matchDay.matchs.filter(match => match.dateTime && match.dateTime.trim() !== "").slice(0, X_RECORDS_ADDITIONAL);

                        eventsNext.push(...nextMatches.map(match => ({ ...match, championshipName: championship.name })));
                    });
            }
        });
    });

    eventsToday.sort((a, b) => a.date - b.date);
    eventsNext.sort((a, b) => a.date - b.date);

    return { eventsToday, eventsNext };
}

function parseDateTimeObject(dateTimeObj) {
    if (!dateTimeObj || typeof dateTimeObj.seconds !== 'number') return null;
    return new Date(dateTimeObj.seconds * 1000);
}

function renderTable(data, tableId, showDate = false) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = "";

    if (!data.length) {
        tableBody.innerHTML = `<tr><td colspan="2" class="text-center">No hay eventos disponibles</td></tr>`;
        return;
    }

    data.forEach(match => {
        const matchDateTime = match.date || parseDateTimeObject(match.dateTime);
        if (!matchDateTime) return;
        const matchDateStr = matchDateTime.toLocaleDateString("es-ES");
        const matchTimeStr = matchDateTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

        const matchDisplayTime = showDate ? `${matchDateStr} ${matchTimeStr}` : matchTimeStr;

        const row = document.createElement("tr");
        row.classList.add("cursor-pointer");
        row.innerHTML = `
            <td class='text-center'>${matchDisplayTime}</td>
            <td><strong>${match.championshipName}</strong>: ${match.homeTeam} vs ${match.visitingTeam}</td>
        `;

        const filteredLinks = match.links.filter(link => !link.url.includes(".m3u8"));

        const detailRow = document.createElement("tr");
        detailRow.classList.add("detail-row", "d-none");

        if (filteredLinks.length > 0) {
            detailRow.innerHTML = `
                <td colspan="2" class="bg-light">
                    ${filteredLinks.map(link => `
                        <a class='text-decoration-none d-block py-2 border-bottom' 
                        href="channel/channel.html?matchId=${match.id}&linkId=${link.id}" target="_blank">
                            ${link.name}
                        </a>`).join("")}
                </td>
            `;
        } else {
            detailRow.innerHTML = `
                <td colspan="2" class="text-center text-muted bg-light">
                    Links disponibles minutos antes del evento!
                </td>
            `;
        }

        tableBody.append(row, detailRow);

        row.addEventListener("click", () => detailRow.classList.toggle("d-none"));

    });
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

    renderTable(filteredData, 'tBodyToday');
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
                                    <h5 class="card-title fw-bold">${channel.name}</h5>
                                    <a href="play/play.html?channelId=${channel.id}&linkId=${channel.links[0].id}" target="_blank" class="btn btn-danger btn-sm">
                                        <i class="bi bi-play-fill"></i> Ver canal
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
                                    <h5 class="card-title fw-bold">${channel.name}</h5>
                                    <a href="channel/channel.html?channelId=${channel.id}&linkId=${channel.links[0].id}" target="_blank" class="btn btn-danger btn-sm">
                                        <i class="bi bi-play-fill"></i> Ver canal
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

document.getElementById("searchEvent").addEventListener("input", searchEvents);
document.addEventListener("DOMContentLoaded", fetchData);
