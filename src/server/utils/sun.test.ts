import { beforeEach, describe, expect, it, vi } from 'vitest';

const getTimesMock = vi.hoisted(() => vi.fn());

vi.mock('suncalc', () => ({
  default: {
    getTimes: getTimesMock,
  },
}));

import { CoordinateRangeError, getCurrentPhase, getNextPhaseChange, getSunTimes } from './sun';

describe('sun utilities', () => {
  beforeEach(() => {
    getTimesMock.mockClear();
    getTimesMock.mockImplementation((date: Date) => {
      const day = date.getUTCDate();
      return {
        sunrise: new Date(Date.UTC(2024, 0, day, 7, 0, 0)),
        sunset: new Date(Date.UTC(2024, 0, day, 17, 0, 0)),
        dawn: new Date(Date.UTC(2024, 0, day, 6, 30, 0)),
        dusk: new Date(Date.UTC(2024, 0, day, 17, 30, 0)),
      };
    });
  });

  it('returns cached sun times for identical inputs', () => {
    const date = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
    const result1 = getSunTimes(40.7128, -74.006, date);
    const result2 = getSunTimes(40.7128, -74.006, new Date(Date.UTC(2024, 0, 1, 18, 0, 0)));
    expect(result1).toEqual(result2);
    expect(getTimesMock).toHaveBeenCalledTimes(1);
  });

  it('invalid coordinates throw a CoordinateRangeError', () => {
    expect(() => getSunTimes(120, 0)).toThrow(CoordinateRangeError);
    expect(() => getSunTimes(0, -200)).toThrow(CoordinateRangeError);
  });

  it('determines the current phase based on daylight milestones', () => {
    expect(getCurrentPhase(40, -73, new Date(Date.UTC(2024, 0, 1, 5, 0, 0)))).toBe('night');
    expect(getCurrentPhase(40, -73, new Date(Date.UTC(2024, 0, 1, 6, 40, 0)))).toBe('dawn');
    expect(getCurrentPhase(40, -73, new Date(Date.UTC(2024, 0, 1, 12, 0, 0)))).toBe('day');
    expect(getCurrentPhase(40, -73, new Date(Date.UTC(2024, 0, 1, 19, 0, 0)))).toBe('dusk');
  });

  it('computes the next phase change for dusk as the next dawn', () => {
    const next = getNextPhaseChange('dusk', 40, -73, new Date(Date.UTC(2024, 0, 1, 21, 0, 0)));
    expect(next.toISOString()).toBe(new Date(Date.UTC(2024, 0, 2, 6, 30, 0)).toISOString());
  });
});
