// src/screens/RegisterRecorrido.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Dimensions,
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
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Picker } from "@react-native-picker/picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from '@react-navigation/native';

import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";

type Props = DrawerScreenProps<DrawerParamList, "Registrar Recorrido">;

const { width } = Dimensions.get('window');




// Interfaces para props de componentes
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

interface DateTimeSelectorProps {
  date: string;
  time: string;
  onDateChange: (event: any, date?: Date) => void;
  onTimeChange: (event: any, time?: Date) => void;
  onClear: () => void;
  onSetNow: () => void;
  label: string;
}

interface FuelLevelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

// Componente de pasos en la parte superior
const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps }) => {
  
  return (
    <View style={progressStyles.container}>
      {Array(totalSteps).fill(0).map((_, index) => (
        <View key={index} style={progressStyles.stepContainer}>
          <View style={[
            progressStyles.stepCircle,
            index < currentStep ? progressStyles.stepCompleted : 
            index === currentStep ? progressStyles.stepCurrent : null
          ]}>
            <Text style={[
              progressStyles.stepText,
              index < currentStep || index === currentStep ? progressStyles.stepTextActive : null
            ]}>{index + 1}</Text>
          </View>
          {index < totalSteps - 1 && (
            <View style={[
              progressStyles.stepLine,
              index < currentStep ? progressStyles.stepLineCompleted : null
            ]} />
          )}
        </View>
      ))}
    </View>
  );
};

// Componente para selección de fecha/hora
const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({ 
  date, 
  time, 
  onDateChange, 
  onTimeChange, 
  onClear, 
  onSetNow, 
  label 
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  
  const openPicker = (pickerMode: 'date' | 'time') => {
    setMode(pickerMode);
    setShowPicker(true);
  };
  
  const handleChange = (event: any, selected?: Date) => {
    setShowPicker(false);
    if (!selected) return;
    
    if (mode === 'date') {
      onDateChange(null, selected);
    } else {
      onTimeChange(null, selected);
    }
  };
  
  const displayText = date && time 
    ? `${date} ${time} hs` 
    : date 
      ? date 
      : "Seleccione fecha y hora";

  return (
    <View style={dtStyles.container}>
      <Text style={dtStyles.label}>{label}</Text>
      <View style={dtStyles.selector}>
        <Text style={dtStyles.displayText}>{displayText}</Text>
        <View style={dtStyles.buttonContainer}>
          <TouchableOpacity
            style={dtStyles.iconButton}
            onPress={onClear}
          >
            <MaterialCommunityIcons name="close-circle" size={20} color="red" />
          </TouchableOpacity>
          <TouchableOpacity
            style={dtStyles.iconButton}
            onPress={onSetNow}
          >
            <MaterialCommunityIcons name="check-circle" size={20} color="green" />
          </TouchableOpacity>
          <TouchableOpacity
            style={dtStyles.iconButton}
            onPress={() => openPicker('date')}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={dtStyles.iconButton}
            onPress={() => openPicker('time')}
          >
            <MaterialCommunityIcons name="clock" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode={mode}
          display="spinner"
          onChange={handleChange}
          is24Hour={true}
        />
      )}
    </View>
  );
};

// Componente visual para selección de combustible
const FuelLevelSelector: React.FC<FuelLevelSelectorProps> = ({ value, onChange, options }) => {
  const getFillPercentage = (level: string): number => {
    if (level === "1") return 100;
    const parts = level.split('/');
    return (parseInt(parts[0]) / parseInt(parts[1])) * 100;
  };

  return (
    <View style={fuelStyles.container}>
      <Text style={fuelStyles.label}>Nivel de Combustible</Text>
      <Text style={fuelStyles.selected}>Seleccionado: {value}</Text>
      <View style={fuelStyles.fuelGauge}>
        {options.map((level: string) => (
          <TouchableOpacity
            key={level}
            style={[
              fuelStyles.fuelOption,
              { height: `${getFillPercentage(level)}%` },
              value === level ? fuelStyles.fuelSelected : null
            ]}
            onPress={() => onChange(level)}
          >
            <Text style={[
              fuelStyles.fuelText,
              value === level ? fuelStyles.fuelTextSelected : null
            ]}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function RegisterRecorrido({ navigation }: Props) {
  // Estado actual del formulario
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;

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

  // Observaciones - Modificado para múltiples selecciones
  const [observationOptions, setObservationOptions] = useState<string[]>([
    "Inspeccion de Area de Movimiento",
    "Perimetral",
    "Aviario",
    "Control Fauna",
    "Coordinaciones Locales",
    "Gestiones fuera del aeropuerto",
    "Combustible",
    "Traslado de personal",
    "Otro",
  ]);
  const [selectedObservations, setSelectedObservations] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [loadingObservations, setLoadingObservations] = useState(false);

  // Datos de Redux
  const vehicles = useSelector((state: RootState) => state.vehicles.list);
  
  const user = useSelector((state: RootState) => state.auth);

  // Validación de formulario
  const [formErrors, setFormErrors] = useState({
    vehicleId: false,
    fechaInicio: false,
    horaInicio: false,
    kmInicial: false,
    fechaFin: false,
    horaFin: false,
    kmFinal: false
  });

  // Avanzar al siguiente paso
  const nextStep = () => {
    // Validación según el paso actual
    if (currentStep === 0) {
      if (!vehicleId) {
        setFormErrors(prev => ({ ...prev, vehicleId: true }));
        Alert.alert("Error", "Selecciona un vehículo para continuar");
        return;
      }
    } else if (currentStep === 1) {
      if (!fechaInicio || !horaInicio || !kmInicial) {
        setFormErrors(prev => ({ 
          ...prev, 
          fechaInicio: !fechaInicio,
          horaInicio: !horaInicio,
          kmInicial: !kmInicial 
        }));
        Alert.alert("Error", "Completa todos los datos de inicio");
        return;
      }
    } else if (currentStep === 2) {
      if (!fechaFin || !horaFin || !kmFinal) {
        setFormErrors(prev => ({
          ...prev,
          fechaFin: !fechaFin,
          horaFin: !horaFin,
          kmFinal: !kmFinal
        }));
        Alert.alert("Error", "Completa todos los datos de fin");
        return;
      }
      
      if (Number(kmFinal) <= Number(kmInicial)) {
        setFormErrors(prev => ({ ...prev, kmFinal: true }));
        Alert.alert("Error", "El KM final debe ser mayor que el KM inicial");
        return;
      }
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Retroceder al paso anterior
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Cargar observaciones personalizadas al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchObservations();
      
      // Manejar el desbloqueo del vehículo al salir de la pantalla
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (vehicleId) {
          unlockVehicle(vehicleId);
        }
        return false; // Permite que la navegación normal continúe
      });

      return () => {
        backHandler.remove();
        // Desbloquear vehículo al salir de la pantalla
        if (vehicleId) {
          unlockVehicle(vehicleId);
        }
      };
    }, [vehicleId])
  );

  // Desbloquear vehículo (función separada para reutilizar)
  const unlockVehicle = async (id: string) => {
    try {
      const ref = doc(db, "vehiculos", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        // Solo desbloquea si lockedBy == tu email
        if (data.locked && data.lockedBy === user.email) {
          await updateDoc(ref, { locked: false, lockedBy: null });
          console.log("Vehículo desbloqueado:", id);
        }
      }
    } catch (error) {
      console.log("Error al desbloquear vehículo:", error);
    }
  };

  // Cargar observaciones personalizadas del aeropuerto
  const fetchObservations = async () => {
    if (!user.airport) return;
    
    setLoadingObservations(true);
    try {
      const q = query(
        collection(db, "observaciones"),
        where("airport", "==", user.airport)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const customOptions = snapshot.docs.map(doc => doc.data().text);
        // Combinar con las opciones predeterminadas, evitando duplicados
        const defaultOptions = ["Otro"];
        const combinedOptions = [...customOptions, ...defaultOptions.filter(
          opt => !customOptions.includes(opt)
        )];
        setObservationOptions(combinedOptions);
      }
    } catch (error) {
      console.error("Error al cargar observaciones:", error);
    } finally {
      setLoadingObservations(false);
    }
  };

  // 1) Cambiar de vehículo => desbloquea el anterior si lo habías bloqueado
  const handleSelectVehicle = async (val: string) => {
    // Resetear error
    setFormErrors(prev => ({ ...prev, vehicleId: false }));
    
    // Desbloquea el vehículo anterior si es distinto
    if (vehicleId && vehicleId !== val) {
      await unlockVehicle(vehicleId);
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
      setFormErrors(prev => ({ ...prev, fechaInicio: false }));
    }
  };

  const onChangeTimeInicio = (_: any, selectedTime?: Date) => {
    setShowTimePickerInicio(false);
    if (selectedTime) {
      const hh = String(selectedTime.getHours()).padStart(2, "0");
      const mm = String(selectedTime.getMinutes()).padStart(2, "0");
      setHoraInicio(`${hh}:${mm}`);
      setFormErrors(prev => ({ ...prev, horaInicio: false }));
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
      setFormErrors(prev => ({ ...prev, fechaFin: false }));
    }
  };

  const onChangeTimeFin = (_: any, selectedTime?: Date) => {
    setShowTimePickerFin(false);
    if (selectedTime) {
      const hh = String(selectedTime.getHours()).padStart(2, "0");
      const mm = String(selectedTime.getMinutes()).padStart(2, "0");
      setHoraFin(`${hh}:${mm}`);
      setFormErrors(prev => ({ ...prev, horaFin: false }));
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

  const handleKmInicialChange = (text: string) => {
    setKmInicial(text);
    setFormErrors(prev => ({ ...prev, kmInicial: false }));
  };

  const handleKmFinalChange = (text: string) => {
    setKmFinal(text);
    setFormErrors(prev => ({ ...prev, kmFinal: false }));
  };

  // NUEVO: Manejar selección múltiple de observaciones
  const toggleObservation = (observation: string) => {
    let newObservations = [...selectedObservations];
    
    if (newObservations.includes(observation)) {
      // Remover si ya está seleccionada
      newObservations = newObservations.filter(obs => obs !== observation);
    } else {
      // Agregar si no está seleccionada
      newObservations.push(observation);
    }
    
    setSelectedObservations(newObservations);
    
    // Actualizar el texto de observaciones con selecciones separadas por '/'
    if (newObservations.length > 0) {
      setObservaciones(newObservations.join(' / '));
    } else {
      setObservaciones('');
    }
  };

  // 4) Guardar Recorrido
  const handleSave = async () => {
    // Validación final
    if (
      !vehicleId ||
      !fechaInicio ||
      !horaInicio ||
      !fechaFin ||
      !horaFin ||
      !kmInicial ||
      !kmFinal
    ) {
      setFormErrors({
        vehicleId: !vehicleId,
        fechaInicio: !fechaInicio,
        horaInicio: !horaInicio,
        kmInicial: !kmInicial,
        fechaFin: !fechaFin,
        horaFin: !horaFin,
        kmFinal: !kmFinal
      });
      
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    
    if (Number(kmFinal) <= Number(kmInicial)) {
      setFormErrors(prev => ({ ...prev, kmFinal: true }));
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
      setSelectedObservations([]);
      // Volvemos al primer paso
      setCurrentStep(0);
      // Deseleccionamos el vehículo después de guardar
      setVehicleId("");

    } catch (error) {
      console.error("Error al guardar Recorrido:", error);
      Alert.alert("Error", "No se pudo guardar el recorrido");
    }
  };

  // Renderizar el paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Selección de Vehículo</Text>
            
            <Text style={styles.label}>Vehículo:</Text>
            <View style={[
              styles.pickerContainer,
              formErrors.vehicleId && styles.inputError
            ]}>
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
            
            {/* Muestra información del vehículo seleccionado */}
            {vehicleId && (
              <View style={styles.vehicleInfoCard}>
                <Text style={styles.vehicleInfoTitle}>Información del Vehículo</Text>
                <Text style={styles.vehicleInfoText}>
                  KM Actual: {kmInicial}
                </Text>
                <Text style={styles.vehicleInfoText}>
                  Nivel Combustible: {nivelCombustibleVehiculo}
                </Text>
              </View>
            )}
          </View>
        );
      
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Datos de Inicio</Text>
            
            {/* Selector de fecha/hora de inicio */}
            <DateTimeSelector
              date={fechaInicio}
              time={horaInicio}
              onDateChange={onChangeDateInicio}
              onTimeChange={onChangeTimeInicio}
              onClear={clearInicio}
              onSetNow={setNowInicio}
              label="Fecha/Hora Inicio"
            />
            
            {/* KM INICIAL */}
            <Text style={styles.label}>KM Inicial</Text>
            <TextInput
              style={[
                styles.input,
                formErrors.kmInicial && styles.inputError
              ]}
              placeholder="15000"
              value={kmInicial}
              onChangeText={handleKmInicialChange}
              keyboardType="numeric"
            />
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Datos de Fin</Text>
            
            {/* Selector de fecha/hora de fin */}
            <DateTimeSelector
              date={fechaFin}
              time={horaFin}
              onDateChange={onChangeDateFin}
              onTimeChange={onChangeTimeFin}
              onClear={clearFin}
              onSetNow={setNowFin}
              label="Fecha/Hora Fin"
            />
            
            {/* KM FINAL */}
            <Text style={styles.label}>KM Final</Text>
            <TextInput
              style={[
                styles.input,
                formErrors.kmFinal && styles.inputError
              ]}
              placeholder="KM finales"
              value={kmFinal}
              onChangeText={handleKmFinalChange}
              keyboardType="numeric"
            />
            
            {/* Mostrar distancia recorrida si ambos KM están completos */}
            {kmInicial && kmFinal && Number(kmFinal) > Number(kmInicial) && (
              <View style={styles.kmCalculationBox}>
                <Text style={styles.kmCalculationText}>
                  Distancia recorrida: {Number(kmFinal) - Number(kmInicial)} km
                </Text>
              </View>
            )}
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Observaciones y Combustible</Text>
            
            {/* OBSERVACIONES (Selección Múltiple) */}
            <Text style={styles.label}>Observaciones:</Text>
            {loadingObservations ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <View style={styles.observationsContainer}>
                {observationOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.observationOption,
                      selectedObservations.includes(option) && styles.observationSelected,
                    ]}
                    onPress={() => toggleObservation(option)}
                  >
                    <Text style={[
                      styles.observationText,
                      selectedObservations.includes(option) && styles.observationTextSelected,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observaciones seleccionadas o agrega comentarios adicionales"
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              numberOfLines={3}
            />
            
            {/* Selector visual de combustible */}
            <FuelLevelSelector
              value={nivelCombustibleRecorrido}
              onChange={setNivelCombustibleRecorrido}
              options={combustibleOptions}
            />
            
            {/* Resumen del recorrido */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen del Recorrido</Text>
              <Text style={styles.summaryText}>
                Vehículo: {vehicles.find(v => v.id === vehicleId)?.Dominio || ''}
              </Text>
              <Text style={styles.summaryText}>
                Inicio: {fechaInicio} {horaInicio}hs - KM: {kmInicial}
              </Text>
              <Text style={styles.summaryText}>
                Fin: {fechaFin} {horaFin}hs - KM: {kmFinal}
              </Text>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registrar Recorrido</Text>
      
      {/* Indicador de progreso */}
      <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
      
      {/* Contenido del paso actual */}
      {renderStep()}
      
      {/* Botones de navegación entre pasos */}
      <View style={styles.navigationButtons}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            <Text style={styles.buttonText}>Anterior</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < totalSteps - 1 && (
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <Text style={styles.buttonText}>Siguiente</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        
        {currentStep === totalSteps - 1 && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
            <Text style={styles.buttonText}>Guardar Recorrido</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

// Estilos para el componente principal
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#F4F6F9" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 15,
    textAlign: "center"
  },
  stepContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 15,
    textAlign: "center"
  },
  label: { 
    marginTop: 10, 
    marginBottom: 5,
    fontWeight: "600",
    color: "#333" 
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: "#fff"
  },
  picker: { 
    width: "100%",
    height: 50
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  inputDateTime: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginRight: 6,
    textAlign: "center",
    backgroundColor: "#fff"
  },
  iconButton: { 
    padding: 6 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  inputError: {
    borderColor: "red",
    backgroundColor: "#fff8f8"
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20
  },
  nextButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    marginLeft: "auto"
  },
  backButton: {
    backgroundColor: "#6c757d",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120
  },
  saveButton: {
    backgroundColor: "#28a745",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
    marginLeft: "auto"
  },
  buttonText: { 
    color: "#fff", 
    marginHorizontal: 8, 
    fontSize: 16,
    fontWeight: "500"
  },
  observationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  observationOption: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  observationSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  observationText: {
    fontSize: 14,
    color: "#333",
  },
  observationTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  vehicleInfoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF"
  },
  vehicleInfoTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 16
  },
  vehicleInfoText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#444"
  },
  kmCalculationBox: {
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    marginBottom: 15,
    alignItems: "center"
  },
  kmCalculationText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2e7d32"
  },
  summaryCard: {
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    marginBottom: 10
  },
  summaryTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
    color: "#0d47a1"
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#333"
  }
});

// Estilos para el indicador de progreso
const progressStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  stepCurrent: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  stepCompleted: {
    backgroundColor: '#7ED957',
    borderColor: '#7ED957',
  },
  stepText: {
    color: '#777',
    fontWeight: 'bold',
  },
  stepTextActive: {
    color: '#fff',
  },
  stepLine: {
    height: 2,
    width: width / 10,
    backgroundColor: '#ddd',
  },
  stepLineCompleted: {
    backgroundColor: '#7ED957',
  }
});

// Estilos para el selector de fecha/hora
const dtStyles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
    color: "#333"
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 15
  },
  displayText: {
    flex: 1,
    fontSize: 16
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 5,
    marginLeft: 5,
  }
});

// Estilos para el selector de combustible
const fuelStyles = StyleSheet.create({
  container: {
    marginVertical: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16
  },
  selected: {
    fontWeight: 'normal',
    marginBottom: 15,
    fontSize: 14,
    color: "#666"
  },
  fuelGauge: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
    height: 120,
    alignItems: 'flex-end',
  },
  fuelOption: {
    width: 30,
    backgroundColor: '#ddd',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 20
  },
  fuelSelected: {
    backgroundColor: '#FF9800',
  },
  fuelText: {
    fontSize: 10,
    color: '#555',
    fontWeight: 'bold'
  },
  fuelTextSelected: {
    color: '#fff'
  }
});