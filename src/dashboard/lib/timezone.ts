/**
 * Convert a wall-clock time in `timeZone` to a UTC Date.
 * Used so dashboard pickers match /create parsing of serverTimezone.
 */
export function zonedWallClockToUtc(
    year: number,
    monthIndex: number,
    day: number,
    hours: number,
    minutes: number,
    seconds = 0,
    milliseconds = 0,
    timeZone = 'UTC'
): Date {
    const asUtc = Date.UTC(year, monthIndex, day, hours, minutes, seconds, milliseconds);
    const offsetMs = getTimeZoneOffsetMs(asUtc, timeZone);
    return new Date(asUtc - offsetMs);
}

/** Offset (ms) of `timeZone` relative to UTC at the given instant. */
export function getTimeZoneOffsetMs(instantMs: number, timeZone: string): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    const parts = dtf.formatToParts(new Date(instantMs));
    const map: Record<string, string> = {};
    for (const part of parts) {
        if (part.type !== 'literal') {
            map[part.type] = part.value;
        }
    }
    const asUtc = Date.UTC(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        Number(map.hour) % 24,
        Number(map.minute),
        Number(map.second)
    );
    return asUtc - instantMs;
}

/**
 * Display a stored UTC instant as a local Date whose wall-clock fields
 * match `timeZone` (so DateTimePicker's local getHours/setHours show server TZ).
 */
export function utcToZonedPickerDate(utc: Date | null | undefined, timeZone: string): Date | null {
    if (!utc) return null;
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    const map: Record<string, string> = {};
    for (const part of dtf.formatToParts(utc)) {
        if (part.type !== 'literal') {
            map[part.type] = part.value;
        }
    }
    return new Date(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        Number(map.hour) % 24,
        Number(map.minute),
        Number(map.second)
    );
}

/**
 * Take a picker Date (local wall-clock fields) and interpret those fields
 * as being in `timeZone`, returning the correct UTC instant.
 */
export function pickerDateToUtc(pickerDate: Date | null | undefined, timeZone: string): Date | null {
    if (!pickerDate) return null;
    if (!timeZone || timeZone === 'UTC') {
        return new Date(
            pickerDate.getFullYear(),
            pickerDate.getMonth(),
            pickerDate.getDate(),
            pickerDate.getHours(),
            pickerDate.getMinutes(),
            pickerDate.getSeconds(),
            pickerDate.getMilliseconds()
        );
    }
    return zonedWallClockToUtc(
        pickerDate.getFullYear(),
        pickerDate.getMonth(),
        pickerDate.getDate(),
        pickerDate.getHours(),
        pickerDate.getMinutes(),
        pickerDate.getSeconds(),
        pickerDate.getMilliseconds(),
        timeZone
    );
}

export function isValidTimeZone(timeZone: string): boolean {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone });
        return true;
    } catch {
        return false;
    }
}
