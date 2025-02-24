// src/redux/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  uid: string | null;
  email: string | null;
  airport: string | null;
  role: string | null;
}

const initialState: AuthState = {
  uid: null,
  email: null,
  airport: null,
  role: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState>) => {
      state.uid = action.payload.uid;
      state.email = action.payload.email;
      state.airport = action.payload.airport;
      state.role = action.payload.role;
    },
    logout: (state) => {
      state.uid = null;
      state.email = null;
      state.airport = null;
      state.role = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
