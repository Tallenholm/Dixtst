import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import type { ReactNode } from 'react';

import roomsReducer from './roomsSlice';
import scenesReducer from './scenesSlice';
import userSettingsReducer from './userSettingsSlice';

const store = configureStore({
  reducer: {
    rooms: roomsReducer,
    scenes: scenesReducer,
    userSettings: userSettingsReducer,
  },
});

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    const state = store.getState();
    localStorage.setItem('userSettings', JSON.stringify(state.userSettings));
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export function StateProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

export default store;
