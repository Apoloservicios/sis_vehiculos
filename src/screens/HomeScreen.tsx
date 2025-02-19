import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { auth } from "../../firebaseConfig";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;
type HomeScreenRouteProp = RouteProp<RootStackParamList, "Home">;

interface Props {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const handleLogout = async () => {
    await auth.signOut();
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>

      <Card style={styles.card}>
        <Card.Title title="Gestión de Vehículos" subtitle="Aeropuerto" />
        <Card.Content>
          <Text>Consulta y administra el estado de los vehículos.</Text>
        </Card.Content>
      </Card>

      <Button mode="contained" onPress={handleLogout} style={styles.button}>
        Cerrar Sesión
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    width: "100%",
    marginBottom: 20,
    backgroundColor: "#ffffff",
    elevation: 4, // Sombras en Android
  },
  button: {
    marginTop: 10,
    width: "100%",
  },
});

export default HomeScreen;
