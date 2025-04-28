// src/navigation/AppNavigator.tsx (modificado)
import React, { useEffect } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../screens/HomeScreen";
import VehiclesScreen from "../screens/VehiclesScreen";
import RegisterRecorrido from "../screens/RegisterRecorrido";
import RecorridosScreen from "../screens/RecorridosScreen";
import ReportesRecorridos from "../screens/ReportesRecorridos";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ObservationsManagementScreen from "../screens/ObservationsManagementScreen";
import UsersManagementScreen from "../screens/UsersManagementScreen";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import { logout } from "../redux/authSlice";
import { fetchVehicles } from "../redux/vehiclesSlice";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerParamList } from "./types";

// Actualizar tipos en types.ts
// export type DrawerParamList = {
//   Inicio: undefined;
//   Login: undefined;
//   Register: undefined;
//   Recorridos: undefined;
//   "Administrar Vehículos": undefined;
//   "Registrar Recorrido": undefined;
//   "Reportes Recorridos": undefined;
//   "Gestión de Observaciones": undefined;
//   "Gestión de Usuarios": undefined;
// };

const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomLogoutButton() {
  const dispatch = useDispatch();
  return (
    <TouchableOpacity style={{ marginRight: 15 }} onPress={() => dispatch(logout())}>
      <MaterialCommunityIcons name="exit-to-app" size={24} color="red" />
    </TouchableOpacity>
  );
}

export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user.uid) {
      dispatch(fetchVehicles());
    }
  }, [user.uid]);

  return (
    <NavigationContainer>
      {user.uid ? (
        user.role === "admin" ? (
          // Drawer para ADMIN (actualizado con nuevas pantallas)
          <Drawer.Navigator
            initialRouteName="Inicio"
            screenOptions={{
              headerRight: () => <CustomLogoutButton />,
            }}
          >
            <Drawer.Screen name="Inicio" component={HomeScreen} />
            <Drawer.Screen name="Administrar Vehículos" component={VehiclesScreen} />
            <Drawer.Screen name="Registrar Recorrido" component={RegisterRecorrido} />
            <Drawer.Screen name="Recorridos" component={RecorridosScreen} />
            <Drawer.Screen name="Reportes Recorridos" component={ReportesRecorridos} />
            <Drawer.Screen name="Gestión de Observaciones" component={ObservationsManagementScreen} />
            <Drawer.Screen name="Gestión de Usuarios" component={UsersManagementScreen} />
          </Drawer.Navigator>
        ) : (
          // Drawer para USER (sin cambios)
          <Drawer.Navigator
            initialRouteName="Inicio"
            screenOptions={{
              headerRight: () => <CustomLogoutButton />,
            }}
          >
            <Drawer.Screen name="Inicio" component={HomeScreen} />
            <Drawer.Screen name="Registrar Recorrido" component={RegisterRecorrido} />
            <Drawer.Screen name="Recorridos" component={RecorridosScreen} />
            <Drawer.Screen name="Reportes Recorridos" component={ReportesRecorridos} />
          </Drawer.Navigator>
        )
      ) : (
        // Drawer para NO LOGUEADO (sin cambios)
        <Drawer.Navigator screenOptions={{ headerShown: false }}>
          <Drawer.Screen name="Login" component={LoginScreen} />
          <Drawer.Screen name="Register" component={RegisterScreen} />
        </Drawer.Navigator>
      )}
    </NavigationContainer>
  );
}