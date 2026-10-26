import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

/**
 * Sube una imagen de perfil a Firebase Storage y devuelve la URL remota.
 *
 * Flujo interno:
 *   URI local  →  fetch()  →  Blob  →  ref()  →  uploadBytes()  →  getDownloadURL()
 *
 * @param {string} imageUri  — URI local obtenida de expo-image-picker
 * @param {string} userId    — UID del usuario autenticado
 * @returns {Promise<string>} — URL pública de la imagen subida
 */
export const uploadProfileImage = async (imageUri, userId) => {
    // 1. Convertir la URI local a Blob mediante fetch()
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // 2. Crear la referencia de almacenamiento con la ruta única del usuario
    const imageRef = ref(storage, `profile-images/${userId}`);

    // 3. Subir los datos binarios a Firebase Storage
    await uploadBytes(imageRef, blob);

    // 4. Obtener y devolver la URL pública remota
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
};
