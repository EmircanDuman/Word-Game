import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  name: "",
};

export const userSlice = createSlice({
  name: "mevcutuser",
  initialState,
  reducers: {
    setName: (state, action) => {
      state.name = action.payload;
    },
  },
});

export const { setName } = userSlice.actions;

export default userSlice.reducer;
