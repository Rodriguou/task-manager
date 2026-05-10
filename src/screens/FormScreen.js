import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Importação do Serviço de Banco de Dados
import { DatabaseService } from '../database/DatabaseService';

export default function FormScreen({ navigation, route }) {
  // Se receber uma tarefa por parâmetro, estamos no modo de Edição
  const editingTask = route.params?.task;

  // Estados do Formulário
  const [name, setName] = useState(editingTask?.name || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [priority, setPriority] = useState(editingTask?.priority || 'baixa');
  
  // Tratamento da Data
  const [dueDate, setDueDate] = useState(
    editingTask ? new Date(editingTask.dueDate + 'T12:00:00') : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Função para lidar com a seleção de data no calendário Mobile
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  // Função de Validação e Salvamento
  const handleSave = async () => {
    // 1. Validação de Nome Vazio
    if (!name.trim()) {
      Alert.alert('Atenção', 'O nome da tarefa é obrigatório.');
      return;
    }

    // 2. Validação de Data Passada (Apenas para novas tarefas)
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const selectedDate = new Date(dueDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (!editingTask && selectedDate < today) {
      Alert.alert('Atenção', 'A data limite não pode ser anterior ao dia de hoje.');
      return;
    }

    // Formata a data para YYYY-MM-DD
    const formattedDate = dueDate.toISOString().split('T')[0];

    try {
      if (editingTask) {
        // UPDATE (Editar)
        await DatabaseService.updateTask(editingTask.id, name, description, priority, formattedDate);
      } else {
        // CREATE (Nova Tarefa)
        await DatabaseService.addTask(name, description, priority, formattedDate);
      }
      
      // Volta para a tela de Lista após salvar
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar a tarefa.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* NOME */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>NOME DA TAREFA *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Estudar React Native"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* DESCRIÇÃO */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>DESCRIÇÃO (Opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Detalhes adicionais..."
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* PRIORIDADE */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>PRIORIDADE</Text>
        <View style={styles.priorityContainer}>
          {['baixa', 'média', 'alta'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityButton,
                priority === p && styles.priorityButtonActive
              ]}
              onPress={() => setPriority(p)}
            >
              <Text style={[
                styles.priorityText,
                priority === p && styles.priorityTextActive
              ]}>
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* DATA LIMITE HÍBRIDA (WEB / MOBILE) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>DATA LIMITE *</Text>
        
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={dueDate.toISOString().split('T')[0]}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              if (e.target.value) {
                setDueDate(new Date(e.target.value + 'T12:00:00'));
              }
            }}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #D1DFFE',
              fontSize: '16px',
              color: '#333',
              backgroundColor: '#fff',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        ) : (
          <>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{dueDate.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
          </>
        )}
      </View>

      {/* BOTÃO SALVAR */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>SALVAR TAREFA</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9FE',
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000c36',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1DFFE',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1DFFE',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#195efc',
    borderColor: '#195efc',
  },
  priorityText: {
    color: '#000c36',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priorityTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#000c36',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});