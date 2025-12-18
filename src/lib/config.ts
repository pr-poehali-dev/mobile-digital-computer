// Конфигурация подключения к базе данных
export const DB_CONFIG = {
  // Автоматическое определение: если есть переменная окружения DATABASE_URL, используем БД
  useDatabase: import.meta.env.VITE_DATABASE_URL !== undefined,
  databaseUrl: import.meta.env.VITE_DATABASE_URL || '',
};

// Тип хранилища: 'database' или 'localStorage'
export const STORAGE_TYPE: 'database' | 'localStorage' = DB_CONFIG.useDatabase ? 'database' : 'localStorage';

console.log(`[Config] Используется хранилище: ${STORAGE_TYPE}`);
