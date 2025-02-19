import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Definir el tipo de usuario
type User = {
  uid: string;
  email: string;
  airport: string;
};

// Definir el estado inicial con `user` correctamente tipado
const initialState: { user: User | null } = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
