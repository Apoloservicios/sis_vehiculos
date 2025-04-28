// src/screens/GPSRecorridoScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Image,
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
import * as Location from "expo-location";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

type Props = DrawerScreenProps<DrawerParamList, "Recorrido GPS">;

// Interfaces
interface ILocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface IVehicle {
  id: string;
  Dominio: string;
  Modelo: string;
  Ultimo_kilometraje: number;
  Nivel_combustible?: string;
}

// Constantes
const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.005; // Valores más pequeños = más zoom
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function GPSRecorridoScreen({ navigation }: Props) {
  // Estados
  const [vehicleId, setVehicleId] = useState("");
  const [kmInicial, setKmInicial] = useState("");
  const [recording, setRecording] = useState(false);
  const [locations, setLocations] = useState<ILocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [nivelCombustible, setNivelCombustible] = useState("");
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  
  // Combustible
  const combustibleOptions = ["1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "1"];
  
  // Referencias
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<any>(null);
  
  // Datos de Redux
  const vehicles = useSelector((state: RootState) => state.vehicles.list);
  const user = useSelector((state: RootState) => state.auth);
  
  // Efectos
  useEffect(() => {
    requestLocationPermission();
    
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (vehicleId) {
        unlockVehicle(vehicleId);
      }
    };
  }, []);
  
  // Solicitar permisos de ubicación
  const requestLocationPermission = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceso a la ubicación para registrar el recorrido GPS",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        setHasLocationPermission(false);
        return;
      }
      
      setHasLocationPermission(true);
      
      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setCurrentLocation(location);
      
      // Centrar mapa en la ubicación actual
      if (mapRef.current && location) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        });
      }
    } catch (error) {
      console.error("Error al solicitar permisos de ubicación:", error);
      Alert.alert("Error", "No se pudieron obtener permisos de ubicación");
    } finally {
      setLoadingLocation(false);
    }
  };
  // Desbloquear vehículo
  const unlockVehicle = async (id: string) => {
    try {
      const ref = doc(db, "vehiculos", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data.locked && data.lockedBy === user.email) {
          await updateDoc(ref, { locked: false, lockedBy: null });
          console.log("Vehículo desbloqueado:", id);
        }
      }
    } catch (error) {
      console.log("Error al desbloquear vehículo:", error);
    }
  };
  
  // Manejar cambio de vehículo
  const handleSelectVehicle = async (val: string) => {
    if (vehicleId && vehicleId !== val) {
      await unlockVehicle(vehicleId);
    }
    
    setVehicleId(val);
    if (!val) {
      setKmInicial("");
      setNivelCombustible("");
      return;
    }
    
    try {
      const docRef = doc(db, "vehiculos", val);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.log("No se encontró el documento del vehículo en Firestore");
        setKmInicial("");
        setNivelCombustible("");
        return;
      }
      
      const data = docSnap.data();
      // Si está bloqueado por otro usuario => no permitir
      if (data.locked && data.lockedBy !== user.email) {
        Alert.alert("Atención", "El vehículo ya está en uso por otro usuario");
        setVehicleId("");
        setKmInicial("");
        setNivelCombustible("");
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
      setNivelCombustible(data.Nivel_combustible || "1/2");
    } catch (error) {
      console.log("Error al obtener datos de Firestore:", error);
      setKmInicial("");
      setNivelCombustible("");
    }
  };
  
  // Iniciar registro
  const startRecording = async () => {
    if (!vehicleId) {
      Alert.alert("Error", "Debes seleccionar un vehículo primero");
      return;
    }
    
    if (!hasLocationPermission) {
      await requestLocationPermission();
      if (!hasLocationPermission) return;
    }
    
    // Iniciar tracking de ubicación
    try {
      setLocations([]);
      setDistance(0);
      setStartTime(new Date());
      setEndTime(null);
      setRecording(true);
      
      // Suscribirse a actualizaciones de ubicación
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Actualizar cada 10 metros
          timeInterval: 5000    // O cada 5 segundos
        },
        (location) => {
          console.log("Nueva ubicación:", location.coords);
          setCurrentLocation(location);
          
          // Agregar ubicación a la lista
          const newLocation: ILocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp
          };
          
          setLocations(prevLocations => {
            const updatedLocations = [...prevLocations, newLocation];
            
            // Calcular distancia si hay al menos 2 puntos
            if (updatedLocations.length >= 2) {
              const lastIdx = updatedLocations.length - 1;
              const prevCoord = updatedLocations[lastIdx - 1];
              const newCoord = updatedLocations[lastIdx];
              
              const segmentDistance = calculateDistance(
                prevCoord.latitude, prevCoord.longitude,
                newCoord.latitude, newCoord.longitude
              );
              
              setDistance(prevDistance => prevDistance + segmentDistance);
            }
            
            return updatedLocations;
          });
          
          // Centrar mapa en la ubicación actual
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA
            });
          }
        }
      );
      
      Alert.alert("Recorrido iniciado", "Se está registrando tu recorrido por GPS");
    } catch (error) {
      console.error("Error al iniciar registro:", error);
      Alert.alert("Error", "No se pudo iniciar el registro del recorrido");
    }
  };
  // Detener registro
  const stopRecording = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    
    setEndTime(new Date());
    setRecording(false);
    
    if (locations.length < 2) {
      Alert.alert(
        "Recorrido muy corto", 
        "No se han registrado suficientes puntos para guardar el recorrido"
      );
      return;
    }
    
    Alert.alert(
      "Recorrido finalizado", 
      `Se registraron ${locations.length} puntos\nDistancia aproximada: ${distance.toFixed(2)} km`
    );
  };
  
  // Calcular distancia entre dos puntos usando fórmula Haversine
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distancia en km
    return distance;
  };
  
  // Formatear fecha
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };
  
  // Formatear hora
  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return date.toTimeString().split(" ")[0].substring(0, 5);
  };
  
  // Formatear duración
  const formatDuration = () => {
    if (!startTime || !endTime) return "00:00";
    
    const diff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };
  
  // Guardar recorrido
  const handleSaveRecorrido = async () => {
    if (!vehicleId || !startTime || !endTime || locations.length < 2) {
      Alert.alert("Error", "No hay datos suficientes para guardar el recorrido");
      return;
    }
    
    const v = vehicles.find((x) => x.id === vehicleId);
    if (!v) {
      Alert.alert("Error", "Vehículo no encontrado");
      return;
    }
    
    try {
      setLoading(true);
      
      // Calcular KM final sumando la distancia recorrida
      const kmInicial_num = parseInt(kmInicial) || 0;
      const kmFinal_num = kmInicial_num + Math.round(distance);
      
      // 1) Guardar en 'recorridos'
      const recorridoData = {
        Vehiculo: v.Dominio,
        Airport: user.airport || "",
        Usuario: user.email || "Desconocido",
        Fecha_inicio: formatDate(startTime),
        Hora_inicio: formatTime(startTime),
        Kilometraje_inicial: kmInicial_num,
        Fecha_fin: formatDate(endTime),
        Hora_fin: formatTime(endTime),
        Kilometraje_final: kmFinal_num,
        Observaciones: `Registro GPS - Distancia calculada: ${distance.toFixed(2)} km - Duración: ${formatDuration()}`,
        Nivel_combustible: nivelCombustible,
        GpsData: {
          puntos: locations.map(loc => ({
            lat: loc.latitude,
            lon: loc.longitude,
            time: loc.timestamp
          })),
          distanciaGPS: distance
        }
      };
      
      const recorridoRef = await addDoc(collection(db, "recorridos"), recorridoData);
      
      // 2) Actualizar vehículo con los nuevos datos
      await updateDoc(doc(db, "vehiculos", v.id), {
        Ultimo_kilometraje: kmFinal_num,
        Nivel_combustible: nivelCombustible,
        locked: false,
        lockedBy: null,
      });
      
      Alert.alert(
        "Éxito", 
        "Recorrido guardado correctamente",
        [{ text: "OK", onPress: () => navigation.navigate("Recorridos") }]
      );
      
    } catch (error) {
      console.error("Error al guardar recorrido:", error);
      Alert.alert("Error", "No se pudo guardar el recorrido");
    } finally {
      setLoading(false);
    }
  };

  // Cancelar recorrido
  const handleCancelRecorrido = () => {
    if (recording) {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      setRecording(false);
    }
    
    Alert.alert(
      "Cancelar recorrido", 
      "¿Estás seguro de que quieres cancelar el recorrido? Los datos no se guardarán.",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Sí, cancelar", 
          style: "destructive",
          onPress: () => {
            if (vehicleId) {
              unlockVehicle(vehicleId);
            }
            setLocations([]);
            setDistance(0);
            setStartTime(null);
            setEndTime(null);
            navigation.goBack();
          }
        }
      ]
    );
  };
  
  // Renderizar contenido
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registro de Recorrido por GPS</Text>
      
      {/* Mapa */}
      <View style={styles.mapContainer}>
        {loadingLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
          </View>
        ) : currentLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA
            }}
          >
            {/* Marcador de posición actual */}
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
              }}
              title="Ubicación actual"
            >
              <View style={styles.markerContainer}>
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#007AFF" />
              </View>
            </Marker>
            
            {/* Ruta recorrida */}
            {locations.length > 1 && (
              <Polyline
                coordinates={locations.map(loc => ({
                  latitude: loc.latitude,
                  longitude: loc.longitude
                }))}
                strokeWidth={4}
                strokeColor="#007AFF"
              />
            )}
            
            {/* Marcador de inicio */}
            {locations.length > 0 && (
              <Marker
                coordinate={{
                  latitude: locations[0].latitude,
                  longitude: locations[0].longitude
                }}
                title="Inicio"
              >
                <View style={[styles.markerContainer, styles.startMarker]}>
                  <MaterialCommunityIcons name="flag-checkered" size={24} color="#ffffff" />
                </View>
              </Marker>
            )}
          </MapView>
        ) : (
          <View style={styles.noLocationContainer}>
            <MaterialCommunityIcons name="map-marker-off" size={48} color="#999" />
            <Text style={styles.noLocationText}>No se pudo obtener la ubicación</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Datos del recorrido */}
      <View style={styles.formContainer}>
        {/* Selector de vehículo */}
        <Text style={styles.label}>Vehículo:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={vehicleId}
            onValueChange={handleSelectVehicle}
            style={styles.picker}
            enabled={!recording}
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
        
        {/* Información del vehículo seleccionado */}
        {vehicleId && (
          <View style={styles.vehicleInfoCard}>
            <Text style={styles.vehicleInfoTitle}>Información del Vehículo</Text>
            <Text style={styles.vehicleInfoText}>
              KM Actual: {kmInicial}
            </Text>
            <Text style={styles.vehicleInfoText}>
              Nivel Combustible: {nivelCombustible}
            </Text>
          </View>
        )}
        
        {/* Indicadores de recorrido */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="map-marker-distance" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Distancia</Text>
            <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Duración</Text>
            <Text style={styles.statValue}>
              {startTime && endTime ? formatDuration() : "00:00"}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="map-marker-path" size={24} color="#007AFF" />
            <Text style={styles.statLabel}>Puntos</Text>
            <Text style={styles.statValue}>{locations.length}</Text>
          </View>
        </View>
        
        {/* Selector de nivel de combustible */}
        {!recording && endTime && (
          <>
            <Text style={styles.label}>Nivel de Combustible al finalizar:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={nivelCombustible}
                onValueChange={setNivelCombustible}
                style={styles.picker}
              >
                {combustibleOptions.map((op) => (
                  <Picker.Item key={op} label={op} value={op} />
                ))}
              </Picker>
            </View>
          </>
        )}
      </View>
      
      {/* Botones de acción */}
      <View style={styles.buttonContainer}>
        {!recording && !endTime && (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={startRecording}
            disabled={!hasLocationPermission || !vehicleId || loading}
          >
            <MaterialCommunityIcons name="play" size={24} color="#fff" />
            <Text style={styles.buttonText}>Iniciar Recorrido</Text>
          </TouchableOpacity>
        )}
        
        {recording && (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopRecording}
            disabled={loading}
          >
            <MaterialCommunityIcons name="stop" size={24} color="#fff" />
            <Text style={styles.buttonText}>Detener Recorrido</Text>
          </TouchableOpacity>
        )}
        
        {!recording && endTime && (
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveRecorrido}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={24} color="#fff" />
                <Text style={styles.buttonText}>Guardar Recorrido</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancelRecorrido}
          disabled={loading}
        >
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
      
      {/* Resumen de horarios */}
      {startTime && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumen del Recorrido</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Inicio:</Text>
            <Text style={styles.summaryValue}>
              {formatDate(startTime)} {formatTime(startTime)}
            </Text>
          </View>
          
          {endTime && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fin:</Text>
              <Text style={styles.summaryValue}>
                {formatDate(endTime)} {formatTime(endTime)}
              </Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>KM Inicial:</Text>
            <Text style={styles.summaryValue}>{kmInicial}</Text>
          </View>
          
          {endTime && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>KM Final (estimado):</Text>
              <Text style={styles.summaryValue}>
                {(parseInt(kmInicial) || 0) + Math.round(distance)}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F9",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  mapContainer: {
    height: 300,
    margin: 15,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#eee",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  startMarker: {
    backgroundColor: "#007AFF",
    borderColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noLocationText: {
    marginTop: 10,
    color: "#666",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "500",
  },
  formContainer: {
    backgroundColor: "white",
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 15,
  },
  picker: {
    width: "100%",
    height: 50,
  },
  vehicleInfoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  vehicleInfoTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 16,
  },
  vehicleInfoText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#444",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginHorizontal: 3,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  startButton: {
    backgroundColor: "#28a745",
  },
  stopButton: {
    backgroundColor: "#dc3545",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
  },
  summaryContainer: {
    backgroundColor: "white",
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#007AFF",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
  },
});