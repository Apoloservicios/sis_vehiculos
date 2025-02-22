// src/redux/vehiclesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";
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

// Thunk para cargar vehículos
export const fetchVehicles = createAsyncThunk(
  "vehicles/fetchVehicles",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const airport = state.auth.user?.airport;
      if (!airport) {
        console.log("fetchVehicles: No airport en el usuario");
        return [];
      }
      console.log("fetchVehicles: Buscando vehiculos de airport=", airport);

      const q = query(collection(db, "vehiculos"), where("Airport", "==", airport));
      const snap = await getDocs(q);
      const vehiclesList = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Vehicle[];

      console.log("fetchVehicles: vehiculos obtenidos =", vehiclesList);
      return vehiclesList;
    } catch (error: any) {
      console.error("fetchVehicles: error =", error);
      return rejectWithValue("Error al obtener vehículos");
    }
  }
);

// Thunk para agregar vehículo (con logs)
export const addVehicle = createAsyncThunk(
  "vehicles/addVehicle",
  async (
    { Dominio, Modelo, Ultimo_kilometraje }: Omit<Vehicle, "id" | "Airport">,
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const airport = state.auth.user?.airport;
      if (!airport) throw new Error("No hay Airport en el usuario");

      console.log("addVehicle: Creando vehiculo con:", {
        Dominio,
        Modelo,
        Ultimo_kilometraje,
        Airport: airport,
      });

      const docRef = await addDoc(collection(db, "vehiculos"), {
        Dominio,
        Modelo,
        Ultimo_kilometraje,
        Airport: airport,
      });
      console.log("addVehicle: Vehiculo creado con ID=", docRef.id);

      return true;
    } catch (error: any) {
      console.error("addVehicle: error al agregar vehículo:", error);
      return rejectWithValue(error.message || "Error al agregar vehículo");
    }
  }
);

// Thunk para editar vehículo (con logs)
export const editVehicle = createAsyncThunk(
  "vehicles/editVehicle",
  async ({ id, Dominio, Modelo, Ultimo_kilometraje, Airport }: Vehicle, { rejectWithValue }) => {
    try {
      console.log("editVehicle: Editando vehiculo ID=", id, {
        Dominio,
        Modelo,
        Ultimo_kilometraje,
        Airport,
      });
      await updateDoc(doc(db, "vehiculos", id), {
        Dominio,
        Modelo,
        Ultimo_kilometraje,
        Airport,
      });
      console.log("editVehicle: Edición completada");
      return true;
    } catch (error: any) {
      console.error("editVehicle: error al editar vehículo:", error);
      return rejectWithValue(error.message || "Error al editar vehículo");
    }
  }
);

// Thunk para eliminar vehículo
export const deleteVehicle = createAsyncThunk(
  "vehicles/deleteVehicle",
  async (id: string, { rejectWithValue }) => {
    try {
      console.log("deleteVehicle: Eliminando vehiculo ID=", id);
      await deleteDoc(doc(db, "vehiculos", id));
      console.log("deleteVehicle: Eliminado OK");
      return true;
    } catch (error: any) {
      console.error("deleteVehicle: error al eliminar vehículo:", error);
      return rejectWithValue(error.message || "Error al eliminar vehículo");
    }
  }
);

const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchVehicles
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

    // addVehicle
    builder.addCase(addVehicle.fulfilled, (state) => {});
    // editVehicle
    builder.addCase(editVehicle.fulfilled, (state) => {});
    // deleteVehicle
    builder.addCase(deleteVehicle.fulfilled, (state) => {});
  },
});

export default vehiclesSlice.reducer;
