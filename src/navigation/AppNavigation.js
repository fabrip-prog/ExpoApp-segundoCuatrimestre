import { useEffect, useState } from 'react';

import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LocationScreen from '../screens/LocationScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { user, checkingSession } = useContext(AuthContext);

    if (checkingSession) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color="#2563eb"
                />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? (
                // Stack para usuarios autenticados.
                <Stack.Navigator
                    initialRouteName="Inicio"
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Stack.Screen
                        name="Inicio"
                        component={HomeScreen}
                    />

                    <Stack.Screen
                        name="Perfil"
                        component={ProfileScreen}
                    />

                    <Stack.Screen
                        name="Ubicacion"
                        component={LocationScreen}
                    />

                    <Stack.Screen
                        name="Location"
                        component={LocationScreen}
                    />
                </Stack.Navigator>
            ) : (
                // Stack para usuarios no autenticados.
                <Stack.Navigator
                    initialRouteName="Login"
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                    />

                    <Stack.Screen
                        name="Registro"
                        component={RegisterScreen}
                    />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
});
