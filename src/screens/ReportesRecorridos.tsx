import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { db } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// --- IMPORTS PARA XLSX + Expo ---
import XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function ReportesRecorridos() {
  const [vehicleId, setVehicleId] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [showDateDesde, setShowDateDesde] = useState(false);
  const [showDateHasta, setShowDateHasta] = useState(false);

  const vehicles = useSelector((state: RootState) => state.vehicles.list);
  const [recorridos, setRecorridos] = useState<any[]>([]);

  // Formatear fecha a YYYY-MM-DD
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const onChangeDesde = (_: any, selectedDate?: Date) => {
    setShowDateDesde(false);
    if (selectedDate) setFechaDesde(formatDate(selectedDate));
  };

  const onChangeHasta = (_: any, selectedDate?: Date) => {
    setShowDateHasta(false);
    if (selectedDate) setFechaHasta(formatDate(selectedDate));
  };

  const handleSelectVehicle = (val: string) => {
    setVehicleId(val);
  };

  // Consulta Firestore
  const handleGenerarReporte = async () => {
    if (!fechaDesde || !fechaHasta) {
      Alert.alert("Error", "Selecciona fecha desde y fecha hasta");
      return;
    }

    let dominioSeleccionado = "";
    if (vehicleId) {
      const v = vehicles.find((x) => x.id === vehicleId);
      if (!v) {
        Alert.alert("Error", "Vehículo no encontrado");
        return;
      }
      dominioSeleccionado = v.Dominio;
    }

    try {
      let q = query(
        collection(db, "recorridos"),
        where("Fecha_inicio", ">=", fechaDesde),
        where("Fecha_inicio", "<=", fechaHasta)
      );
      if (dominioSeleccionado) {
        q = query(q, where("Vehiculo", "==", dominioSeleccionado));
      }

      const snapshot = await getDocs(q);
      const temp: any[] = [];
      snapshot.forEach((docSnap) => {
        temp.push({ id: docSnap.id, ...docSnap.data() });
      });

      setRecorridos(temp);
      Alert.alert("OK", `Se encontraron ${temp.length} recorridos`);
    } catch (error) {
      console.log("Error al generar reporte:", error);
      Alert.alert("Error", "No se pudo generar el reporte");
    }
  };

  // Generar y compartir XLSX

 
const handleExportXLSX = async () => {
    if (recorridos.length === 0) {
      Alert.alert("Atención", "No hay datos para exportar");
      return;
    }
  
    try {
        // 1) Preparamos el array con las columnas en el orden deseado
const dataForSheet = recorridos.map((r) => ({
    id: r.id,
    Vehiculo: r.Vehiculo || "",
    Airport: r.Airport || "",
    Fecha_inicio: r.Fecha_inicio || "",
    Hora_inicio: r.Hora_inicio || "",
    Fecha_fin: r.Fecha_fin || "",
    Hora_fin: r.Hora_fin || "",
    Kilometraje_inicial: r.Kilometraje_inicial || "",
    Kilometraje_final: r.Kilometraje_final || "",
    Observaciones: r.Observaciones || "",
  }));
  
  // 2) Ordenamos por "Kilometraje_final" de mayor a menor
  dataForSheet.sort(
    (a, b) => Number(b.Kilometraje_final) - Number(a.Kilometraje_final)
  );
  
  // 3) Definimos los encabezados y generamos la hoja con XLSX
  const headers = [
    "id",
    "Vehiculo",
    "Airport",
    "Fecha_inicio",
    "Hora_inicio",
    "Fecha_fin",
    "Hora_fin",
    "Kilometraje_inicial",
    "Kilometraje_final",
    "Observaciones",
  ];
  
  const ws = XLSX.utils.json_to_sheet(dataForSheet, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Recorridos");
  
  const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  // ... (continúa con el proceso para guardar y compartir)
  
      // 4) Guardamos el archivo en la carpeta temporal (cacheDirectory)
      const fileName = `reporte_${Date.now()}.xlsx`;
      const fileUri = FileSystem.cacheDirectory + fileName;
  
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // 5) Compartimos el archivo
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Compartir reporte",
        UTI: "com.microsoft.excel.xlsx", // iOS
      });
    } catch (error) {
      console.log("Error al exportar XLSX:", error);
      Alert.alert("Error", "No se pudo exportar el archivo Excel");
    }
  };





  // Render item
  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>
          {item.Vehiculo} | {item.Fecha_inicio} | {item.Kilometraje_inicial} km
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reportes de Recorridos</Text>

      {/* PICKER VEHÍCULO */}
      <Text style={styles.label}>Vehículo (opcional):</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={vehicleId}
          onValueChange={handleSelectVehicle}
          style={styles.picker}
        >
          <Picker.Item label="-- Todos --" value="" />
          {vehicles.map((v) => (
            <Picker.Item
              key={v.id}
              label={`${v.Dominio} - ${v.Modelo}`}
              value={v.id}
            />
          ))}
        </Picker>
      </View>

      {/* FECHA DESDE */}
      <Text style={styles.label}>Fecha Desde:</Text>
      <View style={styles.row}>
        <Text style={[styles.inputDateTime, { flex: 0.7 }]}>
          {fechaDesde}
        </Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setFechaDesde("")}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={24}
            color="red"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowDateDesde(true)}
        >
          <MaterialCommunityIcons
            name="calendar"
            size={24}
            color="#007AFF"
          />
        </TouchableOpacity>
      </View>
      {showDateDesde && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="spinner"
          onChange={onChangeDesde}
        />
      )}

      {/* FECHA HASTA */}
      <Text style={styles.label}>Fecha Hasta:</Text>
      <View style={styles.row}>
        <Text style={[styles.inputDateTime, { flex: 0.7 }]}>
          {fechaHasta}
        </Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setFechaHasta("")}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={24}
            color="red"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowDateHasta(true)}
        >
          <MaterialCommunityIcons
            name="calendar"
            size={24}
            color="#007AFF"
          />
        </TouchableOpacity>
      </View>
      {showDateHasta && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="spinner"
          onChange={onChangeHasta}
        />
      )}

      {/* BOTÓN GENERAR REPORTE */}
      <TouchableOpacity style={styles.button} onPress={handleGenerarReporte}>
        <MaterialCommunityIcons name="file-search" size={24} color="#fff" />
        <Text style={styles.buttonText}> Generar Reporte</Text>
      </TouchableOpacity>

      {/* LISTADO DE RESULTADOS */}
      <Text style={[styles.label, { marginTop: 20 }]}>Resultados:</Text>
      {recorridos.length > 0 ? (
        <FlatList
          data={recorridos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : (
        <Text style={{ marginTop: 10 }}>No hay datos</Text>
      )}

      {/* BOTÓN EXPORTAR XLSX */}
      {recorridos.length > 0 && (
        <TouchableOpacity
          style={[styles.button, { marginTop: 20, backgroundColor: "green" }]}
          onPress={handleExportXLSX}
        >
          <MaterialCommunityIcons name="file-excel" size={24} color="#fff" />
          <Text style={styles.buttonText}> Exportar XLSX</Text>
        </TouchableOpacity>
      )}
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
  iconButton: {
    padding: 6,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", marginLeft: 8, fontSize: 16 },
  itemContainer: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  itemText: { fontSize: 14 },
});
