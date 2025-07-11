import { fetchData } from '../js/api.js';
import { renderChannels } from '../js/render.js';

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
            renderChannels(channelsData);
        },
        (error) => {
            console.error("Error al cargar datos:", error);
        }
    );
}

document.addEventListener("DOMContentLoaded", fetchAndLoadData);
