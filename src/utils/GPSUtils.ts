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
  // Cambiar estos tipos para permitir null y undefined
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
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
  if (newLocation.accuracy && newLocation.accuracy > 30) { // Reducido de 50m a 30m
    console.log(`Punto filtrado por baja precisión: ${newLocation.accuracy}m`);
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
  if (timeGap <= 0) {
    console.log("Punto filtrado por tiempo inválido");
    return false;
  }
  
  // Calcular velocidad en km/h
  const speed = (distance / timeGap) * 3600;
  
  // Si la velocidad es mayor a 200 km/h, probablemente es un error
  // Aumentado de 150 km/h a 200 km/h para casos de vehículos rápidos
  if (speed > 150) {
    console.warn(`Punto filtrado: velocidad improbable (${speed.toFixed(2)} km/h)`);
    return false;
  }
  
  // Si se movió menos de 50cm en más de 1 segundo, no agregarlo para no inflar la lista
  // Reducido de 1m a 50cm para capturar movimientos más pequeños
  if (distance < 0.001 && timeGap > 1) {
    console.log(`Punto filtrado por movimiento mínimo: ${(distance*1000).toFixed(2)}m en ${timeGap.toFixed(1)}s`);
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
 * Verifica si la ruta está siguiendo calles (cambia de dirección)
 */
export const isFollowingRoads = (points: LocationPoint[], minPointsForCheck = 10): boolean => {
  if (points.length < minPointsForCheck) return true; // No hay suficientes puntos para verificar
  
  // Verificar cambios en la dirección (curso)
  let directionChanges = 0;
  let prevHeading = -1;
  
  for (let i = 1; i < points.length; i++) {
    // Verificamos que heading existe y lo convertimos a número
    const currentHeading = points[i].heading !== undefined && points[i].heading !== null 
      ? Number(points[i].heading) 
      : null;
      
    // Si no hay heading, continuamos al siguiente punto
    if (currentHeading === null) continue;
    
    if (prevHeading === -1) {
      prevHeading = currentHeading; // Ahora currentHeading es un número seguro
      continue;
    }
    
    // Calcular diferencia con manejo seguro de tipos
    const headingDiff = Math.abs(currentHeading - prevHeading);
    
    if (headingDiff > 20 && headingDiff < 340) { // No contar 360 -> 0
      directionChanges++;
      prevHeading = currentHeading; // Asignación segura de tipo
    }
  }
  
  // Si hay menos de 2 cambios de dirección en muchos puntos, probablemente está dibujando línea recta
  return directionChanges >= 2;
};

/**
 * Implementación de un filtro Kalman simplificado para suavizar ubicaciones GPS
 */
export class KalmanFilter {
  private lastLat: number | null = null;
  private lastLng: number | null = null;
  private variance: number = 1.0; // Reducido de 5.0 a 1.0 para aplicar menos suavizado
  
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