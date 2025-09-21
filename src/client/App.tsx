import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LightStateSummary, ScheduleEntry, StatusPayload } from '@shared/types';

const POLL_INTERVAL = Number(import.meta.env.VITE_STATUS_INTERVAL ?? 5000);

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = localStorage.getItem('circadianAccessToken');
  if (token) {
    headers.set('x-access-token', token);
  }
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      if (typeof data?.message === 'string') message = data.message;
      else if (typeof data?.error === 'string') message = data.error;
    } catch (error) {
      // ignore json parse error
    }
    throw new Error(message || 'Request failed');
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

type TabKey = 'dashboard' | 'schedule' | 'scenes' | 'settings';

type LightUpdate = {
  on?: boolean;
  brightness?: number;
  colorTemp?: number;
  hue?: number;
  sat?: number;
};

type GroupUpdate = LightUpdate;

type ScheduleSaveHandler = (entries: ScheduleEntry[]) => Promise<void>;

type SceneApplyHandler = (preset?: string, sceneId?: string, roomId?: string) => Promise<void>;

type EffectHandler = (effectId: string) => Promise<void>;

type LocationHandler = (payload: {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}) => Promise<void>;

type BridgeHandler = (ip: string) => Promise<void>;

function formatTime(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function phaseLabel(phase?: string) {
  switch (phase) {
    case 'dawn':
      return 'Dawn';
    case 'day':
      return 'Daylight';
    case 'dusk':
      return 'Dusk';
    case 'night':
    default:
      return 'Night';
  }
}

function intensityLabel(value: number) {
  return `${Math.round((value / 254) * 100)}%`;
}

function DashboardTab({
  status,
  pending,
  onRefresh,
  onLightChange,
  onGroupChange,
  onApplyScene,
  onStartEffect,
  onStopEffect,
}: {
  status: StatusPayload;
  pending: boolean;
  onRefresh: () => void;
  onLightChange: (id: string, update: LightUpdate) => Promise<void>;
  onGroupChange: (id: string, update: GroupUpdate) => Promise<void>;
  onApplyScene: SceneApplyHandler;
  onStartEffect: EffectHandler;
  onStopEffect: () => Promise<void>;
}) {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm text-slate-400">Current phase</p>
          <h2 className="mt-2 text-2xl font-semibold text-circadian-amber">
            {phaseLabel(status.phase)}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Next transition {formatDateTime(status.nextPhaseAt)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-400">Active effect</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {status.activeEffect
              ? status.effects.find((effect) => effect.id === status.activeEffect)?.name ?? status.activeEffect
              : 'Circadian mode'}
          </h2>
          <button
            disabled={!status.activeEffect || pending}
            onClick={onStopEffect}
            className="mt-4 button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop effect
          </button>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-400">Location</p>
          <h2 className="mt-2 text-xl font-semibold">
            {status.location?.city ? `${status.location.city}, ${status.location.country ?? ''}` : 'Not set'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{status.location ? `${status.location.latitude.toFixed(3)}, ${status.location.longitude.toFixed(3)}` : '—'}</p>
          <button onClick={onRefresh} className="mt-4 button-secondary">
            Refresh status
          </button>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Whole home presets</h3>
          <p className="text-sm text-slate-400">Apply once to override circadian mode temporarily.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {status.presetScenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => onApplyScene(scene.id)}
              className="card hover:shadow-glow transition border border-slate-800 px-4 py-6 text-left"
            >
              <h4 className="text-lg font-semibold text-circadian-amber">{scene.name}</h4>
              <p className="mt-2 text-sm text-slate-300">{scene.description}</p>
              <p className="mt-4 text-xs text-slate-500">{intensityLabel(scene.brightness)} · CT {scene.colorTemp}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Lights</h3>
          <span className="text-sm text-slate-400">{status.lights.length} connected</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {status.lights.map((light) => (
            <div key={light.id} className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{light.name}</h4>
                  <p className="text-xs text-slate-500">Updated {formatTime(light.updatedAt)}</p>
                </div>
                <button
                  onClick={() => onLightChange(light.id, { on: !light.isOn })}
                  className={`px-3 py-1 rounded-full text-sm ${
                    light.isOn
                      ? 'bg-circadian-amber text-slate-900'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {light.isOn ? 'On' : 'Off'}
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-slate-400">Brightness</label>
                <input
                  type="range"
                  min={1}
                  max={254}
                  value={light.brightness}
                  onChange={(event) =>
                    onLightChange(light.id, { brightness: Number((event.target as HTMLInputElement).value) })
                  }
                  className="w-full"
                />
                <div className="text-right text-xs text-slate-500">{intensityLabel(light.brightness)}</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-slate-400">Color temperature</label>
                <input
                  type="range"
                  min={153}
                  max={500}
                  value={light.colorTemp || 350}
                  onChange={(event) =>
                    onLightChange(light.id, { colorTemp: Number((event.target as HTMLInputElement).value) })
                  }
                  className="w-full"
                />
                <div className="text-right text-xs text-slate-500">CT {light.colorTemp || 0}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Groups</h3>
          <span className="text-sm text-slate-400">Manage rooms & zones</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {status.groups.map((group) => (
            <div key={group.id} className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{group.name}</h4>
                  <p className="text-xs text-slate-500">{group.lights.length} lights</p>
                </div>
                <button
                  onClick={() => onGroupChange(group.id, { on: true })}
                  className="px-3 py-1 rounded-full text-sm bg-circadian-amber text-slate-900"
                >
                  Turn on
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onGroupChange(group.id, { on: false })}
                  className="button-secondary text-sm"
                >
                  Turn off
                </button>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span>Quick presets:</span>
                  <button onClick={() => onGroupChange(group.id, { brightness: 200, colorTemp: 260 })} className="underline">
                    Bright
                  </button>
                  <button onClick={() => onGroupChange(group.id, { brightness: 120, colorTemp: 380 })} className="underline">
                    Warm
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Dynamic effects</h3>
          <p className="text-sm text-slate-400">Tap an effect to start it immediately.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {status.effects.map((effect) => {
            const isActive = status.activeEffect === effect.id;
            return (
              <div
                key={effect.id}
                className={`border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-3 transition ${
                  isActive ? 'shadow-glow border-circadian-amber/60' : ''
                }`}
              >
                <h4 className="text-lg font-semibold text-circadian-amber">{effect.name}</h4>
                <p className="text-sm text-slate-300">{effect.description}</p>
                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span>Speed {effect.defaultSettings.speed}</span>
                  <span>Intensity {effect.defaultSettings.intensity}%</span>
                </div>
                <button
                  onClick={() => (isActive ? onStopEffect() : onStartEffect(effect.id))}
                  className={`w-full mt-2 ${isActive ? 'button-secondary' : 'button-primary'}`}
                  disabled={pending}
                >
                  {isActive ? 'Stop effect' : 'Start effect'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ScheduleTab({ schedules, onSave }: { schedules: ScheduleEntry[]; onSave: ScheduleSaveHandler }) {
  const [drafts, setDrafts] = useState<ScheduleEntry[]>(schedules);

  useEffect(() => {
    setDrafts(schedules);
  }, [schedules]);

  const toggleDay = (scheduleId: string, day: number) => {
    setDrafts((current) =>
      current.map((schedule) => {
        if (schedule.id !== scheduleId) return schedule;
        const days = new Set(schedule.days ?? []);
        if (days.has(day)) days.delete(day);
        else days.add(day);
        return { ...schedule, days: Array.from(days).sort() };
      }),
    );
  };

  const update = <K extends keyof ScheduleEntry>(id: string, key: K, value: ScheduleEntry[K]) => {
    setDrafts((current) => current.map((schedule) => (schedule.id === id ? { ...schedule, [key]: value } : schedule)));
  };

  const addSchedule = () => {
    const newId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    setDrafts((current) => [
      ...current,
      {
        id: newId,
        name: 'New schedule',
        wakeTime: '07:00',
        sleepTime: '22:30',
        enabled: true,
        days: [1, 2, 3, 4, 5],
        wakeBrightness: 220,
        wakeColorTemp: 260,
        sleepBrightness: 60,
        sleepColorTemp: 420,
      },
    ]);
  };

  const removeSchedule = (id: string) => {
    setDrafts((current) => current.filter((schedule) => schedule.id !== id));
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-6">
      {drafts.map((schedule) => (
        <div key={schedule.id} className="card p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <input
                value={schedule.name}
                onChange={(event) => update(schedule.id, 'name', event.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-lg font-semibold"
              />
            </div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(event) => update(schedule.id, 'enabled', event.target.checked)}
              />
              <span>Enabled</span>
            </label>
            <button onClick={() => removeSchedule(schedule.id)} className="text-sm text-rose-400">
              Remove
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="uppercase tracking-wider text-xs text-slate-400">Wake time</span>
              <input
                type="time"
                value={schedule.wakeTime}
                onChange={(event) => update(schedule.id, 'wakeTime', event.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="uppercase tracking-wider text-xs text-slate-400">Sleep time</span>
              <input
                type="time"
                value={schedule.sleepTime}
                onChange={(event) => update(schedule.id, 'sleepTime', event.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
              />
            </label>
          </div>
          <div className="space-y-2">
            <span className="uppercase tracking-wider text-xs text-slate-400">Days</span>
            <div className="flex flex-wrap gap-2">
              {dayLabels.map((label, index) => {
                const dayIndex = index;
                const isActive = schedule.days?.includes(dayIndex) ?? false;
                return (
                  <button
                    key={label + index}
                    onClick={() => toggleDay(schedule.id, dayIndex)}
                    className={`w-8 h-8 rounded-full border border-slate-700 text-sm ${
                      isActive ? 'bg-circadian-amber text-slate-900' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs text-slate-400">
              <span>Wake brightness</span>
              <input
                type="number"
                min={1}
                max={254}
                value={schedule.wakeBrightness ?? ''}
                onChange={(event) => update(schedule.id, 'wakeBrightness', Number(event.target.value))}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              <span>Wake CT</span>
              <input
                type="number"
                min={153}
                max={500}
                value={schedule.wakeColorTemp ?? ''}
                onChange={(event) => update(schedule.id, 'wakeColorTemp', Number(event.target.value))}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              <span>Sleep brightness</span>
              <input
                type="number"
                min={1}
                max={254}
                value={schedule.sleepBrightness ?? ''}
                onChange={(event) => update(schedule.id, 'sleepBrightness', Number(event.target.value))}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              <span>Sleep CT</span>
              <input
                type="number"
                min={153}
                max={500}
                value={schedule.sleepColorTemp ?? ''}
                onChange={(event) => update(schedule.id, 'sleepColorTemp', Number(event.target.value))}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
              />
            </label>
          </div>
        </div>
      ))}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button onClick={addSchedule} className="button-secondary">
          Add schedule
        </button>
        <button onClick={() => onSave(drafts)} className="button-primary">
          Save schedules
        </button>
      </div>
    </div>
  );
}

function ScenesTab({ status, onApplyScene }: { status: StatusPayload; onApplyScene: SceneApplyHandler }) {
  return (
    <div className="space-y-8">
      <section className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Preset scenes</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {status.presetScenes.map((scene) => (
            <button key={scene.id} onClick={() => onApplyScene(scene.id)} className="card px-4 py-6 text-left">
              <h4 className="text-lg font-semibold text-circadian-amber">{scene.name}</h4>
              <p className="mt-2 text-sm text-slate-300">{scene.description}</p>
              <p className="mt-4 text-xs text-slate-500">{intensityLabel(scene.brightness)} · CT {scene.colorTemp}</p>
            </button>
          ))}
        </div>
      </section>
      <section className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Hue bridge scenes</h3>
        {status.hueScenes.length === 0 ? (
          <p className="text-sm text-slate-400">No Hue scenes available. Add scenes in the Philips Hue app.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {status.hueScenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => onApplyScene(undefined, scene.id, scene.groupId)}
                className="border border-slate-800 rounded-lg px-4 py-3 text-left hover:border-circadian-amber/70"
              >
                <h4 className="font-semibold">{scene.name}</h4>
                <p className="text-xs text-slate-500">Group {scene.groupId ?? 'all lights'}</p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SettingsTab({
  status,
  token,
  onTokenChange,
  onDetectLocation,
  onUpdateLocation,
  onDiscoverBridges,
  discoveredBridges,
  onPairBridge,
  onClearBridge,
}: {
  status: StatusPayload;
  token: string;
  onTokenChange: (value: string) => void;
  onDetectLocation: () => Promise<void>;
  onUpdateLocation: LocationHandler;
  onDiscoverBridges: () => Promise<void>;
  discoveredBridges: string[];
  onPairBridge: BridgeHandler;
  onClearBridge: () => Promise<void>;
}) {
  const [locationForm, setLocationForm] = useState({
    latitude: status.location?.latitude ?? 0,
    longitude: status.location?.longitude ?? 0,
    city: status.location?.city ?? '',
    country: status.location?.country ?? '',
  });

  useEffect(() => {
    setLocationForm({
      latitude: status.location?.latitude ?? 0,
      longitude: status.location?.longitude ?? 0,
      city: status.location?.city ?? '',
      country: status.location?.country ?? '',
    });
  }, [status.location?.latitude, status.location?.longitude, status.location?.city, status.location?.country]);

  return (
    <div className="space-y-8">
      <section className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Local access token</h3>
        <p className="text-sm text-slate-400">
          Optional: set ACCESS_TOKEN on the server and enter it here to restrict API access on your home network.
        </p>
        <input
          value={token}
          onChange={(event) => onTokenChange(event.target.value)}
          placeholder="Access token"
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
        />
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Location</h3>
          <button onClick={onDetectLocation} className="button-secondary">
            Detect automatically
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs text-slate-400">
            <span>Latitude</span>
            <input
              type="number"
              value={locationForm.latitude}
              onChange={(event) => setLocationForm((prev) => ({ ...prev, latitude: Number(event.target.value) }))}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-400">
            <span>Longitude</span>
            <input
              type="number"
              value={locationForm.longitude}
              onChange={(event) => setLocationForm((prev) => ({ ...prev, longitude: Number(event.target.value) }))}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-400">
            <span>City</span>
            <input
              value={locationForm.city}
              onChange={(event) => setLocationForm((prev) => ({ ...prev, city: event.target.value }))}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-400">
            <span>Country</span>
            <input
              value={locationForm.country}
              onChange={(event) => setLocationForm((prev) => ({ ...prev, country: event.target.value }))}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
            />
          </label>
        </div>
        <button onClick={() => onUpdateLocation(locationForm)} className="button-primary">
          Save location
        </button>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Hue bridge</h3>
          <span className="text-sm text-slate-400">
            {status.bridge.configured ? `Connected to ${status.bridge.ip}` : 'No bridge configured'}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={onDiscoverBridges} className="button-secondary">
            Discover bridges
          </button>
          <button onClick={onClearBridge} className="button-secondary">
            Forget bridge
          </button>
        </div>
        {discoveredBridges.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Tap a bridge IP to pair (press the link button first).</p>
            <div className="flex flex-wrap gap-2">
              {discoveredBridges.map((ip) => (
                <button key={ip} onClick={() => onPairBridge(ip)} className="button-primary">
                  Pair {ip}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [bridgeDiscoveries, setBridgeDiscoveries] = useState<string[]>([]);
  const [token, setToken] = useState(localStorage.getItem('circadianAccessToken') ?? '');

  const loadStatus = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      try {
        const data = await apiRequest<StatusPayload>('/api/status');
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!info) return;
    const timer = setTimeout(() => setInfo(null), 4000);
    return () => clearTimeout(timer);
  }, [info]);

  useEffect(() => {
    loadStatus(true);
    const timer = setInterval(() => {
      loadStatus(false);
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [loadStatus]);

  useEffect(() => {
    localStorage.setItem('circadianAccessToken', token.trim());
  }, [token]);

  const handleLightChange = useCallback(async (id: string, update: LightUpdate) => {
    setPending(true);
    setInfo(null);
    try {
      const response = await apiRequest<{ ok: boolean; lights: LightStateSummary[] }>(
        `/api/lights/${id}/state`,
        {
          method: 'POST',
          body: JSON.stringify({
            on: update.on,
            brightness: update.brightness,
            colorTemp: update.colorTemp,
            hue: update.hue,
            sat: update.sat,
          }),
        },
      );
      setStatus((current) => (current ? { ...current, lights: response.lights } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, []);

  const handleGroupChange = useCallback(async (id: string, update: GroupUpdate) => {
    setPending(true);
    setInfo(null);
    try {
      const response = await apiRequest<{ ok: boolean; lights: LightStateSummary[] }>(`/api/groups/${id}/state`, {
        method: 'POST',
        body: JSON.stringify({
          on: update.on,
          brightness: update.brightness,
          colorTemp: update.colorTemp,
          hue: update.hue,
          sat: update.sat,
        }),
      });
      setStatus((current) => (current ? { ...current, lights: response.lights } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, []);

  const handleApplyScene = useCallback<SceneApplyHandler>(async (presetId, sceneId, roomId) => {
    setPending(true);
    setInfo(null);
    try {
      await apiRequest('/api/lights/apply-scene', {
        method: 'POST',
        body: JSON.stringify({ presetId, sceneId, roomId }),
      });
      await loadStatus(false);
      setInfo('Scene applied');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [loadStatus]);

  const handleStartEffect = useCallback<EffectHandler>(async (effectId) => {
    setPending(true);
    setInfo(null);
    try {
      await apiRequest('/api/effects/start', {
        method: 'POST',
        body: JSON.stringify({ effectId }),
      });
      await loadStatus(false);
      setInfo(`Effect ${effectId} started`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [loadStatus]);

  const handleStopEffect = useCallback(async () => {
    setPending(true);
    setInfo(null);
    try {
      await apiRequest('/api/effects/stop', { method: 'POST' });
      await loadStatus(false);
      setInfo('Effect stopped');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [loadStatus]);

  const handleSaveSchedules = useCallback<ScheduleSaveHandler>(async (entries) => {
    setPending(true);
    setInfo(null);
    try {
      await apiRequest('/api/schedule', {
        method: 'PUT',
        body: JSON.stringify({ schedules: entries }),
      });
      await loadStatus(false);
      setInfo('Schedules updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [loadStatus]);

  const handleDetectLocation = useCallback(async () => {
    setPending(true);
    setInfo(null);
    try {
      await apiRequest('/api/location/detect', { method: 'POST' });
      await loadStatus(false);
      setInfo('Location detected automatically');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [loadStatus]);

  const handleUpdateLocation = useCallback<LocationHandler>(async (payload) => {
    setPending(true);
    setInfo(null);
    try {
      await apiRequest('/api/location', { method: 'POST', body: JSON.stringify(payload) });
      await loadStatus(false);
      setInfo('Location saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [loadStatus]);

  const handleDiscoverBridges = useCallback(async () => {
    setPending(true);
    setInfo(null);
    try {
      const response = await apiRequest<{ bridges: { ip: string }[] }>('/api/bridge/discover');
      setBridgeDiscoveries(response.bridges.map((bridge) => bridge.ip));
      setInfo(`Found ${response.bridges.length} bridge(s)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, []);

  const handlePairBridge = useCallback<BridgeHandler>(async (ip) => {
    setPending(true);
    setInfo(null);
    try {
      await apiRequest('/api/bridge/pair', { method: 'POST', body: JSON.stringify({ ip }) });
      await loadStatus(false);
      setInfo(`Bridge paired at ${ip}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [loadStatus]);

  const handleClearBridge = useCallback(async () => {
    setPending(true);
    setInfo(null);
    try {
      await apiRequest('/api/bridge/clear', { method: 'POST' });
      await loadStatus(false);
      setInfo('Bridge configuration cleared');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [loadStatus]);

  const tabs: { key: TabKey; label: string }[] = useMemo(
    () => [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'schedule', label: 'Schedules' },
      { key: 'scenes', label: 'Scenes' },
      { key: 'settings', label: 'Settings' },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Dixtst Circadian Hue · Home Edition</h1>
            <p className="text-sm text-slate-400">
              Manage Philips Hue lights with circadian automation optimised for single-house deployments.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-circadian-amber text-slate-900 shadow-glow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        {loading ? (
          <div className="card p-8 text-center text-slate-300">Loading system status…</div>
        ) : error ? (
          <div className="card border border-rose-500/40 bg-rose-500/10 p-6 text-center text-rose-200">
            {error}
          </div>
        ) : status ? (
          <>
            {info && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                {info}
              </div>
            )}
            {activeTab === 'dashboard' && (
              <DashboardTab
                status={status}
                pending={pending}
                onRefresh={() => loadStatus(false)}
                onLightChange={handleLightChange}
                onGroupChange={handleGroupChange}
                onApplyScene={handleApplyScene}
                onStartEffect={handleStartEffect}
                onStopEffect={handleStopEffect}
              />
            )}
            {activeTab === 'schedule' && (
              <ScheduleTab schedules={status.schedules} onSave={handleSaveSchedules} />
            )}
            {activeTab === 'scenes' && (
              <ScenesTab status={status} onApplyScene={handleApplyScene} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                status={status}
                token={token}
                onTokenChange={setToken}
                onDetectLocation={handleDetectLocation}
                onUpdateLocation={handleUpdateLocation}
                onDiscoverBridges={handleDiscoverBridges}
                discoveredBridges={bridgeDiscoveries}
                onPairBridge={handlePairBridge}
                onClearBridge={handleClearBridge}
              />
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
