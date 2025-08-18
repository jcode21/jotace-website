import { parseDateTimeObject } from './utils.js';

export async function fetchData(HOSTS, onSuccess, onError, onFinally) {
    const loading = document.getElementById("loadingScreen");
    loading.style.display = "flex";

    try {
        const API = `${HOSTS.API_DATA_MATCHS}`;
        const response = await fetch(API);
        if (!response.ok) throw new Error(`Error en la API: ${response.statusColor}`);
        const data = await response.json();
        if (!data || !data.matchs) return;

        const { eventsToday, eventsNext } = filterEventsDataFromAPI(data.matchs);

        const APIChannels = `${HOSTS.API_DATA_CHANNELS}`;
        const responseChannels = await fetch(APIChannels);
        if (!responseChannels.ok) throw new Error(`Error en la API: ${response.statusColor}`);
        const dataChannels = await responseChannels.json();
        if (!dataChannels || !dataChannels.channels) return;
        const channelsData = dataChannels.channels;
        console.log(channelsData)

        onSuccess(eventsToday, eventsNext, channelsData);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        onError?.(error);
    } finally {
        loading.style.display = "none";
        onFinally?.();
    }
}

function filterEventsDataFromAPI(data) {
    const eventsToday = [], eventsNext = [];

    const now = new Date();
    const nowTime = now.getTime();
    const xHoursAgoTime = nowTime - X_HOUR * 3600 * 1000;
    const FIFTEEN_MIN_MS = 15 * 60 * 1000;
    const X_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

    data?.forEach(match => {
        const dt = parseDateTimeObject(match.dateTime);
        if (!dt) {
            console.warn("Invalid Date:", match.dateTime);
            return;
        }

        const isToday = dt.getDate() === now.getDate() &&
            dt.getMonth() === now.getMonth() &&
            dt.getFullYear() === now.getFullYear();

        if (!isToday) return;
        if (match.show === 'N') return;

        const end = dt.getTime() + match.eventDuration * 60 * 1000;
        if (end >= xHoursAgoTime) {
            let statusColor = "PENDING";
            const deltaStart = nowTime - dt.getTime();
            const deltaFuture = dt.getTime() - nowTime;

            if (deltaStart >= 0 && nowTime <= end) statusColor = "LIVE";
            else if (deltaFuture <= FIFTEEN_MIN_MS && deltaFuture > 0) statusColor = "NEXT";
            else if (nowTime > end) statusColor = "FINALIZED";

            eventsToday.push({
                ...match,
                date: dt,
                statusColor: statusColor
            });

        }
    });

    // Eventos próximos (distintos de hoy)
    const futureMatches = data.filter(m => {
        const dt = parseDateTimeObject(m.dateTime);
        if (!dt) return false;

        const isToday = dt.getDate() === now.getDate() &&
            dt.getMonth() === now.getMonth() &&
            dt.getFullYear() === now.getFullYear();

        const timeUntil = dt.getTime() - nowTime;
        return !isToday && dt.getTime() > nowTime && timeUntil <= X_DAYS_MS;
    });

    if (futureMatches.length > 0) {
        eventsNext.push(...futureMatches.slice(0, X_RECORDS_ADDITIONAL).map(m => ({
            ...m,
            date: parseDateTimeObject(m.dateTime)
        })));
    }

    // Ordenar y separar por estado
    eventsToday.sort((a, b) => a.date - b.date);
    const finalized = eventsToday.filter(e => e.statusColor === "FINALIZED");
    const active = eventsToday.filter(e => e.statusColor !== "FINALIZED");

    return {
        eventsToday: [...active, ...finalized],
        eventsNext: eventsNext.sort((a, b) => a.date - b.date)
    };
}

