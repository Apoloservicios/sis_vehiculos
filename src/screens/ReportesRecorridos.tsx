// src/screens/ReportesRecorridos.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { db } from "../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
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
      const dataForSheet = recorridos.map((r) => ({
        // id: r.id,
        Usuario: r.Usuario || "",
        Vehiculo: r.Vehiculo || "",
        Airport: r.Airport || "",
        Fecha_inicio: r.Fecha_inicio || "",
        Hora_inicio: r.Hora_inicio || "",
        Fecha_fin: r.Fecha_fin || "",
        Hora_fin: r.Hora_fin || "",
        Kilometraje_inicial: r.Kilometraje_inicial || "",
        Kilometraje_final: r.Kilometraje_final || "",
        Nivel_combustible: r.Nivel_combustible || "",
        Observaciones: r.Observaciones || "",
      }));
      dataForSheet.sort(
        (a, b) => Number(a.Kilometraje_final) - Number(b.Kilometraje_final)
      );
      const headers = [
        // "id",
        "Usuario",
        "Vehiculo",
        "Airport",
        "Fecha_inicio",
        "Hora_inicio",
        "Fecha_fin",
        "Hora_fin",
        "Kilometraje_inicial",
        "Kilometraje_final",
        "Nivel_combustible",
        "Observaciones",
      ];
      const ws = XLSX.utils.json_to_sheet(dataForSheet, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Recorridos");
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const fileName = `reporte_${Date.now()}.xlsx`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Compartir reporte",
        UTI: "com.microsoft.excel.xlsx",
      });
    } catch (error) {
      console.log("Error al exportar XLSX:", error);
      Alert.alert("Error", "No se pudo exportar el archivo Excel");
    }
  };

  // Header de la lista (antes lo teníamos en un ScrollView)
  const renderHeader = () => {
    return (
      <View>
        <Text style={styles.title}>Reportes de Recorridos</Text>
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

        <Text style={styles.label}>Fecha Desde:</Text>
        <View style={styles.row}>
          <Text style={[styles.inputDateTime, { flex: 0.7 }]}>{fechaDesde}</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setFechaDesde("")}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowDateDesde(true)}
          >
            <MaterialCommunityIcons name="calendar" size={24} color="#007AFF" />
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

        <Text style={styles.label}>Fecha Hasta:</Text>
        <View style={styles.row}>
          <Text style={[styles.inputDateTime, { flex: 0.7 }]}>{fechaHasta}</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setFechaHasta("")}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowDateHasta(true)}
          >
            <MaterialCommunityIcons name="calendar" size={24} color="#007AFF" />
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

        <TouchableOpacity style={styles.button} onPress={handleGenerarReporte}>
          <MaterialCommunityIcons name="file-search" size={24} color="#fff" />
          <Text style={styles.buttonText}> Generar Reporte</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 20 }]}>Resultados:</Text>
      </View>
    );
  };

  // Footer de la lista: botón Exportar XLSX
  const renderFooter = () => {
    if (recorridos.length === 0) return null; // Solo si hay datos
    return (
      <TouchableOpacity
        style={[styles.button, { marginTop: 20, backgroundColor: "green" }]}
        onPress={handleExportXLSX}
      >
        <MaterialCommunityIcons name="file-excel" size={24} color="#fff" />
        <Text style={styles.buttonText}> Exportar XLSX</Text>
      </TouchableOpacity>
    );
  };

  // Render de cada item
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>
        {item.Vehiculo} | {item.Fecha_inicio} | {item.Kilometraje_inicial} km
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={recorridos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F4", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
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
