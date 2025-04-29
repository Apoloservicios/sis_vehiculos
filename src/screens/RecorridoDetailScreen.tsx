// src/screens/RecorridoDetailScreen.tsx (mejorado)
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { getSmoothPath } from "../utils/GPSUtils";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

type RouteParams = {
  recorridoId: string;
};

const RecorridoDetailScreen = () => {
  const [recorrido, setRecorrido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [routePoints, setRoutePoints] = useState<Array<{ latitude: number; longitude: number }>>(
    []
  );
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const [showRawPath, setShowRawPath] = useState(false); // Para alternar entre ruta suavizada y original

  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const mapRef = useRef<MapView>(null);
  const recorridoId = route.params?.recorridoId;

  useEffect(() => {
    // Configurar título de la pantalla
    navigation.setOptions({
      title: "Detalle de Recorrido",
      headerBackTitle: "Volver",
    });

    // Cargar datos del recorrido
    loadRecorridoData();
  }, [recorridoId]);

  const loadRecorridoData = async () => {
    try {
      if (!recorridoId) {
        Alert.alert("Error", "ID de recorrido no proporcionado");
        navigation.goBack();
        return;
      }

      const docRef = doc(db, "recorridos", recorridoId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        Alert.alert("Error", "Recorrido no encontrado");
        navigation.goBack();
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() };
      setRecorrido(data);

      // Verificar si tiene datos GPS
      if (data.GpsData && data.GpsData.puntos && data.GpsData.puntos.length > 0) {
        // Convertir puntos GPS al formato requerido por react-native-maps
        const points = data.GpsData.puntos.map((p: any) => ({
          latitude: p.lat,
          longitude: p.lon,
          accuracy: p.accuracy,
          speed: p.speed,
          heading: p.heading,
          timestamp: p.time
        }));
        setRoutePoints(points);

        // Configurar región inicial (centrada en el primer punto)
        if (points.length > 0) {
          setInitialRegion({
            latitude: points[0].latitude,
            longitude: points[0].longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del recorrido:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del recorrido");
    } finally {
      setLoading(false);
    }
  };

  // Función para ajustar el mapa a todos los puntos de la ruta
  const fitMapToRoute = () => {
    if (mapRef.current && routePoints.length > 0) {
      mapRef.current.fitToCoordinates(routePoints, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  // Formatear fecha y hora
  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return "N/A";
    return `${dateStr} ${timeStr || ""}`;
  };

  // Estimar velocidad promedio
  const calculateAvgSpeed = () => {
    if (!recorrido?.GpsData?.distanciaGPS || !recorrido?.Fecha_inicio || !recorrido?.Fecha_fin) {
      return "N/A";
    }
    
    try {
      const startDateTime = new Date(`${recorrido.Fecha_inicio}T${recorrido.Hora_inicio || "00:00"}`);
      const endDateTime = new Date(`${recorrido.Fecha_fin}T${recorrido.Hora_fin || "00:00"}`);
      
      // Duración en horas
      const duration = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      
      if (duration <= 0) return "N/A";
      
      // Velocidad en km/h
      const avgSpeed = recorrido.GpsData.distanciaGPS / duration;
      return `${avgSpeed.toFixed(1)} km/h`;
    } catch (error) {
      return "N/A";
    }
  };

  // Alternar entre ruta suavizada y original
  const togglePathType = () => {
    setShowRawPath(!showRawPath);
  };

  // Renderizar componente de carga
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando detalles del recorrido...</Text>
      </View>
    );
  }

  // Verificar si tiene datos de recorrido GPS
  const hasGpsData = recorrido?.GpsData && routePoints.length > 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recorrido {recorrido?.Vehiculo}</Text>
        <Text style={styles.subtitle}>
          {formatDateTime(recorrido?.Fecha_inicio, recorrido?.Hora_inicio)}
        </Text>
      </View>

      {/* Si hay datos GPS, mostrar mapa */}
      {hasGpsData ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            onMapReady={fitMapToRoute}
          >
            {/* Punto de inicio */}
            {routePoints.length > 0 && (
              <Marker
                coordinate={routePoints[0]}
                title="Inicio"
                description={formatDateTime(recorrido?.Fecha_inicio, recorrido?.Hora_inicio)}
              >
                <View style={[styles.markerContainer, styles.startMarker]}>
                  <MaterialCommunityIcons name="flag-outline" size={20} color="#fff" />
                </View>
              </Marker>
            )}

            {/* Punto final */}
            {routePoints.length > 1 && (
              <Marker
                coordinate={routePoints[routePoints.length - 1]}
                title="Fin"
                description={formatDateTime(recorrido?.Fecha_fin, recorrido?.Hora_fin)}
              >
                <View style={[styles.markerContainer, styles.endMarker]}>
                  <MaterialCommunityIcons name="flag-checkered" size={20} color="#fff" />
                </View>
              </Marker>
            )}

            {/* Ruta como línea */}
            {routePoints.length > 1 && !showRawPath && (
              <Polyline
                coordinates={getSmoothPath(routePoints)}
                strokeWidth={4}
                strokeColor="#007AFF"
              />
            )}

            {/* Ruta original (sin suavizado) */}
            {routePoints.length > 1 && showRawPath && (
              <Polyline
                coordinates={routePoints}
                strokeWidth={4}
                strokeColor="#34C6DA"
                lineDashPattern={[5, 2]}
              />
            )}
          </MapView>

          <View style={styles.mapButtons}>
            <TouchableOpacity style={styles.fitButton} onPress={fitMapToRoute}>
              <MaterialCommunityIcons name="fit-to-screen-outline" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toggleButton} onPress={togglePathType}>
              <MaterialCommunityIcons 
                name={showRawPath ? "vector-polyline" : "vector-curve"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.noMapContainer}>
          <MaterialCommunityIcons name="map-marker-off" size={48} color="#999" />
          <Text style={styles.noMapText}>Este recorrido no tiene datos GPS</Text>
        </View>
      )}

      {/* Detalles del recorrido */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Detalles del Recorrido</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vehículo:</Text>
          <Text style={styles.detailValue}>{recorrido?.Vehiculo || "N/A"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Usuario:</Text>
          <Text style={styles.detailValue}>{recorrido?.Usuario || "N/A"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Aeropuerto:</Text>
          <Text style={styles.detailValue}>{recorrido?.Airport || "N/A"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Inicio:</Text>
          <Text style={styles.detailValue}>
            {formatDateTime(recorrido?.Fecha_inicio, recorrido?.Hora_inicio)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fin:</Text>
          <Text style={styles.detailValue}>
            {formatDateTime(recorrido?.Fecha_fin, recorrido?.Hora_fin)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>KM Inicial:</Text>
          <Text style={styles.detailValue}>
            {recorrido?.Kilometraje_inicial || "N/A"} km
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>KM Final:</Text>
          <Text style={styles.detailValue}>
            {recorrido?.Kilometraje_final || "N/A"} km
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Distancia:</Text>
          <Text style={styles.detailValue}>
            {recorrido?.Kilometraje_final && recorrido?.Kilometraje_inicial
              ? `${recorrido.Kilometraje_final - recorrido.Kilometraje_inicial} km`
              : "N/A"}
          </Text>
        </View>

        {hasGpsData && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Distancia GPS:</Text>
              <Text style={styles.detailValue}>
                {recorrido?.GpsData?.distanciaGPS
                  ? `${recorrido.GpsData.distanciaGPS.toFixed(2)} km`
                  : "N/A"}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Puntos GPS:</Text>
              <Text style={styles.detailValue}>
                {recorrido?.GpsData?.puntos?.length || 0}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vel. Promedio:</Text>
              <Text style={styles.detailValue}>{calculateAvgSpeed()}</Text>
            </View>
          </>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Combustible:</Text>
          <Text style={styles.detailValue}>{recorrido?.Nivel_combustible || "N/A"}</Text>
        </View>

        <View style={styles.observationsContainer}>
          <Text style={styles.detailLabel}>Observaciones:</Text>
          <Text style={styles.observationsText}>
            {recorrido?.Observaciones || "Sin observaciones"}
          </Text>
        </View>
      </View>

      {/* Botón para volver */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        <Text style={styles.backButtonText}>Volver a Recorridos</Text>
      </TouchableOpacity>
      
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  header: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  mapContainer: {
    height: 300,
    margin: 15,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapButtons: {
    position: "absolute",
    bottom: 15,
    right: 15,
  },
  fitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
  },
  toggleButton: {
    backgroundColor: "#34C6DA",
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startMarker: {
    backgroundColor: "#4CAF50",
  },
  endMarker: {
    backgroundColor: "#F44336",
  },
  noMapContainer: {
    height: 200,
    margin: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noMapText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  detailsContainer: {
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#007AFF",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  detailValue: {
    fontSize: 16,
    color: "#555",
  },
  observationsContainer: {
    marginTop: 10,
    paddingTop: 10,
  },
  observationsText: {
    fontSize: 16,
    color: "#555",
    marginTop: 10,
    lineHeight: 22,
  },
  backButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    margin: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default RecorridoDetailScreen;