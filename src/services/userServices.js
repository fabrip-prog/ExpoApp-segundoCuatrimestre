import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';


export const saveUser = async (uid, data) => {
    return setDoc(doc(db, 'usuarios', uid), data);
};


export const getUser = async (uid) => {
    const userRef = doc(db, 'usuarios', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();
};


/**
 * Actualiza campos específicos del documento del usuario.
 * Se utiliza para guardar la photoURL después de subir la imagen.
 *
 * @param {string} uid  — UID del usuario
 * @param {object} data — Campos a actualizar (ej: { photoURL: '...' })
 */
export const updateUser = async (uid, data) => {
    const userRef = doc(db, 'usuarios', uid);
    await updateDoc(userRef, data);
};
