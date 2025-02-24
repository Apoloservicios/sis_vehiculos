// src/screens/RegisterRecorrido.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { db } from "../../firebaseConfig";
import { collection, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import { Picker } from "@react-native-picker/picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function RegisterRecorrido({ navigation }) {
  const [vehicleId, setVehicleId] = useState("");

  // Estados para pickers de INICIO
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showTimePickerInicio, setShowTimePickerInicio] = useState(false);

  // Estados para pickers de FIN
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);
  const [showTimePickerFin, setShowTimePickerFin] = useState(false);

  // Fecha y hora en texto
  const [fechaInicio, setFechaInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horaFin, setHoraFin] = useState("");

  // KM y Observaciones
  const [kmInicial, setKmInicial] = useState("");
  const [kmFinal, setKmFinal] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Datos del store
  const vehicles = useSelector((state: RootState) => state.vehicles.list);
  // Cambiar a state.auth (no state.auth.user)
  const user = useSelector((state: RootState) => state.auth);

  const handleSelectVehicle = async (val: string) => {
    setVehicleId(val);
    if (!val) {
      setKmInicial("");
      return;
    }
    try {
      const docRef = doc(db, "vehiculos", val);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setKmInicial(String(data.Ultimo_kilometraje || 0));
      } else {
        console.log("No se encontró el documento de vehículo en Firestore");
        setKmInicial("");
      }
    } catch (error) {
      console.log("Error al obtener datos de Firestore:", error);
      setKmInicial("");
    }
  };

  // Funciones para pickers de fecha/hora (se mantienen igual)
  const openDatePickerInicio = () => { setShowDatePickerInicio(true); };
  const openTimePickerInicio = () => { setShowTimePickerInicio(true); };

  const onChangeDateInicio = (event: any, selectedDate: Date | undefined) => {
    setShowDatePickerInicio(false);
    if (selectedDate) {
      const dia = String(selectedDate.getDate()).padStart(2, "0");
      const mes = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();
      setFechaInicio(`${year}-${mes}-${dia}`);
    }
  };

  const onChangeTimeInicio = (event: any, selectedTime: Date | undefined) => {
    setShowTimePickerInicio(false);
    if (selectedTime) {
      const hh = String(selectedTime.getHours()).padStart(2, "0");
      const mm = String(selectedTime.getMinutes()).padStart(2, "0");
      setHoraInicio(`${hh}:${mm}`);
    }
  };

  const clearInicio = () => { setFechaInicio(""); setHoraInicio(""); };
  const setNowInicio = () => { const now = new Date(); onChangeDateInicio(null, now); onChangeTimeInicio(null, now); };

  const openDatePickerFin = () => { setShowDatePickerFin(true); };
  const openTimePickerFin = () => { setShowTimePickerFin(true); };

  const onChangeDateFin = (event: any, selectedDate: Date | undefined) => {
    setShowDatePickerFin(false);
    if (selectedDate) {
      const dia = String(selectedDate.getDate()).padStart(2, "0");
      const mes = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();
      setFechaFin(`${year}-${mes}-${dia}`);
    }
  };

  const onChangeTimeFin = (event: any, selectedTime: Date | undefined) => {
    setShowTimePickerFin(false);
    if (selectedTime) {
      const hh = String(selectedTime.getHours()).padStart(2, "0");
      const mm = String(selectedTime.getMinutes()).padStart(2, "0");
      setHoraFin(`${hh}:${mm}`);
    }
  };

  const clearFin = () => { setFechaFin(""); setHoraFin(""); };
  const setNowFin = () => { const now = new Date(); onChangeDateFin(null, now); onChangeTimeFin(null, now); };

  const handleSave = async () => {
    if (!vehicleId || !fechaInicio || !horaInicio || !fechaFin || !horaFin || !kmInicial || !kmFinal) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    if (Number(kmFinal) <= Number(kmInicial)) {
      Alert.alert("Error", "El KM final debe ser mayor que el KM inicial");
      return;
    }
    const v = vehicles.find((x) => x.id === vehicleId);
    if (!v) {
      Alert.alert("Error", "Vehículo no encontrado");
      return;
    }
    try {
      await addDoc(collection(db, "recorridos"), {
        Vehiculo: v.Dominio,
        Airport: user.airport || "",
        // Agregamos el campo Usuario
        Usuario: user.email || "Desconocido",
        Fecha_inicio: fechaInicio,
        Hora_inicio: horaInicio,
        Kilometraje_inicial: Number(kmInicial),
        Fecha_fin: fechaFin,
        Hora_fin: horaFin,
        Kilometraje_final: Number(kmFinal),
        Observaciones: observaciones,
      });

      await updateDoc(doc(db, "vehiculos", v.id), {
        Ultimo_kilometraje: Number(kmFinal),
      });

      Alert.alert("Éxito", "Recorrido guardado y KM de vehículo actualizado");

      setKmInicial(kmFinal);
      setFechaInicio("");
      setHoraInicio("");
      setFechaFin("");
      setHoraFin("");
      setKmFinal("");
      setObservaciones("");
    } catch (error) {
      console.error("Error al guardar Recorrido:", error);
      Alert.alert("Error", "No se pudo guardar el recorrido");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registrar Recorrido</Text>

      <Text style={styles.label}>Vehículo:</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={vehicleId} onValueChange={handleSelectVehicle} style={styles.picker}>
          <Picker.Item label="-- Selecciona --" value="" />
          {vehicles.map((v) => (
            <Picker.Item key={v.id} label={`${v.Dominio} - ${v.Modelo}`} value={v.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Fecha/Hora Inicio</Text>
      <View style={styles.row}>
        <Text style={[styles.inputDateTime, { flex: 0.7 }]}>{fechaInicio} {horaInicio ? `${horaInicio} hs` : ""}</Text>
        <TouchableOpacity style={styles.iconButton} onPress={clearInicio}>
          <MaterialCommunityIcons name="close-circle" size={24} color="red" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={setNowInicio}>
          <MaterialCommunityIcons name="check-circle" size={24} color="green" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={openDatePickerInicio}>
          <MaterialCommunityIcons name="calendar" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={openTimePickerInicio}>
          <MaterialCommunityIcons name="clock" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {showDatePickerInicio && (
        <DateTimePicker value={new Date()} mode="date" display="spinner" onChange={onChangeDateInicio} />
      )}
      {showTimePickerInicio && (
        <DateTimePicker value={new Date()} mode="time" display="spinner" is24Hour={true} onChange={onChangeTimeInicio} />
      )}

      <Text style={styles.label}>KM Inicial</Text>
      <TextInput style={styles.input} placeholder="15000" value={kmInicial} onChangeText={setKmInicial} keyboardType="numeric" />

      <Text style={styles.label}>Fecha/Hora Fin</Text>
      <View style={styles.row}>
        <Text style={[styles.inputDateTime, { flex: 0.7 }]}>{fechaFin} {horaFin ? `${horaFin} hs` : ""}</Text>
        <TouchableOpacity style={styles.iconButton} onPress={clearFin}>
          <MaterialCommunityIcons name="close-circle" size={24} color="red" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={setNowFin}>
          <MaterialCommunityIcons name="check-circle" size={24} color="green" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={openDatePickerFin}>
          <MaterialCommunityIcons name="calendar" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={openTimePickerFin}>
          <MaterialCommunityIcons name="clock" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {showDatePickerFin && (
        <DateTimePicker value={new Date()} mode="date" display="spinner" onChange={onChangeDateFin} />
      )}
      {showTimePickerFin && (
        <DateTimePicker value={new Date()} mode="time" display="spinner" is24Hour={true} onChange={onChangeTimeFin} />
      )}

      <Text style={styles.label}>KM Final</Text>
      <TextInput style={styles.input} placeholder="" value={kmFinal} onChangeText={setKmFinal} keyboardType="numeric" />

      <Text style={styles.label}>Observaciones</Text>
      <TextInput style={styles.input} placeholder="Sin novedades" value={observaciones} onChangeText={setObservaciones} />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <MaterialCommunityIcons name="content-save" size={24} color="#fff" />
        <Text style={styles.saveButtonText}> Guardar Recorrido</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F4F4F4" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  label: { marginTop: 10, fontWeight: "600" },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, overflow: "hidden", marginBottom: 10 },
  picker: { width: "100%" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  inputDateTime: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginRight: 6, textAlign: "center" },
  iconButton: { padding: 6 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 10 },
  saveButton: { flexDirection: "row", backgroundColor: "#007AFF", borderRadius: 6, padding: 12, alignItems: "center", justifyContent: "center", marginTop: 20 },
  saveButtonText: { color: "#fff", marginLeft: 8, fontSize: 16 },
});
