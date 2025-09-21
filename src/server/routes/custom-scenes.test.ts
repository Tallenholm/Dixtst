import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LightStateSummary } from '@shared/types';
import { createApiRouter } from './api';
import { Storage } from '../storage';
import { StatusService } from '../services/status';

function createLight(): LightStateSummary {
  return {
    id: '1',
    name: 'Test lamp',
    isOn: true,
    brightness: 150,
    colorTemp: 350,
    updatedAt: new Date().toISOString(),
  };
}

describe('custom scene routes', () => {
  const hueMock = {
    applyStateToAllLights: vi.fn().mockResolvedValue(undefined),
    stopEffect: vi.fn().mockResolvedValue(undefined),
    refreshLights: vi.fn().mockResolvedValue([createLight()]),
    listGroups: vi.fn().mockResolvedValue([]),
    listScenes: vi.fn().mockResolvedValue([]),
    getActiveEffect: vi.fn().mockReturnValue(null),
  } as any;

  const schedulerStub = {
    getSchedules: () => [],
    updateSchedules: vi.fn(),
    getLocation: () => undefined,
    updateLocation: vi.fn(),
    getPhase: () => ({ phase: 'day', next: new Date(Date.now() + 3_600_000) }),
  } as any;

  let storage: Storage;
  let status: StatusService;
  let app: express.Express;

  beforeEach(() => {
    storage = new Storage(':memory:');
    status = new StatusService(hueMock, storage);
    status.setCircadianTimeline([]);
    status.setCustomScenes([]);
    const router = createApiRouter({ hue: hueMock, scheduler: schedulerStub, status, storage });
    app = express().use(express.json()).use('/api', router);
    vi.clearAllMocks();
  });

  it('creates and lists a custom scene', async () => {
    const response = await request(app).post('/api/custom-scenes').send({
      name: 'Movie night',
      brightness: 120,
      colorTemp: 400,
      description: 'Warm and dim',
    });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'Movie night', brightness: 120, colorTemp: 400 });

    const scenes = storage.getCustomScenes();
    expect(scenes).toHaveLength(1);
    const payload = await status.getStatus();
    expect(payload.customScenes).toHaveLength(1);
  });

  it('rejects invalid custom scene payloads', async () => {
    const response = await request(app).post('/api/custom-scenes').send({
      brightness: 50,
    });
    expect(response.status).toBe(400);
  });

  it('applies and deletes a stored custom scene', async () => {
    const create = await request(app).post('/api/custom-scenes').send({
      name: 'Focus boost',
      brightness: 200,
      colorTemp: 300,
    });
    const sceneId = create.body.id as string;

    const apply = await request(app).post(`/api/custom-scenes/${sceneId}/apply`).send();
    expect(apply.status).toBe(200);
    expect(hueMock.applyStateToAllLights).toHaveBeenCalledWith({
      on: true,
      bri: 200,
      ct: 300,
      hue: undefined,
      sat: undefined,
    });
    expect(apply.body.lights).toHaveLength(1);

    const remove = await request(app).delete(`/api/custom-scenes/${sceneId}`).send();
    expect(remove.status).toBe(200);
    expect(storage.getCustomScenes()).toHaveLength(0);
  });
});
