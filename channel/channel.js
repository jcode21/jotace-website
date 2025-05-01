import { fetchData } from '../js/api.js';

let eventsDataToday = [];
let eventsDataNext = [];
let channelsData = [];

async function fetchAndLoadData() {
    await fetchData(
        HOSTS,
        (eventsToday, eventsNext, channels) => {
            eventsDataToday = eventsToday;
            eventsDataNext = eventsNext;
            channelsData = channels;
            loadDataFrame();
        },
        (error) => {
            console.error("Error al cargar datos:", error);
        }
    );
}

function loadDataFrame() {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");
    const channelId = params.get("channelId");
    const linkId = params.get("linkId");

    if (!linkId) {
        console.warn("No se encontró el parámetro 'linkId' en la URL");
        return;
    }

    const { objectId, data } = matchId
        ? { objectId: matchId, data: eventsDataToday }
        : channelId
        ? { objectId: channelId, data: channelsData }
        : {};

    if (!objectId || !data) {
        console.warn("No se encontró un 'matchId' ni 'channelId' válidos en la URL");
        return;
    }

    const event = data.find(item => item.id === objectId);
    if (!event) {
        console.warn(`No se encontró un evento con el ID: ${objectId}`);
        return;
    }

    const link = event.links?.find(item => item.id === linkId);
    if (!link) {
        console.warn(`No se encontró un enlace válido para el linkId: ${linkId}`);
        return;
    }

    updateIframe(link.url);
}

function updateIframe(url) {
    document.getElementById("frameView").src = url;
}

document.addEventListener("DOMContentLoaded", fetchAndLoadData);
