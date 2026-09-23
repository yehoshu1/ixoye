import { describe, expect, it } from 'vitest';
import {
    isValidTimeZone,
    pickerDateToUtc,
    utcToZonedPickerDate,
    zonedWallClockToUtc,
} from '../timezone';

describe('timezone helpers', () => {
    it('validates IANA timezones', () => {
        expect(isValidTimeZone('America/New_York')).toBe(true);
        expect(isValidTimeZone('UTC')).toBe(true);
        expect(isValidTimeZone('Not/AZone')).toBe(false);
    });

    it('converts wall-clock in a zone to UTC', () => {
        // 2026-07-01 18:00 in New York (EDT, UTC-4) → 22:00 UTC
        const utc = zonedWallClockToUtc(2026, 6, 1, 18, 0, 0, 0, 'America/New_York');
        expect(utc.toISOString()).toBe('2026-07-01T22:00:00.000Z');
    });

    it('round-trips picker wall-clock through server timezone', () => {
        const utc = zonedWallClockToUtc(2026, 0, 15, 9, 30, 0, 0, 'Europe/London');
        const picker = utcToZonedPickerDate(utc, 'Europe/London');
        expect(picker).not.toBeNull();
        const back = pickerDateToUtc(picker!, 'Europe/London');
        expect(back?.toISOString()).toBe(utc.toISOString());
    });

    it('leaves null/undefined as null', () => {
        expect(utcToZonedPickerDate(null, 'UTC')).toBeNull();
        expect(pickerDateToUtc(undefined, 'UTC')).toBeNull();
    });

    it('treats UTC picker dates as local wall-clock', () => {
        const local = new Date(2026, 0, 1, 12, 0, 0, 0);
        const utc = pickerDateToUtc(local, 'UTC');
        expect(utc?.getFullYear()).toBe(2026);
        expect(utc?.getHours()).toBe(12);
    });
});
