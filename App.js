import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importação do nosso Serviço de Banco de Dados Híbrido
import { DatabaseService } from './src/database/DatabaseService';

// Importação das Telas
import ListScreen from './src/screens/ListScreen';
import FormScreen from './src/screens/FormScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  // Inicializa o banco de dados assim que o app abre
  useEffect(() => {
    async function setupDatabase() {
      await DatabaseService.initDB();
      setIsDbReady(true);
    }
    setupDatabase();
  }, []);

  // Tela de carregamento enquanto o banco de dados é configurado
  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#195efc" />
      </View>
    );
  }

  // Estrutura de Navegação
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="List"
        screenOptions={{
          headerStyle: { backgroundColor: '#000c36' }, // Cabeçalho azul escuro
          headerTintColor: '#fff', // Texto branco
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="List"
          component={ListScreen}
          options={{ title: 'Minhas Tarefas' }}
        />
        <Stack.Screen
          name="Form"
          component={FormScreen}
          options={{ title: 'Nova Tarefa' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F9FE',
  }
});