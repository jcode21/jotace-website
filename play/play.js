import { fetchData } from '../js/api.js';

let channelsData = [];

async function validateRequest() {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get("channelId");
    const linkId = params.get("linkId");

    if (!channelId || !linkId) {
        console.warn("Faltan parámetros en la URL");
        return;
    }

    await fetchData(
        HOSTS,
        (eventsToday, eventsNext, channels) => {
            channelsData = channels;
            searchMatch(channelId, linkId);
        },
        (error) => {
            console.error("Error al cargar los datos del canal:", error);
        }
    );
}


function searchMatch(channelId, linkId) {
    const channel = channelsData.find(item => item.id === channelId);

    if (!channel) {
        console.warn(`No se encontró un canal con el ID: ${channelId}`);
        return;
    }

    if (!channel.links.length) {
        console.warn(`No se encontraron links para el canal con ID: ${channelId}`);
        return;
    }

    let linkToStream = channel.links.find(link => link.id === linkId);

    if (!linkToStream) {
        console.warn(`No se encontraron link para stream con ID: ${linkId}`);
        return;
    }

    // Renderiza los botones de opciones
    let containerBtns = document.getElementById('container-btns-links');
    containerBtns.innerHTML = '';
    channel.links.forEach(link => {
        const isActive = link.id === linkId;
            containerBtns.innerHTML += `
                <button class="btn btn-primary btn px-4 py-2 shadow-sm rounded-pill ${isActive ? 'disabled' : 'btn-option'}"
                    channelId="${channel.id}" linkId="${link.id}" isFormat='${link.isFormat}' style="font-size: 0.8rem;">
                    <i class="bi bi-play-fill me-1"></i>${link.name}
                </button>
            `;
        
    });

    // Asigna evento a los botones de opciones
    document.querySelectorAll(".btn-option").forEach(btn => {
        btn.addEventListener("click", () => {
            const newChannelId = btn.getAttribute("channelId");
            const newLinkId = btn.getAttribute("linkId");
            const isFormat = btn.getAttribute("isFormat");
            if(isFormat === 'Y'){
                const params = new URLSearchParams({ channelId: newChannelId, linkId: newLinkId });
                window.location.search = params.toString();
            }else{
                window.location.href = `/channel/channel.html?channelId=${newChannelId}&linkId=${newLinkId}`;
            }
        });
    });

    loadStream(linkToStream.url, channel);
}

function loadStream(url, channel) {

    if (!url) {
        console.warn(`No hay enlaces disponibles para el evento con ID: ${channel.id}`);
        return;
    }

    const video = document.getElementById('videoPlayer');

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            console.log("Video listo para reproducir");
            video.play();
        });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = proxyUrl;
        video.play();
    }
}

document.addEventListener("DOMContentLoaded", validateRequest);
