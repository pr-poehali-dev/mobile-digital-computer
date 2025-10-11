import { getUserSettings } from './store';

// Создаем синтезированный звуковой сигнал для уведомлений
const createNotificationSound = (): HTMLAudioElement => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800; // Частота 800 Hz
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
  
  // Возвращаем пустой Audio элемент, так как Web Audio API не использует его
  return new Audio();
};

/**
 * Воспроизводит звук нового вызова для пользователя
 */
export const playNewCallSound = (userId: string): void => {
  const settings = getUserSettings(userId);
  
  if (!settings.soundOnNewCall) {
    return;
  }
  
  try {
    // Создаем аудио контекст для синтеза звука
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Первый тон (высокий)
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    oscillator1.frequency.value = 880; // Нота A5
    oscillator1.type = 'sine';
    
    gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.2);
    
    // Второй тон (низкий) через 0.15 секунды
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.value = 660; // Нота E5
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.3);
    }, 150);
    
  } catch (error) {
    console.error('Ошибка воспроизведения звука:', error);
  }
};

/**
 * Показывает уведомление о статусе, если включено в настройках
 */
export const showStatusNotification = (userId: string, message: string): boolean => {
  const settings = getUserSettings(userId);
  return settings.statusNotifications;
};
