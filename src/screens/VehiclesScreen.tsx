import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, ActivityIndicator, FAB, Modal, Portal, TextInput, Dialog, IconButton, Button } from "react-native-paper";
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

// Definir el tipo de datos de los vehículos
type Vehicle = {
  id?: string;
  dominio: string;
  modelo: string;
  ultimo_kilometraje: number;
  aeropuerto: string;
};

const VehiclesScreen = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  // Referencias para los valores del formulario
  const dominioRef = useRef("");
  const modeloRef = useRef("");
  const kilometrajeRef = useRef("");
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  const userAirport = useSelector((state: RootState) => state.auth.user?.airport);

  // Función para obtener los vehículos desde Firestore
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "vehiculos"), where("aeropuerto", "==", userAirport));
      const querySnapshot = await getDocs(q);
      const vehiclesList: Vehicle[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Vehicle),
      }));
      setVehicles(vehiclesList);
    } catch (error) {
      console.error("Error al obtener vehículos:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, [userAirport]);

  // Función para cerrar el modal y limpiar los datos
  const closeModal = () => {
    dominioRef.current = "";
    modeloRef.current = "";
    kilometrajeRef.current = "";
    setEditingVehicleId(null);
    setModalVisible(false);
  };

  // Función para agregar o editar un vehículo
  const handleSaveVehicle = async () => {
    if (!dominioRef.current || !modeloRef.current || !kilometrajeRef.current) {
      return;
    }

    try {
      if (editingVehicleId) {
        // Editar vehículo existente
        await updateDoc(doc(db, "vehiculos", editingVehicleId), {
          dominio: dominioRef.current.toUpperCase(),
          modelo: modeloRef.current,
          ultimo_kilometraje: Number(kilometrajeRef.current),
          aeropuerto: userAirport,
        });
      } else {
        // Agregar un nuevo vehículo
        await addDoc(collection(db, "vehiculos"), {
          dominio: dominioRef.current.toUpperCase(),
          modelo: modeloRef.current,
          ultimo_kilometraje: Number(kilometrajeRef.current),
          aeropuerto: userAirport,
        });
      }

      closeModal();
      fetchVehicles(); // 🔥 Actualizar la lista después de guardar
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
    }
  };

  // Función para abrir el modal de edición
  const handleEditVehicle = (vehicle: Vehicle) => {
    dominioRef.current = vehicle.dominio;
    modeloRef.current = vehicle.modelo;
    kilometrajeRef.current = vehicle.ultimo_kilometraje.toString();
    setEditingVehicleId(vehicle.id!);
    setModalVisible(true);
  };

  // Función para eliminar un vehículo con confirmación
  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    try {
      await deleteDoc(doc(db, "vehiculos", vehicleToDelete));
      fetchVehicles(); // 🔥 Refrescar lista después de eliminar
      setConfirmVisible(false);
      setVehicleToDelete(null);
    } catch (error) {
      console.error("Error al eliminar vehículo:", error);
    }
  };

  if (loading) {
    return <ActivityIndicator animating={true} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehículos Disponibles</Text>
      {vehicles.map((item) => (
        <Card key={item.id} style={styles.card}>
          <Card.Title title={`${item.modelo} (${item.dominio})`} subtitle={`Kilometraje: ${item.ultimo_kilometraje}`} />
          <Card.Content>
            <Text>Aeropuerto: {item.aeropuerto}</Text>
          </Card.Content>
          <Card.Actions>
            <IconButton icon="pencil" size={24} onPress={() => handleEditVehicle(item)} />
            <IconButton icon="delete" size={24} iconColor="red" onPress={() => { 
              setVehicleToDelete(item.id!);
              setConfirmVisible(true);
            }} />
          </Card.Actions>
        </Card>
      ))}

      {/* Botón para agregar vehículo */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          closeModal(); // 🔥 Limpiar los campos antes de abrir el modal
          setModalVisible(true);
        }}
      />

      {/* Modal para agregar o editar un vehículo */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>{editingVehicleId ? "Editar Vehículo" : "Agregar Nuevo Vehículo"}</Text>

          <TextInput label="Dominio" mode="outlined" defaultValue={dominioRef.current} onChangeText={(text) => (dominioRef.current = text.toUpperCase())} style={styles.input} />

          <TextInput label="Modelo" mode="outlined" defaultValue={modeloRef.current} onChangeText={(text) => (modeloRef.current = text)} style={styles.input} />

          <TextInput label="Kilometraje" mode="outlined" keyboardType="numeric" defaultValue={kilometrajeRef.current} onChangeText={(text) => (kilometrajeRef.current = text)} style={styles.input} />

          <Button mode="contained" onPress={handleSaveVehicle} style={styles.button}>
            {editingVehicleId ? "Guardar Cambios" : "Agregar"}
          </Button>
        </Modal>
      </Portal>

      {/* Confirmación de eliminación */}
      <Portal>
        <Dialog visible={confirmVisible} onDismiss={() => setConfirmVisible(false)}>
          <Dialog.Title>Confirmar Eliminación</Dialog.Title>
          <Dialog.Content>
            <Text>¿Estás seguro de que deseas eliminar este vehículo?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmVisible(false)}>Cancelar</Button>
            <Button onPress={handleDeleteVehicle} color="red">
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: "#f4f4f4",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
    },
    card: {
      marginBottom: 10,
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 20,
      backgroundColor: "#007AFF",
    },
    modal: {
      backgroundColor: "white",
      padding: 20,
      margin: 20,
      borderRadius: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
    },
    input: {
      marginBottom: 10,
    },
    button: {
      marginTop: 10,
    },
  });
  

export default VehiclesScreen;
