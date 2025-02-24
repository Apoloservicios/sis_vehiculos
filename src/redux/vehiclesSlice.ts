// src/redux/vehiclesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
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

// Definimos la interfaz del vehículo
export interface Vehicle {
  id: string;
  Dominio: string;
  Modelo: string;
  Ultimo_kilometraje: number;
  Airport?: string; // si lo usas en la DB
}

// Interfaz del estado
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

// 1) Thunk para obtener vehículos
export const fetchVehicles = createAsyncThunk<
  Vehicle[], // retorno exitoso
  void,      // argumento que recibe la acción
  { state: RootState; rejectValue: string }
>(
  "vehicles/fetchVehicles",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.auth; // Leemos user de state.auth
      if (!user.airport) {
        console.log("fetchVehicles: No airport en el usuario");
        return rejectWithValue("No hay Airport en el usuario");
      }

      // Hacemos query a 'vehiculos' donde 'Airport' == user.airport
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
      return rejectWithValue(error.message || "Error desconocido en fetchVehicles");
    }
  }
);

// 2) Thunk para agregar vehículo
export const addVehicle = createAsyncThunk<
  Vehicle, // retorno exitoso
  { Dominio: string; Modelo: string; Ultimo_kilometraje: number }, // argumento
  { state: RootState; rejectValue: string }
>(
  "vehicles/addVehicle",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.auth;
      if (!user.airport) {
        console.log("addVehicle: No airport en el usuario");
        return rejectWithValue("No hay Airport en el usuario");
      }

      // Creamos el doc en 'vehiculos'
      const docRef = await addDoc(collection(db, "vehiculos"), {
        Dominio: payload.Dominio,
        Modelo: payload.Modelo,
        Ultimo_kilometraje: payload.Ultimo_kilometraje,
        Airport: user.airport,
      });
      // Retornamos un objeto Vehicle
      return {
        id: docRef.id,
        Dominio: payload.Dominio,
        Modelo: payload.Modelo,
        Ultimo_kilometraje: payload.Ultimo_kilometraje,
        Airport: user.airport,
      };
    } catch (error: any) {
      console.log("addVehicle error:", error);
      return rejectWithValue(error.message || "Error desconocido al agregar vehículo");
    }
  }
);

// 3) Thunk para editar vehículo
export const editVehicle = createAsyncThunk<
  Vehicle,
  {
    id: string;
    Dominio: string;
    Modelo: string;
    Ultimo_kilometraje: number;
    Airport: string;
  },
  { state: RootState; rejectValue: string }
>(
  "vehicles/editVehicle",
  async (payload, { rejectWithValue }) => {
    try {
      // Actualizamos en Firestore
      await updateDoc(doc(db, "vehiculos", payload.id), {
        Dominio: payload.Dominio,
        Modelo: payload.Modelo,
        Ultimo_kilometraje: payload.Ultimo_kilometraje,
        Airport: payload.Airport,
      });
      // Retornamos el objeto Vehicle
      return {
        id: payload.id,
        Dominio: payload.Dominio,
        Modelo: payload.Modelo,
        Ultimo_kilometraje: payload.Ultimo_kilometraje,
        Airport: payload.Airport,
      };
    } catch (error: any) {
      console.log("editVehicle error:", error);
      return rejectWithValue(error.message || "Error desconocido al editar vehículo");
    }
  }
);

// 4) Thunk para eliminar vehículo
export const deleteVehicle = createAsyncThunk<
  string,
  string, // el id del vehículo
  { rejectValue: string }
>(
  "vehicles/deleteVehicle",
  async (vehicleId, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, "vehiculos", vehicleId));
      return vehicleId;
    } catch (error: any) {
      console.log("deleteVehicle error:", error);
      return rejectWithValue(error.message || "Error desconocido al eliminar vehículo");
    }
  }
);

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
      state.list = action.payload; // array de Vehicle
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
      // Insertamos el vehículo retornado
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
      // Reemplazamos en el array
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
      // Eliminamos del array
      state.list = state.list.filter((v) => v.id !== action.payload);
    });
    builder.addCase(deleteVehicle.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default vehiclesSlice.reducer;
