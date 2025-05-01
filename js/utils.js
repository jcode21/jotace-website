export function parseDateTimeObject(obj) {
    if (!obj || typeof obj.seconds !== 'number') return null;
    return new Date(obj.seconds * 1000);
}