import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Room {
  id: string;
  name: string;
  lights: string[];
}

interface RoomsState {
  list: Room[];
}

const initialState: RoomsState = {
  list: [],
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setRooms(state, action: PayloadAction<Room[]>) {
      state.list = action.payload;
    },
  },
});

export const { setRooms } = roomsSlice.actions;
export default roomsSlice.reducer;
