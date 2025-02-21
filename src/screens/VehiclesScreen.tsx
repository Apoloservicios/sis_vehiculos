import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Alert, TouchableOpacity, Modal } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import { fetchVehicles, addVehicle, editVehicle, deleteVehicle } from "../redux/vehiclesSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function VehiclesScreen() {
  const [dominio, setDominio] = useState("");
  const [modelo, setModelo] = useState("");
  const [ultimoKilometraje, setUltimoKilometraje] = useState("0");

  // Para editar
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editDominio, setEditDominio] = useState("");
  const [editModelo, setEditModelo] = useState("");
  const [editKM, setEditKM] = useState("0");

  const dispatch = useDispatch<AppDispatch>();
  const { list, loading, error } = useSelector((state: RootState) => state.vehicles);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user?.airport) {
      dispatch(fetchVehicles());
    }
  }, [dispatch, user]);

  const handleAdd = async () => {
    if (!dominio || !modelo) {
      Alert.alert("Error", "Completa dominio y modelo antes de agregar");
      return;
    }
    await dispatch(addVehicle({
      dominio,
      modelo,
      ultimo_kilometraje: Number(ultimoKilometraje),
    }));
    dispatch(fetchVehicles());
    // Limpiar inputs
    setDominio("");
    setModelo("");
    setUltimoKilometraje("0");
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Confirmar",
      "¿Eliminar este vehículo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await dispatch(deleteVehicle(id));
            dispatch(fetchVehicles());
          },
        },
      ]
    );
  };

  const openEditModal = (vehId: string) => {
    const vehicle = list.find((v) => v.id === vehId);
    if (vehicle) {
      setEditingVehicleId(vehicle.id);
      setEditDominio(vehicle.dominio);
      setEditModelo(vehicle.modelo);
      setEditKM(vehicle.ultimo_kilometraje.toString());
      setEditModalVisible(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingVehicleId) return;
    await dispatch(editVehicle({
      id: editingVehicleId,
      dominio: editDominio,
      modelo: editModelo,
      ultimo_kilometraje: Number(editKM),
      aeropuerto: user?.airport || "",
    }));
    setEditModalVisible(false);
    dispatch(fetchVehicles());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Administrar Vehículos</Text>
      {loading && <Text>Cargando...</Text>}
      {error && <Text style={{ color: "red" }}>{error}</Text>}

      {user?.airport ? (
        <>
          <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Dominio (ABC123)"
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
                  <Text style={styles.infoText}>{item.dominio} - {item.modelo}</Text>
                  <Text style={styles.infoText}>KM: {item.ultimo_kilometraje}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={{ marginRight: 10 }} onPress={() => openEditModal(item.id)}>
                    <MaterialCommunityIcons name="pencil" size={24} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <MaterialCommunityIcons name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {/* MODAL PARA EDITAR VEHÍCULO */}
          <Modal visible={editModalVisible} transparent={true} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Editar Vehículo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dominio"
                  value={editDominio}
                  onChangeText={ (val) => setEditDominio(val.toUpperCase())}
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
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
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
  form: {
    backgroundColor: "#f4f4f4",
    padding: 10,
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    padding: 8,
    borderRadius: 4,
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  addButtonText: { color: "#fff", marginLeft: 8 },
  item: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  info: {},
  infoText: { fontSize: 16 },
  actions: { flexDirection: "row", alignItems: "center" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 6,
  },
  saveButtonText: { color: "#fff" },
  cancelButton: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 6,
  },
  cancelButtonText: { color: "#333" },
});
