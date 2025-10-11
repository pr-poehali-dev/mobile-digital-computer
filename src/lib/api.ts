// API клиент для работы с backend функциями

const API_BASE = import.meta.env.VITE_API_URL || '';

// Получить URL функции из func2url.json
export const getFunctionUrl = async (functionName: string): Promise<string> => {
  try {
    const response = await fetch('/backend/func2url.json');
    const urls = await response.json();
    return urls[functionName] || '';
  } catch {
    console.error('Failed to load func2url.json');
    return '';
  }
};

export interface OnlineUser {
  user_id: string;
  full_name: string;
  role: string;
  email: string;
  last_heartbeat?: string;
}

export interface DispatcherShift {
  id?: number;
  dispatcher_id: string;
  dispatcher_name: string;
  start_time?: string;
  is_active: boolean;
}

// Онлайн пользователи
export const getOnlineUsers = async (): Promise<OnlineUser[]> => {
  const url = await getFunctionUrl('online-users');
  if (!url) return [];
  
  const response = await fetch(`${url}?resource=users`);
  return response.json();
};

export const sendHeartbeat = async (user: OnlineUser): Promise<void> => {
  const url = await getFunctionUrl('online-users');
  if (!url) return;
  
  await fetch(`${url}?resource=users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
};

export const removeOnlineUser = async (userId: string): Promise<void> => {
  const url = await getFunctionUrl('online-users');
  if (!url) return;
  
  await fetch(`${url}?resource=users&userId=${userId}`, {
    method: 'DELETE'
  });
};

// Смены диспетчеров
export const getDispatcherShifts = async (): Promise<DispatcherShift[]> => {
  const url = await getFunctionUrl('online-users');
  if (!url) return [];
  
  const response = await fetch(`${url}?resource=shifts`);
  return response.json();
};

export const startDispatcherShift = async (dispatcherId: string, dispatcherName: string): Promise<void> => {
  const url = await getFunctionUrl('online-users');
  if (!url) return;
  
  await fetch(`${url}?resource=shifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dispatcher_id: dispatcherId, dispatcher_name: dispatcherName })
  });
};

export const endDispatcherShift = async (dispatcherId: string): Promise<void> => {
  const url = await getFunctionUrl('online-users');
  if (!url) return;
  
  await fetch(`${url}?resource=shifts&dispatcherId=${dispatcherId}`, {
    method: 'DELETE'
  });
};

// Экипажи
export interface ApiCrew {
  id: number;
  unit_name: string;
  status: 'available' | 'en-route' | 'on-scene' | 'unavailable';
  location?: string;
  last_update: string;
}

export const getCrewsFromApi = async (): Promise<ApiCrew[]> => {
  const url = await getFunctionUrl('online-users');
  if (!url) return [];
  
  const response = await fetch(`${url}?resource=crews`);
  return response.json();
};

export const createCrewInApi = async (unitName: string, status: string, location: string): Promise<ApiCrew> => {
  const url = await getFunctionUrl('online-users');
  if (!url) throw new Error('API URL not found');
  
  const response = await fetch(`${url}?resource=crews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unit_name: unitName, status, location })
  });
  
  if (!response.ok) throw new Error('Failed to create crew');
  return response.json();
};

export const updateCrewInApi = async (id: number, data: Partial<ApiCrew>): Promise<ApiCrew> => {
  const url = await getFunctionUrl('online-users');
  if (!url) throw new Error('API URL not found');
  
  const updateData: any = { id };
  if (data.status) updateData.status = data.status;
  if (data.location) updateData.location = data.location;
  if (data.unit_name) updateData.unit_name = data.unit_name;

  const response = await fetch(`${url}?resource=crews`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  
  if (!response.ok) throw new Error('Failed to update crew');
  return response.json();
};