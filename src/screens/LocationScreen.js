import React, { useState, useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { getCurrentLocation, watchLocation } from '../services/locationService';

export default function LocationScreen({ navigation }) {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tracking, setTracking] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const subscriptionRef = useRef(null);

    // Limpieza automática al desmontar el componente para evitar fugas de memoria
    useEffect(() => {
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
            }
        };
    }, []);

    // ── Obtener ubicación única ─────────────────────────────────────
    const obtenerUbicacion = async () => {
        try {
            setLoading(true);

            const coords = await getCurrentLocation();

            setLocation(coords);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (error) {
            console.log(error);
            if (error.message === 'LOCATION_PERMISSION_DENIED') {
                Alert.alert('Permiso denegado', 'Necesitamos permiso para obtener tu ubicación.');
            } else if (error.message === 'LOCATION_DISABLED') {
                Alert.alert('Ubicación desactivada', 'Activa los servicios de ubicación en tu dispositivo.');
            } else {
                Alert.alert('Error', 'No se pudo obtener la ubicación.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Iniciar / Detener seguimiento en tiempo real ────────────────
    const toggleSeguimiento = async () => {
        if (tracking) {
            // Detener el seguimiento
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
            }
            setTracking(false);
        } else {
            // Iniciar el seguimiento
            try {
                setLoading(true);

                const sub = await watchLocation((coords) => {
                    setLocation(coords);
                    setLastUpdated(new Date().toLocaleTimeString());
                });

                subscriptionRef.current = sub;
                setTracking(true);
            } catch (error) {
                console.log(error);
                if (error.message === 'LOCATION_PERMISSION_DENIED') {
                    Alert.alert('Permiso denegado', 'Necesitamos permiso para obtener tu ubicación.');
                } else if (error.message === 'LOCATION_DISABLED') {
                    Alert.alert('Ubicación desactivada', 'Activa los servicios de ubicación en tu dispositivo.');
                } else {
                    Alert.alert('Error', 'No se pudo iniciar el seguimiento.');
                }
            } finally {
                setLoading(false);
            }
        }
    };

    const handleGoBack = () => {
        if (subscriptionRef.current) {
            subscriptionRef.current.remove();
            subscriptionRef.current = null;
            setTracking(false);
        }

        if (navigation?.canGoBack && navigation.canGoBack()) {
            navigation.goBack();
        } else if (navigation?.navigate) {
            navigation.navigate('Inicio');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.badge}>GPS / GEOLOCALIZACIÓN</Text>
                <Text style={styles.title}>Mi Ubicación</Text>
                <Text style={styles.subtitle}>
                    Obtén o rastrea tus coordenadas mediante el sensor GPS.
                </Text>

                {/* Estado del seguimiento */}
                <View style={[styles.statusBox, tracking ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, tracking ? styles.statusTextActive : styles.statusTextInactive]}>
                        {tracking ? '🟢 Rastreo activo (cada 10 metros)' : '⚪ Rastreo en tiempo real inactivo'}
                    </Text>
                </View>

                {/* Botón de seguimiento en tiempo real */}
                <Pressable
                    style={({ pressed }) => [
                        tracking ? styles.trackStopButton : styles.trackStartButton,
                        loading && styles.buttonDisabled,
                        pressed && !loading && { opacity: 0.85 },
                    ]}
                    onPress={toggleSeguimiento}
                    disabled={loading}
                >
                    {loading && tracking ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {tracking ? '⏹ Detener seguimiento' : '📡 Iniciar seguimiento en tiempo real'}
                        </Text>
                    )}
                </Pressable>

                {/* Botón de lectura única */}
                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        loading && !tracking && styles.buttonDisabled,
                        pressed && !loading && styles.buttonPressed,
                    ]}
                    onPress={obtenerUbicacion}
                    disabled={loading}
                >
                    {loading && !tracking ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {location ? '📍 Actualizar ubicación actual' : '📍 Obtener ubicación actual'}
                        </Text>
                    )}
                </Pressable>

                {/* Tarjeta con los datos de ubicación */}
                {location && (
                    <View style={styles.locationContainer}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Latitud:</Text>
                            <Text style={styles.infoValue}>{location.latitude}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Longitud:</Text>
                            <Text style={styles.infoValue}>{location.longitude}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Precisión:</Text>
                            <Text style={styles.infoValue}>
                                {location.accuracy != null
                                    ? `${Number(location.accuracy).toFixed(1)} metros`
                                    : 'No disponible'}
                            </Text>
                        </View>

                        {lastUpdated && (
                            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 4 }]}>
                                <Text style={styles.infoLabel}>Última lectura:</Text>
                                <Text style={[styles.infoValue, { fontSize: 13, color: '#2563eb' }]}>{lastUpdated}</Text>
                            </View>
                        )}
                    </View>
                )}

                <Pressable
                    style={({ pressed }) => [
                        styles.backButton,
                        pressed && styles.backButtonPressed,
                    ]}
                    onPress={handleGoBack}
                >
                    <Text style={styles.backButtonText}>← Volver al inicio</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#1e293b',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.08,
                shadowRadius: 18,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
            },
        }),
    },
    badge: {
        alignSelf: 'center',
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        borderRadius: 20,
        borderWidth: 1,
        color: '#2563eb',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 14,
        overflow: 'hidden',
        paddingHorizontal: 12,
        paddingVertical: 5,
        textAlign: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    statusBox: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 16,
        alignItems: 'center',
    },
    statusActive: {
        backgroundColor: '#ecfdf5',
        borderColor: '#a7f3d0',
        borderWidth: 1,
    },
    statusInactive: {
        backgroundColor: '#f1f5f9',
        borderColor: '#e2e8f0',
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    statusTextActive: {
        color: '#059669',
    },
    statusTextInactive: {
        color: '#64748b',
    },
    trackStartButton: {
        backgroundColor: '#059669',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    trackStopButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonPressed: {
        backgroundColor: '#1d4ed8',
        transform: [{ scale: 0.99 }],
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    locationContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },
    backButton: {
        backgroundColor: '#e2e8f0',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonPressed: {
        backgroundColor: '#cbd5e1',
    },
    backButtonText: {
        color: '#334155',
        fontSize: 15,
        fontWeight: '600',
    },
});
