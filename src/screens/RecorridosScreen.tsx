// src/screens/RecorridosScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { db } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Picker } from "@react-native-picker/picker";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";

type Props = DrawerScreenProps<DrawerParamList, "Recorridos">;

export default function RecorridosScreen({ navigation }: Props) {
  const [recorridos, setRecorridos] = useState<any[]>([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState("all");

  const user = useSelector((state: RootState) => state.auth);
  const vehicles = useSelector((state: RootState) => state.vehicles.list);

  useEffect(() => {
    fetchRecorridos();
  }, [selectedVehiculo]);

  const fetchRecorridos = async () => {
    if (!user.airport) {
      Alert.alert("Error", "No tienes aeropuerto definido");
      return;
    }
    try {
      // 1) Base query: solo recorridos de este aeropuerto
      let qBase = query(
        collection(db, "recorridos"),
        where("Airport", "==", user.airport)
      );

      // 2) Si seleccionamos un vehículo en particular, filtramos por Vehiculo
      if (selectedVehiculo !== "all") {
        qBase = query(qBase, where("Vehiculo", "==", selectedVehiculo));
      }

      // 3) Ordenamos por KM final descendente (Kilometraje_final)
      //    Y limitamos a 10 registros
      const qFinal = query(qBase, orderBy("Kilometraje_final", "desc"), limit(10));

      // 4) Obtenemos documentos
      const snap = await getDocs(qFinal);
      const data = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setRecorridos(data);
    } catch (error) {
      console.error("Error al obtener recorridos:", error);
    }
  };

  // Navegar a la pantalla de Registrar Recorrido
  const handlePressAdd = () => {
    navigation.navigate("Registrar Recorrido");
  };

  // Eliminar un recorrido (solo admin)
  const handleDelete = async (recorridoId: string) => {
    Alert.alert("Confirmar", "¿Eliminar este recorrido?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "recorridos", recorridoId));
            // Quitamos de la lista local para no re-fetch
            setRecorridos((prev) => prev.filter((r) => r.id !== recorridoId));
            Alert.alert("Éxito", "Recorrido eliminado");
          } catch (error) {
            console.log("Error al eliminar recorrido:", error);
            Alert.alert("Error", "No se pudo eliminar el recorrido");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Últimos Recorridos</Text>
      <Text>Filtrar por Vehículo:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedVehiculo}
          onValueChange={(val) => setSelectedVehiculo(val)}
          style={styles.picker}
        >
          <Picker.Item label="Todos" value="all" />
          {vehicles.map((v) => (
            <Picker.Item
              key={v.id}
              label={`${v.Dominio} - ${v.Modelo}`}
              value={v.Dominio}
            />
          ))}
        </Picker>
      </View>

      <FlatList
        data={recorridos}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 20 }}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: index % 2 === 0 ? "#34C6DA" : "#7ED957" },
            ]}
          >
            <Text style={styles.cardTitle}>VEHÍCULO {item.Vehiculo}</Text>
            <Text style={styles.cardSubtitle}>
              INICIO {item.Fecha_inicio} {item.Hora_inicio}
            </Text>
            <Text style={styles.cardSubtitle}>
              FIN {item.Fecha_fin} {item.Hora_fin}
            </Text>
            <Text style={styles.cardSubtitle}>
              KM {item.Kilometraje_inicial} - {item.Kilometraje_final}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.Observaciones || "SIN NOVEDAD"}
            </Text>

            {/* Si el user es admin, mostramos el icono de borrar */}
            {user.role === "admin" && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <MaterialCommunityIcons
                  name="delete"
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Botón para agregar recorrido */}
      <TouchableOpacity style={styles.fab} onPress={handlePressAdd}>
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F4F4F4" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 10,
  },
  picker: { width: "100%" },
  card: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    position: "relative",
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  cardSubtitle: { fontSize: 14, color: "#fff" },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "green",
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
});
