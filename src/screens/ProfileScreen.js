import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { saveUser, getUser, updateUser } from '../services/userServices';
import { uploadProfileImage } from '../services/storageService';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Guardar datos básicos del usuario al entrar por primera vez
  useEffect(() => {
    if (user?.uid) {
      saveUser(user.uid, { email: user.email, uid: user.uid });
    }
  }, [user]);

  // Cargar perfil del usuario (incluye photoURL si existe)
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        return;
      }
      const data = await getUser(user.uid);
      setProfile(data);
    };

    loadProfile();
  }, [user]);

  // ── PASO 1: Seleccionar imagen del dispositivo ──────────────────
  const handlePickImage = async () => {
    // Solicitar permiso para acceder a la galería
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para cambiar la foto de perfil.'
      );
      return;
    }

    // Abrir la galería para seleccionar una imagen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    // Si el usuario no canceló, subir la imagen
    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      await handleUploadImage(localUri);
    }
  };

  // ── PASOS 2-6: Subir imagen y actualizar Firestore ─────────────
  const handleUploadImage = async (imageUri) => {
    if (!user) return;

    setUploading(true);
    try {
      // Pasos 2-5: storageService se encarga de:
      //   fetch(uri) → blob → ref() → uploadBytes() → getDownloadURL()
      const photoURL = await uploadProfileImage(imageUri, user.uid);

      // Paso 6: Actualizar el documento del usuario en Firestore
      await updateUser(user.uid, { photoURL });

      // Actualizar el estado local para reflejar el cambio
      setProfile((prev) => ({ ...prev, photoURL }));

      Alert.alert('Éxito', 'Foto de perfil actualizada correctamente.');
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      Alert.alert('Error', 'No se pudo subir la foto de perfil.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>

      {/* ── Imagen de perfil ────────────────────────────────────── */}
      <Pressable onPress={handlePickImage} disabled={uploading}>
        <View style={styles.imageContainer}>
          {profile?.photoURL ? (
            <Image
              source={{ uri: profile.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>📷</Text>
              <Text style={styles.imagePlaceholderLabel}>Subir foto</Text>
            </View>
          )}
        </View>
      </Pressable>

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.uploadingText}>Subiendo foto...</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.changePhotoButton,
          pressed && styles.changePhotoButtonPressed,
        ]}
        onPress={handlePickImage}
        disabled={uploading}
      >
        <Text style={styles.changePhotoButtonText}>
          📷 Cambiar foto de perfil
        </Text>
      </Pressable>

      {/* ── Datos del usuario ───────────────────────────────────── */}
      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>
        {user?.email || 'No disponible'}
      </Text>

      <Text style={styles.label}>UID</Text>
      <Text style={styles.value}>
        {user?.uid || 'No disponible'}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.locationButton,
          pressed && styles.locationButtonPressed,
        ]}
        onPress={() => navigation.navigate('Ubicacion')}
      >
        <Text style={styles.locationButtonText}>
          📍 Ver mi ubicación
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.profileButton,
          pressed && styles.profileButtonPressed,
        ]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.profileButtonText}>
          ← Volver al inicio
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  title: {
    marginBottom: 20,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
  },
  // ── Estilos de la imagen de perfil ─────────────────────────────
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#cbd5e1',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 36,
  },
  imagePlaceholderLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  uploadingText: {
    color: '#2563eb',
    fontSize: 14,
  },
  changePhotoButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  changePhotoButtonPressed: {
    backgroundColor: '#1d4ed8',
  },
  changePhotoButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  // ── Estilos del resto ─────────────────────────────────────────
  label: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    alignSelf: 'flex-start',
  },
  value: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#111827',
    width: '100%',
  },
  locationButton: {
    marginTop: 24,
    backgroundColor: '#0284c7',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  locationButtonPressed: {
    backgroundColor: '#0369a1',
  },
  locationButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  profileButton: {
    marginTop: 12,
    backgroundColor: '#e2e8f0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  profileButtonPressed: {
    backgroundColor: '#cbd5e1',
  },
  profileButtonText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 15,
  },
});
