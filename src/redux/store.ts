import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";  // ✅ Importa el reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,  // ✅ Agrega el reducer aquí
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
