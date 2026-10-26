import {
    Alert,
    Pressable,
    FlatList,
    Text,
    TextInput,
    View,
    ActivityIndicator,
    Modal,
    Platform,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/authService';
import { styles } from '../styles/HomeStyles';

// ── Servicio centralizado de tareas ─────────────────────────────────
import {
    createTask,
    getTasks,
    updateTask,
    updateTaskTitle,
    deleteTask,
} from '../services/taskServices';

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();

    // ── State ───────────────────────────────────────────────────────
    const [titulo, setTitulo] = useState('');
    const [saving, setSaving] = useState(false);
    const [tareas, setTareas] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);

    // Estado para el modal de edición de título
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    // ── Sincronizar state con Firestore ─────────────────────────────
    const fetchTareas = useCallback(async () => {
        if (!user) return;
        setLoadingTasks(true);
        try {
            const data = await getTasks(user.uid);
            setTareas(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudieron cargar las tareas.');
        } finally {
            setLoadingTasks(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTareas();
    }, [fetchTareas]);

    // ── Crear tarea ─────────────────────────────────────────────────
    const handleSaveTask = async () => {
        if (!titulo.trim()) return;
        if (!user) {
            Alert.alert('Error', 'Debes iniciar sesión para guardar tareas.');
            return;
        }

        setSaving(true);
        try {
            await createTask(user.uid, titulo);
            setTitulo('');
            Alert.alert('Éxito', 'Tarea guardada correctamente.');
            await fetchTareas(); // Sincronizar con Firestore
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo guardar la tarea.');
        } finally {
            setSaving(false);
        }
    };

    // ── Cambiar estado completada ───────────────────────────────────
    const handleToggleCompleted = async (task) => {
        try {
            await updateTask(task.id, !task.completada);
            await fetchTareas(); // Sincronizar con Firestore
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo actualizar el estado de la tarea.');
        }
    };

    // ── Modificar título ────────────────────────────────────────────
    const openEditModal = (task) => {
        setEditingTask(task);
        setEditTitle(task.titulo);
        setEditModalVisible(true);
    };

    const handleUpdateTitle = async () => {
        if (!editTitle.trim() || !editingTask) return;
        try {
            await updateTaskTitle(editingTask.id, editTitle);
            setEditModalVisible(false);
            setEditingTask(null);
            setEditTitle('');
            await fetchTareas(); // Sincronizar con Firestore
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo actualizar el título.');
        }
    };

    // ── Eliminar tarea (con confirmación) ───────────────────────────
    const handleDeleteTask = (task) => {
        const doDelete = async () => {
            try {
                await deleteTask(task.id);
                await fetchTareas(); // Sincronizar con Firestore
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'No se pudo eliminar la tarea.');
            }
        };

        if (Platform.OS === 'web') {
            // En web, Alert.alert no soporta botones con callbacks
            const confirmed = window.confirm(
                `¿Estás seguro de que querés eliminar "${task.titulo}"?`
            );
            if (confirmed) doDelete();
        } else {
            Alert.alert(
                'Eliminar tarea',
                `¿Estás seguro de que querés eliminar "${task.titulo}"?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: doDelete },
                ],
            );
        }
    };

    // ── Logout ──────────────────────────────────────────────────────
    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'No se pudo cerrar la sesión.');
        }
    };

    // ── Render de cada tarea ────────────────────────────────────────
    const renderTarea = ({ item }) => (
        <View style={{
            backgroundColor: '#fff',
            padding: 16,
            borderRadius: 12,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: '#e2e8f0',
        }}>
            {/* Fila superior: título + estado */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text
                    style={{
                        fontSize: 16,
                        color: '#1e293b',
                        flex: 1,
                        marginRight: 8,
                        textDecorationLine: item.completada ? 'line-through' : 'none',
                    }}
                    numberOfLines={2}
                >
                    {item.titulo}
                </Text>
                <Text style={{
                    fontSize: 12,
                    color: item.completada ? '#10b981' : '#f59e0b',
                    fontWeight: 'bold',
                }}>
                    {item.completada ? '✅ Completada' : '⏳ Pendiente'}
                </Text>
            </View>

            {/* Fila inferior: botones de acción */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Botón completar / descompletar */}
                <Pressable
                    style={({ pressed }) => [
                        {
                            flex: 1,
                            backgroundColor: item.completada ? '#f59e0b' : '#10b981',
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                        },
                        pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleToggleCompleted(item)}
                >
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                        {item.completada ? 'Desmarcar' : 'Completar'}
                    </Text>
                </Pressable>

                {/* Botón editar título */}
                <Pressable
                    style={({ pressed }) => [
                        {
                            flex: 1,
                            backgroundColor: '#3b82f6',
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                        },
                        pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => openEditModal(item)}
                >
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                        ✏️ Editar
                    </Text>
                </Pressable>

                {/* Botón eliminar */}
                <Pressable
                    style={({ pressed }) => [
                        {
                            flex: 1,
                            backgroundColor: '#ef4444',
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                        },
                        pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleDeleteTask(item)}
                >
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                        🗑️ Eliminar
                    </Text>
                </Pressable>
            </View>
        </View>
    );

    // ── Header de la lista (JSX directo, NO función componente) ────
    // Si fuera () => (...), React lo trataría como un componente nuevo
    // en cada render y desmontaría el TextInput (perdiendo el foco).
    const listHeader = (
        <View>
            <View style={styles.header}>
                <Text style={styles.badge}>Sesión Activa</Text>
                <Text style={styles.title}>¡Hola de nuevo!</Text>
                <Text style={styles.subtitle}>Has iniciado sesión con éxito en Firebase.</Text>
            </View>

            {/* Formulario nueva tarea */}
            <View style={{ marginBottom: 20, width: '100%' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#1e293b' }}>
                    Nueva Tarea
                </Text>
                <TextInput
                    style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 16,
                        color: '#1e293b',
                        marginBottom: 12,
                    }}
                    placeholder="Escribe el título de la tarea..."
                    placeholderTextColor="#94a3b8"
                    value={titulo}
                    onChangeText={setTitulo}
                />
                <Pressable
                    style={({ pressed }) => [
                        {
                            backgroundColor: '#2563eb',
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center',
                        },
                        pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleSaveTask}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                            Guardar Tarea
                        </Text>
                    )}
                </Pressable>
            </View>

            {/* Encabezado de la sección "Mis Tareas" */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', flex: 1 }}>
                    Mis Tareas
                </Text>
                {loadingTasks && <ActivityIndicator size="small" color="#2563eb" />}
            </View>
        </View>
    );

    // ── Footer de la lista ──────────────────────────────────────────
    const listFooter = (
        <View style={{ marginTop: 20 }}>
            <Pressable
                style={({ pressed }) => [
                    styles.profileButton || {
                        backgroundColor: '#3b82f6',
                        padding: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                        marginBottom: 12,
                    },
                    pressed && (styles.profileButtonPressed || { opacity: 0.8 }),
                ]}
                onPress={() => navigation.navigate('Perfil')}
            >
                <Text style={styles.profileButtonText || { color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    Ver mi perfil
                </Text>
            </Pressable>

            <Pressable
                style={({ pressed }) => [
                    {
                        backgroundColor: '#0284c7',
                        padding: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                        marginBottom: 12,
                    },
                    pressed && { opacity: 0.8 },
                ]}
                onPress={() => navigation.navigate('Ubicacion')}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    📍 Ver mi ubicación
                </Text>
            </Pressable>

            <Pressable
                style={({ pressed }) => [
                    styles.logoutButton,
                    pressed && styles.logoutButtonPressed,
                ]}
                onPress={handleLogout}
            >
                <Text style={styles.logoutButtonText}>
                    Cerrar sesión
                </Text>
            </Pressable>
        </View>
    );

    // ── Componente vacío ────────────────────────────────────────────
    const listEmpty = loadingTasks ? (
        <View style={{ alignItems: 'center', marginVertical: 40 }}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={{ color: '#64748b', marginTop: 12, fontSize: 14 }}>
                Cargando tareas...
            </Text>
        </View>
    ) : (
        <View style={{ alignItems: 'center', marginVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📋</Text>
            <Text style={{ textAlign: 'center', color: '#64748b', fontSize: 15, fontWeight: '500' }}>
                No tienes tareas guardadas aún.
            </Text>
            <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                ¡Crea una nueva tarea arriba para comenzar!
            </Text>
        </View>
    );

    // ── Render principal ────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <FlatList
                data={tareas}
                keyExtractor={(item) => item.id}
                renderItem={renderTarea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={listHeader}
                ListFooterComponent={listFooter}
                ListEmptyComponent={listEmpty}
            />

            {/* ── Modal para editar título ─────────────────────────── */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 24,
                }}>
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        padding: 24,
                        width: '100%',
                        maxWidth: 400,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 }}>
                            Editar Tarea
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: '#f8fafc',
                                borderWidth: 1,
                                borderColor: '#e2e8f0',
                                borderRadius: 12,
                                padding: 14,
                                fontSize: 16,
                                color: '#1e293b',
                                marginBottom: 16,
                            }}
                            placeholder="Nuevo título..."
                            placeholderTextColor="#94a3b8"
                            value={editTitle}
                            onChangeText={setEditTitle}
                            autoFocus
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Pressable
                                style={({ pressed }) => [
                                    {
                                        flex: 1,
                                        backgroundColor: '#e2e8f0',
                                        paddingVertical: 12,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                    },
                                    pressed && { opacity: 0.8 },
                                ]}
                                onPress={() => {
                                    setEditModalVisible(false);
                                    setEditingTask(null);
                                    setEditTitle('');
                                }}
                            >
                                <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 15 }}>
                                    Cancelar
                                </Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    {
                                        flex: 1,
                                        backgroundColor: '#2563eb',
                                        paddingVertical: 12,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                    },
                                    pressed && { opacity: 0.8 },
                                ]}
                                onPress={handleUpdateTitle}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
                                    Guardar
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
