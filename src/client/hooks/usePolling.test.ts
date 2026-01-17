import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { usePolling } from './usePolling';

// Mock visibility state
function mockVisibilityState(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('usePolling Optimization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockVisibilityState('visible');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('No immediate call on mount (avoids double fetch)', () => {
    const callback = vi.fn();
    renderHook(() => usePolling(callback, 1000));
    // Should NOT call immediately
    expect(callback).not.toHaveBeenCalled();

    // Should call after interval
    act(() => {
        vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('Starts paused if hidden on mount', () => {
    mockVisibilityState('hidden');
    const callback = vi.fn();
    renderHook(() => usePolling(callback, 1000));

    // Advance time
    act(() => {
        vi.advanceTimersByTime(5000);
    });
    // Should NOT have called
    expect(callback).not.toHaveBeenCalled();

    // Become visible
    act(() => {
        mockVisibilityState('visible');
    });

    // Should trigger immediate call upon becoming visible
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('Optimized: Polling stops when hidden', () => {
    const callback = vi.fn();
    renderHook(() => usePolling(callback, 1000));

    // Wait for first tick
    act(() => {
        vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Simulate hidden
    mockVisibilityState('hidden');

    // Advance time
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should NOT have called again
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('Optimized: Polling resumes immediately when visible', () => {
    const callback = vi.fn();
    renderHook(() => usePolling(callback, 1000));

    mockVisibilityState('hidden');

    act(() => {
        vi.advanceTimersByTime(5000);
    });

    expect(callback).not.toHaveBeenCalled();

    // Become visible
    act(() => {
        mockVisibilityState('visible');
    });

    // Should trigger immediate call
    expect(callback).toHaveBeenCalledTimes(1);

    // Should resume interval
    act(() => {
        vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
