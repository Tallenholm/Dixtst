import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HueBridgeService } from './hue';
import { Storage } from '../storage';
import { v3 } from 'node-hue-api';

// Mock dependencies
vi.mock('node-hue-api', () => ({
  v3: {
    api: {
      createLocal: vi.fn().mockReturnValue({
        connect: vi.fn(),
      }),
    },
    lightStates: {
      GroupLightState: class {
        on() { return this; }
        brightness() { return this; }
        ct() { return this; }
        hue() { return this; }
        sat() { return this; }
        scene() { return this; }
      },
      LightState: class {
        on() { return this; }
        brightness() { return this; }
        ct() { return this; }
        hue() { return this; }
        sat() { return this; }
      },
    },
  },
}));

vi.mock('../storage', () => ({
  Storage: class {
    getBridge() {
      return { ip: '192.168.1.2', username: 'testuser' };
    }
    saveActiveEffect() {}
    getActiveEffect() { return null; }
  },
}));

describe('HueBridgeService Performance - Breathing Effect', () => {
  let service: HueBridgeService;
  let mockSetGroupState: any;
  let activeRequests = 0;
  let maxActiveRequests = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    activeRequests = 0;
    maxActiveRequests = 0;

    // Create service
    service = new HueBridgeService(new Storage());

    // Mock API
    mockSetGroupState = vi.fn().mockImplementation(async () => {
      activeRequests++;
      if (activeRequests > maxActiveRequests) {
        maxActiveRequests = activeRequests;
      }
      // Simulate network delay of 600ms
      await new Promise((resolve) => setTimeout(resolve, 600));
      activeRequests--;
    });

    const mockApi = {
      groups: {
        setGroupState: mockSetGroupState,
      },
      lights: {
        getAll: vi.fn().mockResolvedValue([]),
        setLightState: vi.fn().mockResolvedValue(true),
      },
    };

    (v3.api.createLocal as any).mockReturnValue({
      connect: vi.fn().mockResolvedValue(mockApi),
    });
  });

  afterEach(async () => {
    await service.stopEffect();
  });

  it('should prevent overlapping requests in runBreathing', async () => {
    // Start breathing effect with high speed (implies 500ms interval)
    // The initial call waits, so the interval starts after ~600ms
    await service.startEffect('breathing', { speed: 10, intensity: 100 });

    // Let it run for enough time to trigger overlaps
    // T=0: startEffect calls api (req 1).
    // T=600: req 1 finishes. Interval starts (500ms).
    // T=1100: Interval tick 1 -> req 2 starts. (duration 600ms, ends 1700). Active: 1.
    // T=1600: Interval tick 2 -> req 3 starts. (duration 600ms, ends 2200). Active: 2!

    // We wait 2000ms total from start (approx).
    // Actually we need to wait after startEffect returns.

    await new Promise((resolve) => setTimeout(resolve, 1500));
    // 1500ms wait after startEffect returns (at T=600).
    // Total time T=2100.
    // Tick 1 at 1100 (relative to T=0) -> +500ms from startEffect return.
    // Tick 2 at 1600 (+1000ms)
    // Tick 3 at 2100 (+1500ms)

    console.log('Max concurrent requests:', maxActiveRequests);

    // Stop effect to clear intervals
    await service.stopEffect();

    // With optimization, this should be 1.
    // Without optimization, this should be > 1.
    // We assert that it behaves optimally (fails currently).
    expect(maxActiveRequests).toBe(1);
  }, 10000); // Increased timeout for the test
});
