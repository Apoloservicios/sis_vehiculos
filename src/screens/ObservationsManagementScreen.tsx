// src/screens/ObservationsManagementScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { db } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export default function ObservationsManagementScreen() {
  const [observations, setObservations] = useState<Array<{ id: string; text: string }>>([]);
  const [newObservation, setNewObservation] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const user = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchObservations();
  }, []);

  const fetchObservations = async () => {
    if (!user.airport) {
      Alert.alert("Error", "No hay aeropuerto definido");
      return;
    }
    
    setLoading(true);
    try {
      const q = query(
        collection(db, "observaciones"),
        where("airport", "==", user.airport)
      );
      
      const snapshot = await getDocs(q);
      
      const data: Array<{ id: string; text: string }> = [];
      snapshot.forEach(doc => {
        data.push({
          id: doc.id,
          text: doc.data().text,
        });
      });
      
      setObservations(data);
    } catch (error) {
      console.error("Error al obtener observaciones:", error);
      Alert.alert("Error", "No se pudieron cargar las observaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleAddObservation = async () => {
    if (!newObservation.trim()) {
      Alert.alert("Error", "La observación no puede estar vacía");
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "observaciones"), {
        text: newObservation.trim(),
        airport: user.airport,
        createdAt: new Date().toISOString(),
      });

      setObservations([...observations, { id: docRef.id, text: newObservation.trim() }]);
      setNewObservation("");
      Alert.alert("Éxito", "Observación agregada correctamente");
    } catch (error) {
      console.error("Error al agregar observación:", error);
      Alert.alert("Error", "No se pudo agregar la observación");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateObservation = async () => {
    if (!editText.trim() || !editing) {
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "observaciones", editing), {
        text: editText.trim(),
        updatedAt: new Date().toISOString(),
      });

      setObservations(
        observations.map(obs => 
          obs.id === editing ? { ...obs, text: editText.trim() } : obs
        )
      );
      
      setEditing(null);
      setEditText("");
      Alert.alert("Éxito", "Observación actualizada correctamente");
    } catch (error) {
      console.error("Error al actualizar observación:", error);
      Alert.alert("Error", "No se pudo actualizar la observación");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObservation = (id: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar esta observación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDoc(doc(db, "observaciones", id));
              setObservations(observations.filter(obs => obs.id !== id));
              Alert.alert("Éxito", "Observación eliminada correctamente");
            } catch (error) {
              console.error("Error al eliminar observación:", error);
              Alert.alert("Error", "No se pudo eliminar la observación");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const startEditing = (id: string, text: string) => {
    setEditing(id);
    setEditText(text);
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditText("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Observaciones</Text>
      <Text style={styles.subtitle}>Aeropuerto: {user.airport}</Text>

      <View style={styles.addContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nueva observación"
          value={newObservation}
          onChangeText={setNewObservation}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddObservation}
          disabled={loading}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />}

      <FlatList
        data={observations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.observationItem}>
            {editing === item.id ? (
              <>
                <TextInput
                  style={styles.editInput}
                  value={editText}
                  onChangeText={setEditText}
                  autoFocus
                />
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleUpdateObservation}
                  >
                    <MaterialCommunityIcons name="content-save" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={cancelEditing}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.observationText}>{item.text}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => startEditing(item.id, item.text)}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteObservation(item.id)}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No hay observaciones configuradas para este aeropuerto.
            </Text>
            <Text style={styles.emptySubtext}>
              Agrega algunas observaciones para que aparezcan en el registro de recorridos.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F4F6F9",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
  },
  addContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginRight: 10,
    backgroundColor: "white",
  },
  addButton: {
    backgroundColor: "#007AFF",
    borderRadius: 6,
    width: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    marginVertical: 20,
  },
  observationItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  observationText: {
    flex: 1,
    fontSize: 16,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginRight: 10,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: "#34C6DA",
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
  saveButton: {
    backgroundColor: "#7ED957",
  },
  cancelButton: {
    backgroundColor: "#ff9500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
  },
});