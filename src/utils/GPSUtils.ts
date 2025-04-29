// src/utils/GPSUtils.ts
// Utilidades para mejorar la precisión y el manejo del seguimiento GPS

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 */
export const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
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
  
  /**
   * Interface para un punto de ubicación
   */
  export interface LocationPoint {
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
  }
  
  /**
   * Filtra ubicaciones inválidas o improbables
   */
  export const isValidLocation = (
    newLocation: LocationPoint, 
    prevLocations: LocationPoint[]
  ): boolean => {
    // Si es el primer punto, siempre es válido
    if (prevLocations.length === 0) return true;
    
    const lastLocation = prevLocations[prevLocations.length - 1];
    
    // Si la precisión es realmente mala, descartar
    if (newLocation.accuracy && newLocation.accuracy > 50) { // 50 metros o peor
      return false;
    }
    
    // Calcular distancia con el punto anterior
    const distance = calculateDistance(
      lastLocation.latitude, lastLocation.longitude,
      newLocation.latitude, newLocation.longitude
    );
    
    // Calcular tiempo transcurrido en segundos
    const timeGap = (newLocation.timestamp - lastLocation.timestamp) / 1000;
    
    // Si el tiempo es 0 o negativo, algo está mal
    if (timeGap <= 0) return false;
    
    // Calcular velocidad en km/h
    const speed = (distance / timeGap) * 3600;
    
    // Si la velocidad es mayor a 150 km/h, probablemente es un error
    // Ajustable según el contexto (ciudad/carretera)
    if (speed > 150) {
      console.warn(`Punto filtrado: velocidad improbable (${speed.toFixed(2)} km/h)`);
      return false;
    }
    
    // Si se movió menos de 1 metro en más de 1 segundo, no agregarlo para no inflar la lista
    if (distance < 0.001 && timeGap > 1) {
      return false;
    }
    
    return true;
  };
  
  /**
   * Crea una trayectoria suavizada para mostrar en el mapa
   */
  export const getSmoothPath = (points: { latitude: number; longitude: number }[]) => {
    if (points.length <= 2) return points;
    
    const smoothedPoints = [];
    
    // Mantener el primer punto original
    smoothedPoints.push(points[0]);
    
    // Para cada par de puntos, interpolar puntos intermedios
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      // Calcular puntos intermedios (interpolación lineal)
      const midPoint = {
        latitude: (current.latitude + next.latitude) / 2,
        longitude: (current.longitude + next.longitude) / 2
      };
      
      smoothedPoints.push(midPoint);
      smoothedPoints.push(next);
    }
    
    return smoothedPoints;
  };
  
  /**
   * Implementación de un filtro Kalman simplificado para suavizar ubicaciones GPS
   */
  export class KalmanFilter {
    private lastLat: number | null = null;
    private lastLng: number | null = null;
    private variance: number = 5.0; // Mayor varianza = menos filtrado
    
    /**
     * Filtra una nueva ubicación
     */
    filter(lat: number, lng: number, accuracy: number = 10) {
      // Primera medición - no filtrar
      if (this.lastLat === null || this.lastLng === null) {
        this.lastLat = lat;
        this.lastLng = lng;
        return { latitude: lat, longitude: lng };
      }
      
      // Calcular ponderación basada en la precisión
      const k = Math.min(1, this.variance / (this.variance + accuracy * accuracy));
      
      // Aplicar filtro
      const filteredLat = this.lastLat + k * (lat - this.lastLat);
      const filteredLng = this.lastLng + k * (lng - this.lastLng);
      
      // Actualizar valores anteriores
      this.lastLat = filteredLat;
      this.lastLng = filteredLng;
      
      return { latitude: filteredLat, longitude: filteredLng };
    }
    
    /**
     * Reinicia el filtro
     */
    reset() {
      this.lastLat = null;
      this.lastLng = null;
    }
  }