/**
 * Утилиты для защиты от XSS-атак
 */

/**
 * Очищает строку от потенциально опасных HTML-тегов и скриптов
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Очищает текстовый ввод, удаляя потенциально опасные символы
 */
export const sanitizeText = (input: string): string => {
  if (!input) return '';
  
  // Удаляем управляющие символы, но оставляем переносы строк и табы
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
};

/**
 * Очищает URL от JavaScript-протоколов и других опасных схем
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Блокируем опасные протоколы
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ];
  
  if (dangerousProtocols.some(protocol => trimmed.startsWith(protocol))) {
    return '';
  }
  
  return url;
};

/**
 * Очищает объект от XSS, рекурсивно обрабатывая все строковые поля
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    const value = obj[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

/**
 * Валидирует и очищает email
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  const trimmed = email.trim().toLowerCase();
  
  // Простая валидация email
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  return trimmed;
};

/**
 * Валидирует ID (только цифры и латиница)
 */
export const sanitizeId = (id: string): string => {
  if (!id) return '';
  
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * Очищает имя пользователя/экипажа (буквы, цифры, пробелы, дефисы)
 */
export const sanitizeName = (name: string): string => {
  if (!name) return '';
  
  // Разрешаем кириллицу, латиницу, цифры, пробелы, дефисы и точки
  return name.replace(/[^а-яА-ЯёЁa-zA-Z0-9\s.\-]/g, '').trim();
};

/**
 * Очищает адрес (разрешаем больше символов)
 */
export const sanitizeAddress = (address: string): string => {
  if (!address) return '';
  
  // Разрешаем кириллицу, латиницу, цифры, пробелы и базовые знаки препинания
  return sanitizeText(address).trim();
};

/**
 * Валидация номера телефона
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Оставляем только цифры, +, -, (, ), пробелы
  return phone.replace(/[^0-9+\-() ]/g, '').trim();
};
