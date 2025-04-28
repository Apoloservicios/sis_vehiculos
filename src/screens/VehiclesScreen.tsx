
import { useFocusEffect } from "@react-navigation/native"; // Importar
// src/screens/VehiclesScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import {
  fetchVehicles,
  addVehicle,
  editVehicle,
  deleteVehicle,
} from "../redux/vehiclesSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function VehiclesScreen() {
  const [dominio, setDominio] = useState("");
  const [modelo, setModelo] = useState("");
  const [ultimoKilometraje, setUltimoKilometraje] = useState("0");
  
  // actualizar pantalla con el foco

 

  // Combustible al agregar
  const combustibleOptions = ["1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "1"];
  const [combustible, setCombustible] = useState("1/2");

  // Para editar en modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editDominio, setEditDominio] = useState("");
  const [editModelo, setEditModelo] = useState("");
  const [editKM, setEditKM] = useState("0");
  const [editCombustible, setEditCombustible] = useState("1/2");

  const dispatch = useDispatch<AppDispatch>();
  const { list, loading, error } = useSelector((state: RootState) => state.vehicles);
  const user = useSelector((state: RootState) => state.auth);

  useFocusEffect(
    React.useCallback(() => {
      if (user.airport) {
        dispatch(fetchVehicles());
      }
    }, [dispatch, user.airport])
  );

  useEffect(() => {
    if (user.airport) {
      dispatch(fetchVehicles());
    }
  }, [dispatch, user]);

  const handleAdd = async () => {
    if (!dominio || !modelo) {
      Alert.alert("Error", "Completa dominio y modelo antes de agregar");
      return;
    }
    const result = await dispatch(
      addVehicle({
        Dominio: dominio,
        Modelo: modelo,
        Ultimo_kilometraje: Number(ultimoKilometraje),
        Nivel_combustible: combustible,
      })
    );
    if (addVehicle.fulfilled.match(result)) {
      Alert.alert("Éxito", "Vehículo creado.");
      dispatch(fetchVehicles());
      setDominio("");
      setModelo("");
      setUltimoKilometraje("0");
      setCombustible("1/2");
    } else {
      Alert.alert("Error", result.payload as string);
    }
  };

  // Agregamos una nueva función para desbloquear vehículos
const handleUnlockVehicle = async (id: string) => {
  try {
    const vehicleRef = doc(db, "vehiculos", id);
    const vehicleSnap = await getDoc(vehicleRef);
    
    if (!vehicleSnap.exists()) {
      Alert.alert("Error", "Vehículo no encontrado");
      return;
    }
    
    const vehicleData = vehicleSnap.data();
    
    if (!vehicleData.locked) {
      Alert.alert("Información", "El vehículo ya está desbloqueado");
      return;
    }
    
    await updateDoc(vehicleRef, {
      locked: false,
      lockedBy: null
    });
    
    Alert.alert("Éxito", "Vehículo desbloqueado correctamente");
    dispatch(fetchVehicles()); // Recargar la lista
  } catch (error) {
    console.error("Error al desbloquear vehículo:", error);
    Alert.alert("Error", "No se pudo desbloquear el vehículo");
  }
};

  const handleDelete = async (id: string) => {
    Alert.alert("Confirmar", "¿Eliminar este vehículo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const delRes = await dispatch(deleteVehicle(id));
          if (deleteVehicle.fulfilled.match(delRes)) {
            Alert.alert("Eliminado", "Vehículo borrado");
            dispatch(fetchVehicles());
          } else {
            Alert.alert("Error", delRes.payload as string);
          }
        },
      },
    ]);
  };

  const openEditModal = (id: string) => {
    const vehicle = list.find((v) => v.id === id);
    if (!vehicle) return;
    setEditingVehicleId(id);
    setEditDominio(vehicle.Dominio);
    setEditModelo(vehicle.Modelo);
    setEditKM(vehicle.Ultimo_kilometraje.toString());
    setEditCombustible(vehicle.Nivel_combustible || "1/2");
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingVehicleId) return;
    const result = await dispatch(
      editVehicle({
        id: editingVehicleId,
        Dominio: editDominio,
        Modelo: editModelo,
        Ultimo_kilometraje: Number(editKM),
        Airport: user.airport || "",
        Nivel_combustible: editCombustible,
      })
    );
    if (editVehicle.fulfilled.match(result)) {
      Alert.alert("Éxito", "Vehículo editado");
      setEditModalVisible(false);
      dispatch(fetchVehicles());
    } else {
      Alert.alert("Error", result.payload as string);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Administrar Vehículos</Text>
      {loading && <Text>Cargando...</Text>}
      {error && <Text style={{ color: "red" }}>{error}</Text>}

      {user.airport ? (
        <>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Dominio"
              value={dominio}
              onChangeText={(val) => setDominio(val.toUpperCase())}
            />
            <TextInput
              style={styles.input}
              placeholder="Modelo"
              value={modelo}
              onChangeText={setModelo}
            />
            <TextInput
              style={styles.input}
              placeholder="Último Kilometraje"
              value={ultimoKilometraje}
              onChangeText={setUltimoKilometraje}
              keyboardType="numeric"
            />
            <Text style={styles.label}>Nivel de Combustible:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={combustible}
                onValueChange={(val) => setCombustible(val)}
              >
                {combustibleOptions.map((op) => (
                  <Picker.Item key={op} label={op} value={op} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Agregar Vehículo</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            style={{ marginTop: 20 }}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={styles.info}>
                  <Text style={styles.infoText}>
                    {item.Dominio} - {item.Modelo}
                  </Text>
                  <Text style={styles.infoText}>KM: {item.Ultimo_kilometraje}</Text>
                  <Text style={styles.infoText}>
                    Combustible: {item.Nivel_combustible || "1/2"}
                  </Text>
                  <Text style={[
                    styles.infoText, 
                    item.locked ? styles.lockedText : styles.unlockedText
                  ]}>
                    {item.locked 
                      ? `Bloqueado por: ${item.lockedBy || "Desconocido"}` 
                      : "Desbloqueado"
                    }
                  </Text>
                </View>
                <View style={styles.actions}>
                  {item.locked && (
                    <TouchableOpacity
                      style={{ marginRight: 10 }}
                      onPress={() => handleUnlockVehicle(item.id)}
                    >
                      <MaterialCommunityIcons name="lock-open" size={24} color="#FF9800" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={{ marginRight: 10 }}
                    onPress={() => openEditModal(item.id)}
                  >
                    <MaterialCommunityIcons name="pencil" size={24} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <MaterialCommunityIcons name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <Modal visible={editModalVisible} transparent={true} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Editar Vehículo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dominio"
                  value={editDominio}
                  onChangeText={(val) => setEditDominio(val.toUpperCase())}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Modelo"
                  value={editModelo}
                  onChangeText={setEditModelo}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Último Kilometraje"
                  value={editKM}
                  onChangeText={setEditKM}
                  keyboardType="numeric"
                />
                <Text style={styles.label}>Nivel de Combustible:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editCombustible}
                    onValueChange={(val) => setEditCombustible(val)}
                  >
                    {combustibleOptions.map((op) => (
                      <Picker.Item key={op} label={op} value={op} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <Text>No tienes un aeropuerto definido</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  form: { backgroundColor: "#f4f4f4", padding: 10, borderRadius: 6 },
  label: { fontWeight: "600", marginTop: 8 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 12, padding: 8, borderRadius: 4 },
  addButton: { flexDirection: "row", backgroundColor: "#007AFF", borderRadius: 6, padding: 10, alignItems: "center", marginBottom: 10 },
  addButtonText: { color: "#fff", marginLeft: 8 },
 

  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: "#fff", padding: 20, borderRadius: 8, width: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  saveButton: { backgroundColor: "#007AFF", padding: 10, borderRadius: 6, minWidth: 80, alignItems: "center" },
  saveButtonText: { color: "#fff" },
  cancelButton: { backgroundColor: "#ccc", padding: 10, borderRadius: 6, minWidth: 80, alignItems: "center" },
  cancelButtonText: { color: "#333" },

   item: { 
    backgroundColor: "#fff", 
    padding: 15, 
    marginBottom: 8, 
    borderRadius: 6, 
    flexDirection: "row", 
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  infoText: { 
    fontSize: 16,
    marginBottom: 4,
  },
  lockedText: {
    color: "red",
    fontWeight: "bold"
  },
  unlockedText: {
    color: "green",
    fontWeight: "bold"
  },
  actions: { 
    flexDirection: "row", 
    alignItems: "center",
    justifyContent: "flex-end",
    marginLeft: 10,
  },
  actionButton: {
    width: 40,
    height: 40, 
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },



});
