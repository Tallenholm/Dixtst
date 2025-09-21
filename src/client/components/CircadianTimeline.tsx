import { useMemo } from 'react';
import type { CircadianTimelineEntry, CircadianPhase } from '@shared/types';
import { formatTime, intensityLabel, phaseLabel } from '../utils/formatters';

const PHASE_STYLES: Record<CircadianPhase, string> = {
  night: 'bg-slate-900 text-slate-200',
  dawn: 'bg-gradient-to-r from-circadian-dawn/40 via-circadian-amber/40 to-circadian-amber/60 text-slate-900',
  day: 'bg-sky-500/30 text-slate-900',
  dusk: 'bg-gradient-to-r from-circadian-amber/40 via-rose-500/30 to-rose-500/50 text-slate-900',
};

type Props = {
  timeline: CircadianTimelineEntry[];
  currentPhase: CircadianPhase;
};

export function CircadianTimeline({ timeline, currentPhase }: Props) {
  const summary = useMemo(() => {
    if (!timeline.length) return null;
    const start = new Date(timeline[0].start).getTime();
    const end = new Date(timeline[timeline.length - 1].end).getTime();
    const total = Math.max(end - start, 1);
    const now = Date.now();
    const progress = Math.max(0, Math.min(1, (now - start) / total));

    return {
      total,
      progress,
    };
  }, [timeline]);

  if (!timeline.length) {
    return (
      <section className="card p-6">
        <h3 className="text-lg font-semibold">Circadian rhythm</h3>
        <p className="mt-2 text-sm text-slate-400">
          Set your installation location to preview the circadian lighting curve for the current day.
        </p>
      </section>
    );
  }

  return (
    <section className="card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Circadian rhythm</h3>
        <span className="text-sm text-slate-400">Current phase: {phaseLabel(currentPhase)}</span>
      </div>
      <div className="relative h-16 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex h-full w-full">
          {timeline.map((segment) => {
            const start = new Date(segment.start).getTime();
            const end = new Date(segment.end).getTime();
            const width = summary ? ((end - start) / summary.total) * 100 : 25;
            const key = `${segment.phase}-${segment.start}`;
            const style = PHASE_STYLES[segment.phase] ?? 'bg-slate-800 text-slate-200';
            return (
              <div
                key={key}
                className={`flex h-full items-center justify-center text-xs font-semibold ${style}`}
                style={{ width: `${width}%` }}
              >
                <span className="px-2 text-center drop-shadow">{phaseLabel(segment.phase)}</span>
              </div>
            );
          })}
        </div>
        {summary && (
          <div
            className="pointer-events-none absolute inset-y-0 flex flex-col items-center"
            style={{ left: `${summary.progress * 100}%` }}
          >
            <span className="-translate-y-2 text-[10px] font-semibold text-slate-200">Now</span>
            <span className="h-full w-px bg-slate-100/70" />
          </div>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {timeline.map((segment) => (
          <div key={`meta-${segment.phase}-${segment.start}`} className="rounded-lg bg-slate-900/50 p-3 text-xs text-slate-300">
            <p className="text-sm font-semibold text-slate-100">{phaseLabel(segment.phase)}</p>
            <p>
              {formatTime(segment.start)} – {formatTime(segment.end)}
            </p>
            <p>
              Brightness {intensityLabel(segment.brightness)} · CT {segment.colorTemp}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CircadianTimeline;
