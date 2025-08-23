import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Scene {
  id: string;
  name: string;
}

interface ScenesState {
  list: Scene[];
  current?: string;
}

const initialState: ScenesState = {
  list: [],
  current: undefined,
};

const scenesSlice = createSlice({
  name: 'scenes',
  initialState,
  reducers: {
    setScenes(state, action: PayloadAction<Scene[]>) {
      state.list = action.payload;
    },
    setCurrentScene(state, action: PayloadAction<string | undefined>) {
      state.current = action.payload;
    },
  },
});

export const { setScenes, setCurrentScene } = scenesSlice.actions;
export default scenesSlice.reducer;
