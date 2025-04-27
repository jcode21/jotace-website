let eventsDataToday = [];
let eventsDataNext = [];
let channelsData = [];

async function fetchData() {
    try {
        let API = `${HOSTS.API_DATA}/generic`
        const response = await fetch(API);
        if (!response.ok) throw new Error(`Error en la API: ${response.status}`);

        const data = await response.json();

        if (data && data.categories) {
            const { eventsToday, eventsNext } = filterEventsDataFromAPI(data.categories);
            eventsDataToday = eventsToday;
            eventsDataNext = eventsNext;
            channelsData = data.channels;
            loadDataFrame()
        }
        
    } catch (error) {
        console.error("Error al obtener datos:", error);
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

async function loadDataFrame() {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");
    const channelId = params.get("channelId");
    const linkId = params.get("linkId");

    if (!linkId) return console.warn("No se encontró el parámetro 'linkId' en la URL");

    const { objectId, data } = matchId ? 
        { objectId: matchId, data: eventsDataToday } : 
        channelId ? 
        { objectId: channelId, data: channelsData } : 
        {};

    if (!objectId || !data) return console.warn("No se encontró un 'matchId' ni 'channelId' válidos en la URL");

    const event = data.find(item => item.id === objectId);
    if (!event) return console.warn(`No se encontró un evento con el ID: ${objectId}`);

    const link = event.links?.find(item => item.id === linkId);
    if (!link) return console.warn(`No se encontró un enlace válido para el linkId: ${linkId}`);
    updateIframe(link.url)
}


function updateIframe(url) {
    document.getElementById("frameView").src = url;
}

document.addEventListener("DOMContentLoaded", fetchData);
