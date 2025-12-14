export const PRIORITY_CONFIGS = {
  code99: {
    label: 'CODE 99',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    borderColor: 'border-red-500',
    icon: 'Siren' as const
  },
  code3: {
    label: 'CODE 3',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-500',
    icon: 'AlertTriangle' as const
  },
  code2: {
    label: 'CODE 2',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500',
    icon: 'Info' as const
  }
} as const;

export const CALL_STATUS_CONFIGS = {
  pending: {
    label: 'Ожидает',
    color: 'bg-gray-500',
    textColor: 'text-gray-600'
  },
  dispatched: {
    label: 'Назначен',
    color: 'bg-blue-500',
    textColor: 'text-blue-600'
  },
  completed: {
    label: 'Завершен',
    color: 'bg-green-500',
    textColor: 'text-green-600'
  }
} as const;

export const CREW_STATUS_CONFIGS = {
  available: {
    label: 'В службе',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    icon: 'CheckCircle' as const
  },
  'en-route': {
    label: 'В пути',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    icon: 'Navigation' as const
  },
  'on-scene': {
    label: 'На месте',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    icon: 'MapPin' as const
  },
  unavailable: {
    label: 'Не в службе',
    color: 'bg-gray-500',
    textColor: 'text-gray-600',
    icon: 'XCircle' as const
  }
} as const;

export const ROLE_CONFIGS = {
  admin: {
    label: 'Администратор',
    color: 'bg-purple-500',
    textColor: 'text-purple-600'
  },
  dispatcher: {
    label: 'Диспетчер',
    color: 'bg-blue-500',
    textColor: 'text-blue-600'
  },
  employee: {
    label: 'Сотрудник',
    color: 'bg-green-500',
    textColor: 'text-green-600'
  }
} as const;

export type Priority = keyof typeof PRIORITY_CONFIGS;
export type CallStatus = keyof typeof CALL_STATUS_CONFIGS;
export type CrewStatus = keyof typeof CREW_STATUS_CONFIGS;
export type UserRole = keyof typeof ROLE_CONFIGS;
