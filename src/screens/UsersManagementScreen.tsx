// src/screens/UsersManagementScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Picker } from "@react-native-picker/picker";

type User = {
  id: string;
  email: string;
  airport: string;
  role: string;
  verified?: boolean;
  createdAt?: string;
};

export default function UsersManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  const currentUser = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!currentUser.airport) {
      Alert.alert("Error", "No tienes un aeropuerto definido");
      setLoading(false);
      return;
    }
  
    setLoading(true);
    try {
      console.log("Buscando usuarios para aeropuerto:", currentUser.airport);
      
      // Utilizamos un query con where para filtrar directamente por aeropuerto
      const q = query(
        collection(db, "usuarios"),
        where("airport", "==", currentUser.airport)
      );
      
      const snapshot = await getDocs(q);
      
      console.log("Documentos encontrados:", snapshot.size);
      
      if (snapshot.empty) {
        console.log("No se encontraron usuarios para este aeropuerto");
        setUsers([]);
        setLoading(false);
        return;
      }
      
      const usersList: User[] = [];
      snapshot.forEach(doc => {
        const userData = doc.data();
        console.log("Usuario encontrado:", userData.email, "Role:", userData.role);
        
        usersList.push({
          id: doc.id,
          email: userData.email || "",
          airport: userData.airport || "",
          role: userData.role || "user",
          verified: userData.verified || false,
          createdAt: userData.createdAt || "",
        });
      });
      
      console.log("Total de usuarios filtrados:", usersList.length);
      setUsers(usersList);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      console.error("Detalles del error:", JSON.stringify(error));
      Alert.alert("Error", "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };
  

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
    setEditModalVisible(true);
  };

  const saveUserChanges = async () => {
    if (!editingUser) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, "usuarios", editingUser.id), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
      
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...user, role: newRole } : user
      ));
      
      setEditModalVisible(false);
      Alert.alert("Éxito", "Rol de usuario actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      Alert.alert("Error", "No se pudo actualizar el rol del usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    // No permitir eliminar al propio usuario
    if (user.id === currentUser.uid) {
      Alert.alert("Error", "No puedes eliminar tu propio usuario");
      return;
    }
    
    Alert.alert(
      "Eliminar usuario",
      `¿Estás seguro de que deseas eliminar a ${user.email}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDoc(doc(db, "usuarios", user.id));
              setUsers(users.filter(u => u.id !== user.id));
              Alert.alert("Éxito", "Usuario eliminado correctamente");
            } catch (error) {
              console.error("Error al eliminar usuario:", error);
              Alert.alert("Error", "No se pudo eliminar el usuario");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.roleChip, 
            item.role === "admin" ? styles.adminChip : styles.userChip]}>
            <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
          </View>
          {item.verified && (
            <View style={styles.verifiedChip}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#fff" />
              <Text style={styles.verifiedText}>Verificado</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditUser(item)}
        >
          <MaterialCommunityIcons name="account-edit" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item)}
          disabled={item.id === currentUser.uid}
        >
          <MaterialCommunityIcons 
            name="account-remove" 
            size={20} 
            color={item.id === currentUser.uid ? "#cccccc" : "#fff"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Usuarios</Text>
      <Text style={styles.subtitle}>Aeropuerto: {currentUser.airport}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No hay usuarios registrados para este aeropuerto.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de edición de usuario */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Usuario</Text>
            <Text style={styles.modalSubtitle}>{editingUser?.email}</Text>

            <Text style={styles.modalLabel}>Rol:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newRole}
                onValueChange={(value) => setNewRole(value)}
              >
                <Picker.Item label="Usuario" value="user" />
                <Picker.Item label="Administrador" value="admin" />
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveUserChanges}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userCard: {
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
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 8,
  },
  adminChip: {
    backgroundColor: "#007AFF",
  },
  userChip: {
    backgroundColor: "#34C6DA",
  },
  roleText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  verifiedChip: {
    backgroundColor: "#7ED957",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 2,
  },
  actionsContainer: {
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
  emptyContainer: {
    padding: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  modalLabel: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 0.48,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});