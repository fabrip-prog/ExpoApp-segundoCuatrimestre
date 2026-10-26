import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const tasksCollection = collection(db, 'tareas');

// ── CREATE ──────────────────────────────────────────────────────────
// Guarda una nueva tarea vinculada al usuario que la creó.
export const createTask = (userId, titulo) =>
    addDoc(tasksCollection, {
        titulo: titulo.trim(),
        completada: false,
        userId,
        createdAt: serverTimestamp(),
    });

// ── READ ────────────────────────────────────────────────────────────
// Obtiene únicamente las tareas del usuario autenticado,
// ordenadas de la más reciente a la más antigua.
export const getTasks = async (userId) => {
    const q = query(tasksCollection, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs
        .map((taskDoc) => ({ id: taskDoc.id, ...taskDoc.data() }))
        .sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() ?? 0;
            const timeB = b.createdAt?.toMillis?.() ?? 0;
            return timeB - timeA;
        });
};

// ── UPDATE (estado) ─────────────────────────────────────────────────
// Cambia el campo "completada" de una tarea.
export const updateTask = (taskId, completada) =>
    updateDoc(doc(db, 'tareas', taskId), { completada });

// ── UPDATE (título) ─────────────────────────────────────────────────
// Modifica el título de una tarea existente.
export const updateTaskTitle = (taskId, titulo) =>
    updateDoc(doc(db, 'tareas', taskId), { titulo: titulo.trim() });

// ── DELETE ──────────────────────────────────────────────────────────
// Elimina una tarea por su identificador de Firestore.
export const deleteTask = (taskId) =>
    deleteDoc(doc(db, 'tareas', taskId));