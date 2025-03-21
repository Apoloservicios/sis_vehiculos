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
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { Picker } from "@react-native-picker/picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function RegisterRecorrido({ navigation }) {
  // Vehículo seleccionado
  const [vehicleId, setVehicleId] = useState("");

  // Fechas/Horas
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showTimePickerInicio, setShowTimePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);
  const [showTimePickerFin, setShowTimePickerFin] = useState(false);

  const [fechaInicio, setFechaInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horaFin, setHoraFin] = useState("");

  // Kilometrajes
  const [kmInicial, setKmInicial] = useState("");
  const [kmFinal, setKmFinal] = useState("");

  // Combustible
  const combustibleOptions = ["1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "1"];
  const [nivelCombustibleVehiculo, setNivelCombustibleVehiculo] = useState("");
  const [nivelCombustibleRecorrido, setNivelCombustibleRecorrido] = useState("");

  // Observaciones
  const observationOptions = [
    "Inspeccion de Area de Movimiento",
    "Perimetral",
    "Aviario",
    "Control Fauna",
    "Coordinaciones Locales",
    "Gestiones fuera del aeropuerto",
    "Combustible",
    "Traslado de personal",
    "Otro",
  ];
  const [selectedObservation, setSelectedObservation] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Datos de Redux
  const vehicles = useSelector((state: RootState) => state.vehicles.list);
  const user = useSelector((state: RootState) => state.auth);

  // 1) Cambiar de vehículo => desbloquea el anterior si lo habías bloqueado
  const handleSelectVehicle = async (val: string) => {
    // Desbloquea el vehículo anterior si es distinto
    if (vehicleId && vehicleId !== val) {
      try {
        const prevRef = doc(db, "vehiculos", vehicleId);
        const prevSnap = await getDoc(prevRef);
        if (prevSnap.exists()) {
          const prevData = prevSnap.data();
          // Solo lo desbloqueas si lockedBy == tu email
          if (prevData.locked && prevData.lockedBy === user.email) {
            await updateDoc(prevRef, { locked: false, lockedBy: null });
          }
        }
      } catch (error) {
        console.log("Error al desbloquear vehículo anterior:", error);
      }
    }

    setVehicleId(val);
    if (!val) {
      // Limpia datos si no hay vehículo
      setKmInicial("");
      setNivelCombustibleVehiculo("");
      setNivelCombustibleRecorrido("");
      return;
    }
    try {
      const docRef = doc(db, "vehiculos", val);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.log("No se encontró el documento del vehículo en Firestore");
        setKmInicial("");
        setNivelCombustibleVehiculo("");
        setNivelCombustibleRecorrido("");
        return;
      }
      const data = docSnap.data();
      // Si está bloqueado por otro usuario => no permitir
      if (data.locked && data.lockedBy !== user.email) {
        Alert.alert("Atención", "El vehículo ya está en uso por otro usuario");
        setVehicleId("");
        setKmInicial("");
        setNivelCombustibleVehiculo("");
        setNivelCombustibleRecorrido("");
        return;
      }
      // Si no está bloqueado => lo bloqueas
      if (!data.locked) {
        await updateDoc(docRef, {
          locked: true,
          lockedBy: user.email,
        });
      }
      setKmInicial(String(data.Ultimo_kilometraje || 0));
      setNivelCombustibleVehiculo(data.Nivel_combustible || "1/2");
      setNivelCombustibleRecorrido(data.Nivel_combustible || "1/2");
    } catch (error) {
      console.log("Error al obtener datos de Firestore:", error);
      setKmInicial("");
      setNivelCombustibleVehiculo("");
      setNivelCombustibleRecorrido("");
    }
  };

  // 2) Manejo de pickers de Fecha/Hora (inicio)
  const openDatePickerInicio = () => setShowDatePickerInicio(true);
  const openTimePickerInicio = () => setShowTimePickerInicio(true);

  const onChangeDateInicio = (_: any, selectedDate?: Date) => {
    setShowDatePickerInicio(false);
    if (selectedDate) {
      const dia = String(selectedDate.getDate()).padStart(2, "0");
      const mes = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();
      setFechaInicio(`${year}-${mes}-${dia}`);
    }
  };

  const onChangeTimeInicio = (_: any, selectedTime?: Date) => {
    setShowTimePickerInicio(false);
    if (selectedTime) {
      const hh = String(selectedTime.getHours()).padStart(2, "0");
      const mm = String(selectedTime.getMinutes()).padStart(2, "0");
      setHoraInicio(`${hh}:${mm}`);
    }
  };

  const clearInicio = () => {
    setFechaInicio("");
    setHoraInicio("");
  };
  const setNowInicio = () => {
    const now = new Date();
    onChangeDateInicio(null, now);
    onChangeTimeInicio(null, now);
  };

  // 3) Manejo de pickers de Fecha/Hora (fin)
  const openDatePickerFin = () => setShowDatePickerFin(true);
  const openTimePickerFin = () => setShowTimePickerFin(true);

  const onChangeDateFin = (_: any, selectedDate?: Date) => {
    setShowDatePickerFin(false);
    if (selectedDate) {
      const dia = String(selectedDate.getDate()).padStart(2, "0");
      const mes = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();
      setFechaFin(`${year}-${mes}-${dia}`);
    }
  };

  const onChangeTimeFin = (_: any, selectedTime?: Date) => {
    setShowTimePickerFin(false);
    if (selectedTime) {
      const hh = String(selectedTime.getHours()).padStart(2, "0");
      const mm = String(selectedTime.getMinutes()).padStart(2, "0");
      setHoraFin(`${hh}:${mm}`);
    }
  };

  const clearFin = () => {
    setFechaFin("");
    setHoraFin("");
  };
  const setNowFin = () => {
    const now = new Date();
    onChangeDateFin(null, now);
    onChangeTimeFin(null, now);
  };

  // 4) Guardar Recorrido
  const handleSave = async () => {
    if (
      !vehicleId ||
      !fechaInicio ||
      !horaInicio ||
      !fechaFin ||
      !horaFin ||
      !kmInicial ||
      !kmFinal
    ) {
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
      // 4.1) Guardar en 'recorridos'
      await addDoc(collection(db, "recorridos"), {
        Vehiculo: v.Dominio,
        Airport: user.airport || "",
        Usuario: user.email || "Desconocido",
        Fecha_inicio: fechaInicio,
        Hora_inicio: horaInicio,
        Kilometraje_inicial: Number(kmInicial),
        Fecha_fin: fechaFin,
        Hora_fin: horaFin,
        Kilometraje_final: Number(kmFinal),
        Observaciones: observaciones,
        Nivel_combustible: nivelCombustibleRecorrido,
      });

      // 4.2) Actualizar vehículo: km, combustible, locked: false, lockedBy: null
      await updateDoc(doc(db, "vehiculos", v.id), {
        Ultimo_kilometraje: Number(kmFinal),
        Nivel_combustible: nivelCombustibleRecorrido,
        locked: false,
        lockedBy: null,
      });

      Alert.alert("Éxito", "Recorrido guardado y vehículo actualizado");

      // 4.3) Reseteamos campos
      setKmInicial(kmFinal);
      setFechaInicio("");
      setHoraInicio("");
      setFechaFin("");
      setHoraFin("");
      setKmFinal("");
      setObservaciones("");
      // Podrías deseleccionar el vehículo
      // setVehicleId("");

    } catch (error) {
      console.error("Error al guardar Recorrido:", error);
      Alert.alert("Error", "No se pudo guardar el recorrido");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registrar Recorrido</Text>

      {/* SELECCIÓN DE VEHÍCULO */}
      <Text style={styles.label}>Vehículo:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={vehicleId}
          onValueChange={handleSelectVehicle}
          style={styles.picker}
        >
          <Picker.Item label="-- Selecciona --" value="" />
          {vehicles.map((v) => (
            <Picker.Item
              key={v.id}
              label={`${v.Dominio} - ${v.Modelo}`}
              value={v.id}
            />
          ))}
        </Picker>
      </View>

      {/* FECHA/HORA INICIO */}
      <Text style={styles.label}>Fecha/Hora Inicio</Text>
      <View style={styles.row}>
        <Text style={[styles.inputDateTime, { flex: 0.7 }]}>
          {fechaInicio} {horaInicio ? `${horaInicio} hs` : ""}
        </Text>
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
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="spinner"
          onChange={onChangeDateInicio}
        />
      )}
      {showTimePickerInicio && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="spinner"
          is24Hour={true}
          onChange={onChangeTimeInicio}
        />
      )}

      {/* KM INICIAL */}
      <Text style={styles.label}>KM Inicial</Text>
      <TextInput
        style={styles.input}
        placeholder="15000"
        value={kmInicial}
        onChangeText={setKmInicial}
        keyboardType="numeric"
      />

      {/* FECHA/HORA FIN */}
      <Text style={styles.label}>Fecha/Hora Fin</Text>
      <View style={styles.row}>
        <Text style={[styles.inputDateTime, { flex: 0.7 }]}>
          {fechaFin} {horaFin ? `${horaFin} hs` : ""}
        </Text>
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
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="spinner"
          onChange={onChangeDateFin}
        />
      )}
      {showTimePickerFin && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="spinner"
          is24Hour={true}
          onChange={onChangeTimeFin}
        />
      )}

      {/* KM FINAL */}
      <Text style={styles.label}>KM Final</Text>
      <TextInput
        style={styles.input}
        placeholder=""
        value={kmFinal}
        onChangeText={setKmFinal}
        keyboardType="numeric"
      />

      {/* OBSERVACIONES (con Picker + input) */}
      <Text style={styles.label}>Observaciones:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedObservation}
          onValueChange={(val) => {
            setSelectedObservation(val);
            if (val !== "Otro" && val !== "") {
              setObservaciones(val);
            } else {
              setObservaciones("");
            }
          }}
        >
          <Picker.Item label="-- Selecciona --" value="" />
          {observationOptions.map((op) => (
            <Picker.Item key={op} label={op} value={op} />
          ))}
        </Picker>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Escribe observaciones o modifica la opción elegida"
        value={observaciones}
        onChangeText={setObservaciones}
      />

      {/* NIVEL DE COMBUSTIBLE */}
      <Text style={styles.label}>Nivel de Combustible:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={nivelCombustibleRecorrido}
          onValueChange={(val) => setNivelCombustibleRecorrido(val)}
        >
          {combustibleOptions.map((op) => (
            <Picker.Item key={op} label={op} value={op} />
          ))}
        </Picker>
      </View>

      {/* BOTÓN GUARDAR */}
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 10,
  },
  picker: { width: "100%" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  inputDateTime: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginRight: 6,
    textAlign: "center",
  },
  iconButton: { padding: 6 },
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
