// src/redux/vehiclesSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db } from "../../firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { RootState } from "./store";

export interface Vehicle {
  id: string;
  Dominio: string;
  Modelo: string;
  Ultimo_kilometraje: number;
  Nivel_combustible?: string;
  Airport?: string;
  locked?: boolean;
  lockedBy?: string | null; // Añadimos esta propiedad
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

// Thunk para obtener vehículos
export const fetchVehicles = createAsyncThunk<
  Vehicle[], // Éxito: array de vehículos
  void,      // sin argumento
  { state: RootState; rejectValue: string }
>(
  "vehicles/fetchVehicles",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.auth; // Leemos user de state.auth
      if (!user.airport || user.airport.trim() === "") {
        // Si no hay airport, retornamos array vacío en lugar de error
        console.log("fetchVehicles: No hay Airport definido en el usuario");
        return [];
      }
      const q = query(
        collection(db, "vehiculos"),
        where("Airport", "==", user.airport)
      );
      const snapshot = await getDocs(q);
      const data: Vehicle[] = [];
      snapshot.forEach((docSnap) => {
        data.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Vehicle, "id">),
        });
      });
      return data;
    } catch (error: any) {
      console.log("fetchVehicles error:", error);
      return rejectWithValue(
        error.message || "Error desconocido en fetchVehicles"
      );
    }
  }
);

// Thunk para agregar vehículo
export const addVehicle = createAsyncThunk<
  Vehicle, // Éxito
  {
    Dominio: string;
    Modelo: string;
    Ultimo_kilometraje: number;
    Nivel_combustible?: string;
  },
  { state: RootState; rejectValue: string }
>("vehicles/addVehicle", async (payload, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const user = state.auth;
    if (!user.airport || user.airport.trim() === "") {
      return rejectWithValue("No hay Airport en el usuario");
    }
    const docRef = await addDoc(collection(db, "vehiculos"), {
      Dominio: payload.Dominio,
      Modelo: payload.Modelo,
      Ultimo_kilometraje: payload.Ultimo_kilometraje,
      Nivel_combustible: payload.Nivel_combustible || "1/2",
      Airport: user.airport,
      locked: false,
    });
    return {
      id: docRef.id,
      Dominio: payload.Dominio,
      Modelo: payload.Modelo,
      Ultimo_kilometraje: payload.Ultimo_kilometraje,
      Nivel_combustible: payload.Nivel_combustible || "1/2",
      Airport: user.airport,
      locked: false,
    };
  } catch (error: any) {
    console.log("addVehicle error:", error);
    return rejectWithValue(error.message || "Error desconocido al agregar vehiculo");
  }
});

// Thunk para editar vehículo
export const editVehicle = createAsyncThunk<
  Vehicle,
  {
    id: string;
    Dominio: string;
    Modelo: string;
    Ultimo_kilometraje: number;
    Airport: string;
    Nivel_combustible?: string;
  },
  { state: RootState; rejectValue: string }
>("vehicles/editVehicle", async (payload, { rejectWithValue }) => {
  try {
    await updateDoc(doc(db, "vehiculos", payload.id), {
      Dominio: payload.Dominio,
      Modelo: payload.Modelo,
      Ultimo_kilometraje: payload.Ultimo_kilometraje,
      Airport: payload.Airport,
      Nivel_combustible: payload.Nivel_combustible || "1/2",
    });
    return {
      id: payload.id,
      Dominio: payload.Dominio,
      Modelo: payload.Modelo,
      Ultimo_kilometraje: payload.Ultimo_kilometraje,
      Airport: payload.Airport,
      Nivel_combustible: payload.Nivel_combustible || "1/2",
    };
  } catch (error: any) {
    console.log("editVehicle error:", error);
    return rejectWithValue(
      error.message || "Error desconocido al editar vehículo"
    );
  }
});

// Thunk para eliminar vehículo
export const deleteVehicle = createAsyncThunk<
  string, // Retorno: id borrado
  string, // Arg: id
  { rejectValue: string }
>("vehicles/deleteVehicle", async (vehicleId, { rejectWithValue }) => {
  try {
    await deleteDoc(doc(db, "vehiculos", vehicleId));
    return vehicleId;
  } catch (error: any) {
    console.log("deleteVehicle error:", error);
    return rejectWithValue(error.message || "Error desconocido al eliminar vehículo");
  }
});

export const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchVehicles
    builder.addCase(fetchVehicles.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchVehicles.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchVehicles.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // addVehicle
    builder.addCase(addVehicle.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addVehicle.fulfilled, (state, action) => {
      state.loading = false;
      state.list.push(action.payload);
    });
    builder.addCase(addVehicle.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // editVehicle
    builder.addCase(editVehicle.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(editVehicle.fulfilled, (state, action) => {
      state.loading = false;
      const idx = state.list.findIndex((v) => v.id === action.payload.id);
      if (idx !== -1) {
        state.list[idx] = action.payload;
      }
    });
    builder.addCase(editVehicle.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // deleteVehicle
    builder.addCase(deleteVehicle.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteVehicle.fulfilled, (state, action) => {
      state.loading = false;
      state.list = state.list.filter((v) => v.id !== action.payload);
    });
    builder.addCase(deleteVehicle.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default vehiclesSlice.reducer;
