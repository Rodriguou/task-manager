import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

// Importação do Serviço de Banco de Dados
import { DatabaseService } from '../database/DatabaseService';

export default function ListScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt'); // Padrão: data de criação

  // Carrega as tarefas do banco de dados (SQLite ou AsyncStorage)
  const loadTasks = async () => {
    try {
      const data = await DatabaseService.getTasks();
      setTasks(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Recarrega a lista sempre que a tela ganha foco (ex: ao voltar do formulário)
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  // Lógica de Deletar
  const handleDelete = (id) => {
    Alert.alert('Excluir', 'Deseja realmente apagar esta tarefa?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          await DatabaseService.deleteTask(id);
          loadTasks();
      }},
    ]);
  };

  // Lógica de Mudar Status (Ciclo: Não iniciada -> Em andamento -> Concluída)
  const handleStatusChange = async (task) => {
    let nextStatus = 'Não iniciada';
    if (task.status === 'Não iniciada') nextStatus = 'Em andamento';
    else if (task.status === 'Em andamento') nextStatus = 'Concluída';

    await DatabaseService.updateTaskStatus(task.id, nextStatus);
    loadTasks();
  };

  // Lógica de Ordenação
  const priorityOrder = { 'alta': 1, 'média': 2, 'baixa': 3 };
  
  const processedTasks = tasks
    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // Padrão: Mais recentes primeiro
    });

  // Renderização de cada Card de Tarefa
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.taskTitle}>{item.name}</Text>
        <View style={[styles.priorityBadge, styles[`badge_${item.priority}`]]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.taskDescription} numberOfLines={2}>
        {item.description || 'Sem descrição'}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.dateInfo}>Prazo: {new Date(item.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</Text>
        <TouchableOpacity 
          style={[styles.statusButton, styles[`status_${item.status.replace(/\s/g, '')}`]]}
          onPress={() => handleStatusChange(item)}
        >
          <Text style={styles.statusButtonText}>{item.status}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Form', { task: item })}>
          <MaterialIcons name="edit" size={24} color="#195efc" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <MaterialIcons name="delete" size={24} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Barra de Pesquisa */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar tarefas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Botões de Ordenação */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Ordenar por:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'createdAt' && styles.sortButtonActive]} 
            onPress={() => setSortBy('createdAt')}
          >
            <Text style={[styles.sortText, sortBy === 'createdAt' && styles.sortTextActive]}>Criação</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'dueDate' && styles.sortButtonActive]} 
            onPress={() => setSortBy('dueDate')}
          >
            <Text style={[styles.sortText, sortBy === 'dueDate' && styles.sortTextActive]}>Prazo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'priority' && styles.sortButtonActive]} 
            onPress={() => setSortBy('priority')}
          >
            <Text style={[styles.sortText, sortBy === 'priority' && styles.sortTextActive]}>Prioridade</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista de Tarefas */}
      <FlatList
        data={processedTasks}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma tarefa encontrada.</Text>
        }
      />

      {/* Botão Flutuante (FAB) para Adicionar */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('Form')}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// Estilos otimizados
import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9FE', padding: 15 },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D1DFFE'
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  sortContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sortLabel: { fontSize: 12, fontWeight: 'bold', color: '#000c36', marginRight: 10 },
  sortButton: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: '#D1DFFE', marginRight: 8 },
  sortButtonActive: { backgroundColor: '#195efc' },
  sortText: { fontSize: 11, color: '#000c36' },
  sortTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskTitle: { fontSize: 18, fontWeight: 'bold', color: '#000c36', flex: 1 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badge_baixa: { backgroundColor: '#E8F5E9' },
  badge_média: { backgroundColor: '#FFF3E0' },
  badge_alta: { backgroundColor: '#FFEBEE' },
  priorityText: { fontSize: 10, fontWeight: 'bold' },
  taskDescription: { fontSize: 14, color: '#666', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  dateInfo: { fontSize: 12, color: '#888' },
  statusButton: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  status_Nãoiniciada: { backgroundColor: '#eee' },
  status_Emandamento: { backgroundColor: '#E3F2FD' },
  status_Concluída: { backgroundColor: '#C8E6C9' },
  statusButtonText: { fontSize: 11, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 10 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#000c36', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});