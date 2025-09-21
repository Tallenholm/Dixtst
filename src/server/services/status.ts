import type {
  BridgeState,
  CircadianPhase,
  CircadianTimelineEntry,
  CustomScene,
  GroupSummary,
  LightStateSummary,
  LocationInfo,
  ScheduleEntry,
  StatusPayload,
} from '@shared/types';
import { LIGHT_EFFECTS, PRESET_SCENES } from '@shared/constants';
import { HueBridgeService } from './hue';
import { Storage } from '../storage';

const LIGHT_CACHE_MS = 3_000;
const GROUP_CACHE_MS = 30_000;
const SCENE_CACHE_MS = 60_000;

export class StatusService {
  private lightsCache: { data: LightStateSummary[]; at: number } | null = null;
  private groupsCache: { data: GroupSummary[]; at: number } | null = null;
  private scenesCache: { data: { hueScenes: StatusPayload['hueScenes'] }; at: number } | null = null;
  private currentPhase: CircadianPhase = 'night';
  private nextPhaseAt?: Date;
  private location?: LocationInfo;
  private schedules: ScheduleEntry[] = [];
  private customScenes: CustomScene[] = [];
  private timeline: CircadianTimelineEntry[] = [];
  private activeEffect: string | null;

  constructor(private readonly hue: HueBridgeService, private readonly storage: Storage) {
    this.location = storage.getLocation();
    this.schedules = storage.getSchedules();
    this.customScenes = storage.getCustomScenes();
    this.activeEffect = storage.getActiveEffect()?.id ?? null;
  }

  setPhase(phase: CircadianPhase, next?: Date) {
    this.currentPhase = phase;
    this.nextPhaseAt = next;
  }

  setLocation(location?: LocationInfo) {
    this.location = location;
  }

  setSchedules(schedules: ScheduleEntry[]) {
    this.schedules = schedules;
  }

  setCustomScenes(scenes: CustomScene[]) {
    this.customScenes = scenes;
  }

  setCircadianTimeline(timeline: CircadianTimelineEntry[]) {
    this.timeline = timeline;
  }

  setActiveEffect(effect: string | null) {
    this.activeEffect = effect;
  }

  async getLights(force = false): Promise<LightStateSummary[]> {
    const now = Date.now();
    if (!force && this.lightsCache && now - this.lightsCache.at < LIGHT_CACHE_MS) {
      return this.lightsCache.data;
    }
    try {
      const lights = await this.hue.refreshLights();
      this.lightsCache = { data: lights, at: now };
      return lights;
    } catch (error) {
      if (error instanceof Error && error.message === 'bridge_not_configured') {
        const fallback: LightStateSummary[] = [];
        this.lightsCache = { data: fallback, at: now };
        return fallback;
      }
      throw error;
    }
  }

  async getGroups(force = false): Promise<GroupSummary[]> {
    const now = Date.now();
    if (!force && this.groupsCache && now - this.groupsCache.at < GROUP_CACHE_MS) {
      return this.groupsCache.data;
    }
    try {
      const groups = await this.hue.listGroups();
      this.groupsCache = { data: groups, at: now };
      return groups;
    } catch (error) {
      if (error instanceof Error && error.message === 'bridge_not_configured') {
        const fallback: GroupSummary[] = [];
        this.groupsCache = { data: fallback, at: now };
        return fallback;
      }
      throw error;
    }
  }

  async getHueScenes(force = false): Promise<StatusPayload['hueScenes']> {
    const now = Date.now();
    if (!force && this.scenesCache && now - this.scenesCache.at < SCENE_CACHE_MS) {
      return this.scenesCache.data.hueScenes;
    }
    try {
      const hueScenes = await this.hue.listScenes();
      this.scenesCache = { data: { hueScenes }, at: now };
      return hueScenes;
    } catch (error) {
      if (error instanceof Error && error.message === 'bridge_not_configured') {
        const fallback: StatusPayload['hueScenes'] = [];
        this.scenesCache = { data: { hueScenes: fallback }, at: now };
        return fallback;
      }
      throw error;
    }
  }

  private getBridgeState(): BridgeState {
    const bridge = this.storage.getBridge();
    return bridge
      ? {
          configured: true,
          ip: bridge.ip,
        }
      : { configured: false };
  }

  async getStatus(): Promise<StatusPayload> {
    const [lights, groups, hueScenes] = await Promise.all([
      this.getLights(),
      this.getGroups(),
      this.getHueScenes(),
    ]);
    return {
      phase: this.currentPhase,
      nextPhaseAt: this.nextPhaseAt?.toISOString(),
      lights,
      groups,
      schedules: this.schedules,
      location: this.location,
      bridge: this.getBridgeState(),
      activeEffect: this.activeEffect,
      effects: LIGHT_EFFECTS,
      presetScenes: PRESET_SCENES,
      hueScenes,
      customScenes: this.customScenes,
      circadianTimeline: this.timeline,
      updatedAt: new Date().toISOString(),
    };
  }
}
