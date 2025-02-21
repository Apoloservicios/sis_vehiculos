// src/redux/vehiclesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { db } from "../../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { RootState } from "./store";

export interface Vehicle {
  id: string;
  Dominio: string;
  Modelo: string;
  Ultimo_kilometraje: number;
  Airport: string;
}

interface VehiclesState {
  list: Vehicle[];
  loading: boolean;
  error: string | null;
}

const initialState: VehiclesState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchVehicles = createAsyncThunk("vehicles/fetchVehicles", async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState;
    const airport = state.auth.user?.airport;
    if (!airport) return [];
    const q = query(collection(db, "vehiculos"), where("Airport", "==", airport));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Vehicle[];
  } catch (error) {
    return rejectWithValue("Error al obtener vehículos");
  }
});

// addVehicle, editVehicle, deleteVehicle ... (sin cambios)

const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchVehicles.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchVehicles.fulfilled, (state, action: PayloadAction<Vehicle[]>) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchVehicles.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default vehiclesSlice.reducer;
