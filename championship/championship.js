import { fetchData } from '../js/api.js';
import { renderCards, renderChannels } from '../js/render.js';

let eventsDataToday = [];
let eventsDataNext = [];
let channelsData = [];

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        console.warn("No se encontró el parámetro 'id' en la URL");
        return;
    }


    fetchData(
        HOSTS,
        (today, next, channels) => {

            let filteredToday = today.filter(e =>
                e.championshipId === id
            );

            let filteredNext = next.filter(e =>
                e.championshipId === id
            );

            eventsDataToday = filteredToday;
            eventsDataNext = filteredNext;
            channelsData = channels;

            renderCards(eventsDataToday, 'divRowsCurrentEvents');
            renderCards(eventsDataNext.slice(0, 5), 'divRowsNextEvents', true);
            renderChannels(channelsData);

            const date = new Date();
            const options = { day: '2-digit', month: 'long', year: 'numeric' };
            document.getElementById("title-agenda").innerText = `Agenda - ${date.toLocaleDateString('es-ES', options)}`;
            document.getElementById("title-agenda-next").innerText = `Próximos Eventos`;

            if (eventsDataToday.length > 0 || eventsDataNext.length > 0) {
                console.log(eventsDataToday)
                console.log(eventsDataNext)
                document.getElementById("championShipName").innerText = `${eventsDataNext[0].championShipName}`;
                activeMenuById(id)
            }
        }
    );
});

document.getElementById("searchEvent").addEventListener("input", () => {
    const input = document.getElementById("searchEvent").value.toLowerCase();
    const filtered = eventsDataToday.filter(e =>
        e.championShipName.toLowerCase().includes(input) ||
        e.homeTeam.toLowerCase().includes(input) ||
        e.visitingTeam.toLowerCase().includes(input)
    );
    renderCards(filtered, 'divRowsCurrentEvents');
});

function activeMenuById(id) {
    const navItems = document.querySelectorAll('#containerNavBarTmp li');

    navItems.forEach(li => {
        const aTag = li.querySelector('a');
        if (aTag && aTag.href.includes('?id=')) {
            const urlParams = new URLSearchParams(aTag.href.split('?')[1]);
            const hrefId = urlParams.get('id');

            if (hrefId === id) {
                aTag.classList.add('active');
            } else {
                aTag.classList.remove('active');
            }
        }
    });
}
