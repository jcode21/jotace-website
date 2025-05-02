import { fetchData } from './js/api.js';
import { renderCards, renderChannels } from './js/render.js';

let eventsDataToday = [];
let eventsDataNext = [];
let channelsData = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchData(
        HOSTS,
        (today, next, channels) => {
            eventsDataToday = today;
            eventsDataNext = next;
            channelsData = channels;

            if (eventsDataNext.length > 5) {
                const btn = document.getElementById("btnShowMoreNextEvents");
                btn.style.display = "inline";
                btn.innerHTML = `<i class="bi bi-plus-square"></i> ${eventsDataNext.length - 5} eventos más`;
            }

            renderCards(eventsDataToday, 'divRowsCurrentEvents');
            renderCards(eventsDataNext.slice(0, 5), 'divRowsNextEvents', true);
            renderChannels(channelsData);

            const date = new Date();
            const options = { day: '2-digit', month: 'long', year: 'numeric' };
            document.getElementById("title-agenda").innerText = `Agenda - ${date.toLocaleDateString('es-ES', options)}`;
            document.getElementById("title-agenda-next").innerText = `Próximos Eventos`;
        }
    );
});

document.getElementById("searchEvent").addEventListener("input", () => {
    const input = document.getElementById("searchEvent").value.toLowerCase();
    const filtered = eventsDataToday.filter(e =>
        e.championshipName.toLowerCase().includes(input) ||
        e.homeTeam.toLowerCase().includes(input) ||
        e.visitingTeam.toLowerCase().includes(input)
    );
    renderCards(filtered, 'divRowsCurrentEvents');
});
