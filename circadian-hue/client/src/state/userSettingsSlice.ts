import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserSettingsState {
  manualOverride: boolean;
  wakeUpDuration: number;
  sleepDuration: number;
  wakeUpEnabled: boolean;
  sleepEnabled: boolean;
  wakeUpTime: string;
  sleepTime: string;
}

const defaultState: UserSettingsState = {
  manualOverride: false,
  wakeUpDuration: 30,
  sleepDuration: 20,
  wakeUpEnabled: false,
  sleepEnabled: false,
  wakeUpTime: '07:00',
  sleepTime: '22:00',
};

const loadState = (): UserSettingsState => {
  if (typeof localStorage === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem('userSettings');
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return defaultState;
};

const userSettingsSlice = createSlice({
  name: 'userSettings',
  initialState: loadState(),
  reducers: {
    setManualOverride(state, action: PayloadAction<boolean>) {
      state.manualOverride = action.payload;
    },
    setWakeUpDuration(state, action: PayloadAction<number>) {
      state.wakeUpDuration = action.payload;
    },
    setSleepDuration(state, action: PayloadAction<number>) {
      state.sleepDuration = action.payload;
    },
    setWakeUpEnabled(state, action: PayloadAction<boolean>) {
      state.wakeUpEnabled = action.payload;
    },
    setSleepEnabled(state, action: PayloadAction<boolean>) {
      state.sleepEnabled = action.payload;
    },
    setWakeUpTime(state, action: PayloadAction<string>) {
      state.wakeUpTime = action.payload;
    },
    setSleepTime(state, action: PayloadAction<string>) {
      state.sleepTime = action.payload;
    },
  },
});

export const {
  setManualOverride,
  setWakeUpDuration,
  setSleepDuration,
  setWakeUpEnabled,
  setSleepEnabled,
  setWakeUpTime,
  setSleepTime,
} = userSettingsSlice.actions;

export default userSettingsSlice.reducer;
