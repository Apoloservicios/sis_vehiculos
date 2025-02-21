import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { TouchableOpacity } from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RegisterRecorrido({ navigation }) {
  const [vehicleId, setVehicleId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [kmInicial, setKmInicial] = useState("");
  const [kmFinal, setKmFinal] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const vehicles = useSelector((state: RootState) => state.vehicles.list);
  const user = useSelector((state: RootState) => state.auth.user);

  // Al cambiar de vehiculo
  const handleSelectVehicle = async (val: string) => {
    setVehicleId(val);
    if (!val) {
      setKmInicial("");
      return;
    }
    const v = vehicles.find((x) => x.id === val);
    if (!v) return;

    try {
      // Query para buscar el último recorrido
      const q = query(
        collection(db, "recorridos"),
        where("Vehiculo", "==", v.Dominio),
        orderBy("Fecha_fin", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        // Si existe un ultimo
        const lastRec = snap.docs[0].data();
        setKmInicial(String(lastRec.Kilometraje_final));
      } else {
        // Sino, usar Ultimo_kilometraje
        setKmInicial(String(v.Ultimo_kilometraje || 0));
      }
    } catch (error) {
      console.error("Error al buscar ultimo recorrido:", error);
    }
  };

  const handleSave = async () => {
    if (!vehicleId || !fechaInicio || !horaInicio || !fechaFin || !horaFin || !kmInicial || !kmFinal) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    const v = vehicles.find((x) => x.id === vehicleId);
    if (!v) {
      Alert.alert("Error", "Vehículo no encontrado en Redux");
      return;
    }
    try {
      await addDoc(collection(db, "recorridos"), {
        Vehiculo: v.Dominio,
        Airport: user?.airport || "",
        Fecha_inicio: fechaInicio,
        Hora_inicio: horaInicio,
        Kilometraje_inicial: Number(kmInicial),
        Fecha_fin: fechaFin,
        Hora_fin: horaFin,
        Kilometraje_final: Number(kmFinal),
        Observaciones: observaciones,
      });

      await updateDoc(doc(db, "vehiculos", vehicleId), {
        Ultimo_kilometraje: Number(kmFinal),
      });

      Alert.alert("Éxito", "Recorrido guardado");
      // Limpiar
      setVehicleId("");
      setFechaInicio("");
      setHoraInicio("");
      setFechaFin("");
      setHoraFin("");
      setKmInicial("");
      setKmFinal("");
      setObservaciones("");
      navigation.goBack();
    } catch (error) {
      console.error("Error al guardar recorrido:", error);
      Alert.alert("Error", "No se pudo guardar el recorrido");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Recorrido</Text>
      <Text style={styles.label}>Vehículo:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={vehicleId}
          onValueChange={handleSelectVehicle}
          style={styles.picker}
        >
          <Picker.Item label="-- Selecciona --" value="" />
          {vehicles.map((v) => (
            <Picker.Item key={v.id} label={`${v.Dominio} - ${v.Modelo}`} value={v.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Fecha Inicio:</Text>
      <TextInput
        style={styles.input}
        placeholder="2025-02-21"
        value={fechaInicio}
        onChangeText={setFechaInicio}
      />
      <Text style={styles.label}>Hora Inicio:</Text>
      <TextInput
        style={styles.input}
        placeholder="08:00"
        value={horaInicio}
        onChangeText={setHoraInicio}
      />
      <Text style={styles.label}>KM Inicial:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 15000"
        value={kmInicial}
        onChangeText={setKmInicial}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Fecha Fin:</Text>
      <TextInput
        style={styles.input}
        placeholder="2025-02-21"
        value={fechaFin}
        onChangeText={setFechaFin}
      />
      <Text style={styles.label}>Hora Fin:</Text>
      <TextInput
        style={styles.input}
        placeholder="09:30"
        value={horaFin}
        onChangeText={setHoraFin}
      />
      <Text style={styles.label}>KM Final:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 15050"
        value={kmFinal}
        onChangeText={setKmFinal}
        keyboardType="numeric"
      />
      <Text style={styles.label}>Observaciones:</Text>
      <TextInput
        style={styles.input}
        placeholder="Sin novedades"
        value={observaciones}
        onChangeText={setObservaciones}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <MaterialCommunityIcons name="content-save" size={24} color="#fff" />
        <Text style={styles.saveButtonText}> Guardar Recorrido</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  label: { marginTop: 10, fontWeight: "600" },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 10,
  },
  picker: { width: "100%" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  saveButtonText: { color: "#fff", marginLeft: 8, fontSize: 16 },
});
