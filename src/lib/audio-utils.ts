export interface AlarmSound {
  play: () => void;
  stop: () => void;
  isPlaying: boolean;
}

export function createAlarmSound(config: {
  frequency: number;
  duration: number;
  pattern?: 'continuous' | 'beep';
  interval?: number;
}): AlarmSound {
  let audioContext: AudioContext | null = null;
  let oscillator: OscillatorNode | null = null;
  let intervalId: NodeJS.Timeout | null = null;
  let isPlaying = false;

  const playBeep = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    osc.frequency.value = config.frequency;
    osc.type = 'sine';

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.setValueAtTime(0.3, now + config.duration);

    osc.start(now);
    osc.stop(now + config.duration);
  };

  const play = () => {
    if (isPlaying) return;
    
    isPlaying = true;

    if (config.pattern === 'beep' && config.interval) {
      playBeep();
      intervalId = setInterval(playBeep, config.interval);
    } else {
      playBeep();
    }
  };

  const stop = () => {
    isPlaying = false;
    
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    if (oscillator) {
      try {
        oscillator.stop();
      } catch (e) {
        // Oscillator already stopped
      }
      oscillator = null;
    }

    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
  };

  return {
    play,
    stop,
    get isPlaying() {
      return isPlaying;
    }
  };
}

export function createPanicAlarm() {
  return createAlarmSound({
    frequency: 800,
    duration: 0.2,
    pattern: 'beep',
    interval: 300
  });
}

export function createSignal100Alarm() {
  return createAlarmSound({
    frequency: 440,
    duration: 2,
    pattern: 'beep',
    interval: 15000
  });
}
