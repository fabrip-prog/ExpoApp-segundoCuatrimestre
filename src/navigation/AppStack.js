import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen.js';
import LocationScreen from '../screens/LocationScreen';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />

      <Stack.Screen
        name="Location"
        component={LocationScreen}
        options={{ title: 'Ubicación' }}
      />

      <Stack.Screen
        name="Ubicacion"
        component={LocationScreen}
        options={{ title: 'Ubicación' }}
      />
    </Stack.Navigator>
  );
}
