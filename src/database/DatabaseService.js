import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'taskmanager.db';
const STORAGE_KEY = '@tasks_db';

// Inicializa o SQLite apenas no mobile
let db = null;
if (Platform.OS !== 'web') {
  db = SQLite.openDatabaseSync(DB_NAME);
}

export const DatabaseService = {
  
  // INITIALIZE DATABASE
  initDB: async () => {
    if (Platform.OS === 'web') {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      if (!existingData) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
      console.log('Web Database (AsyncStorage) initialized!');
    } else {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          priority TEXT,
          createdAt TEXT,
          dueDate TEXT,
          status TEXT DEFAULT 'Não iniciada'
        );
      `);
      console.log('Mobile Database (SQLite) initialized!');
    }
  },

  // CREATE TASK
  addTask: async (name, description, priority, dueDate) => {
    const createdAt = new Date().toISOString().split('T')[0]; 
    
    if (Platform.OS === 'web') {
      const tasks = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
      const newTask = {
        id: Date.now(), 
        name,
        description,
        priority: priority || 'baixa',
        createdAt,
        dueDate,
        status: 'Não iniciada'
      };
      tasks.push(newTask);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return newTask.id;
    } else {
      const result = await db.runAsync(
        'INSERT INTO tasks (name, description, priority, createdAt, dueDate, status) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description, priority || 'baixa', createdAt, dueDate, 'Não iniciada']
      );
      return result.lastInsertRowId;
    }
  },

  // READ ALL TASKS
  getTasks: async () => {
    if (Platform.OS === 'web') {
      const tasks = await AsyncStorage.getItem(STORAGE_KEY);
      return tasks ? JSON.parse(tasks) : [];
    } else {
      return await db.getAllAsync('SELECT * FROM tasks');
    }
  },

  // UPDATE TASK STATUS
  updateTaskStatus: async (id, newStatus) => {
    if (Platform.OS === 'web') {
      let tasks = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
      tasks = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } else {
      await db.runAsync('UPDATE tasks SET status = ? WHERE id = ?', [newStatus, id]);
    }
  },

  // UPDATE ENTIRE TASK (Edit)
  updateTask: async (id, name, description, priority, dueDate) => {
    if (Platform.OS === 'web') {
      let tasks = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
      tasks = tasks.map(t => t.id === id ? { ...t, name, description, priority, dueDate } : t);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } else {
      await db.runAsync(
        'UPDATE tasks SET name = ?, description = ?, priority = ?, dueDate = ? WHERE id = ?',
        [name, description, priority, dueDate, id]
      );
    }
  },

  // DELETE TASK
  deleteTask: async (id) => {
    if (Platform.OS === 'web') {
      let tasks = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY));
      tasks = tasks.filter(t => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } else {
      await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
    }
  }
};