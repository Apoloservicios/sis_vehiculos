// src/navigation/AppNavigator.tsx
import React, { useEffect } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../screens/HomeScreen";
import VehiclesScreen from "../screens/VehiclesScreen";
import RegisterRecorrido from "../screens/RegisterRecorrido";
import RecorridosScreen from "../screens/RecorridosScreen"; // Asegúrate de importarlo
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";
import { logout } from "../redux/authSlice";
import { fetchVehicles } from "../redux/vehiclesSlice";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Drawer = createDrawerNavigator();

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
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchVehicles()); // Cargar vehiculos cuando user existe
    }
  }, [user]);

  return (
    <NavigationContainer>
      {user ? (
        <Drawer.Navigator screenOptions={{ headerRight: () => <CustomLogoutButton /> }}>
          <Drawer.Screen name="Inicio" component={HomeScreen} />
          <Drawer.Screen name="Administrar Vehículos" component={VehiclesScreen} />
          <Drawer.Screen name="Registrar Recorrido" component={RegisterRecorrido} />
          <Drawer.Screen name="Recorridos" component={RecorridosScreen} />
        </Drawer.Navigator>
      ) : (
        <Drawer.Navigator screenOptions={{ headerShown: false }}>
          <Drawer.Screen name="Login" component={LoginScreen} />
          <Drawer.Screen name="Register" component={RegisterScreen} />
        </Drawer.Navigator>
      )}
    </NavigationContainer>
  );
}
