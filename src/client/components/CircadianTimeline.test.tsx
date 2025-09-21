import { render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { CircadianTimelineEntry } from '@shared/types';
import { CircadianTimeline } from './CircadianTimeline';

describe('CircadianTimeline component', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('renders a hint when no timeline data is available', () => {
    render(<CircadianTimeline timeline={[]} currentPhase="night" />);
    expect(screen.getByText(/Set your installation location/i)).toBeInTheDocument();
  });

  it('displays segments for each circadian phase', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    const timeline: CircadianTimelineEntry[] = [
      { phase: 'night', start: '2024-01-01T00:00:00.000Z', end: '2024-01-01T06:00:00.000Z', brightness: 40, colorTemp: 430 },
      { phase: 'dawn', start: '2024-01-01T06:00:00.000Z', end: '2024-01-01T07:00:00.000Z', brightness: 120, colorTemp: 360 },
      { phase: 'day', start: '2024-01-01T07:00:00.000Z', end: '2024-01-01T18:00:00.000Z', brightness: 210, colorTemp: 250 },
      { phase: 'dusk', start: '2024-01-01T18:00:00.000Z', end: '2024-01-02T00:00:00.000Z', brightness: 140, colorTemp: 380 },
    ];
    render(<CircadianTimeline timeline={timeline} currentPhase="day" />);

    expect(screen.getByText('Circadian rhythm')).toBeInTheDocument();
    expect(screen.getByText('Current phase: Daylight')).toBeInTheDocument();
    expect(screen.getAllByText('Night').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dawn').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Daylight').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dusk').length).toBeGreaterThan(0);
    expect(screen.getByText('Now')).toBeInTheDocument();
  });
});
