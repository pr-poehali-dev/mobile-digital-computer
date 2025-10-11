import type { Crew } from './store';
import funcUrls from '../../backend/func2url.json';

const UNITS_API_URL = (funcUrls as any).units;

export const fetchUnits = async (): Promise<Crew[]> => {
  if (!UNITS_API_URL) {
    console.error('Units API URL not configured');
    return [];
  }
  
  try {
    const response = await fetch(UNITS_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to fetch units:', response.status, response.statusText, text);
      return [];
    }
    
    const data = await response.json();
    return data.units || [];
  } catch (error) {
    console.error('Error fetching units:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Fetch error:', error.message, 'for', UNITS_API_URL);
    }
    return [];
  }
};

export const createUnitAPI = async (unit: Omit<Crew, 'id' | 'lastUpdate'>): Promise<number | null> => {
  try {
    const response = await fetch(UNITS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        unitName: unit.unitName,
        status: unit.status,
        location: unit.location,
        members: unit.members
      })
    });
    
    if (!response.ok) {
      console.error('Failed to create unit:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating unit:', error);
    return null;
  }
};

export const updateUnitAPI = async (unit: Crew): Promise<boolean> => {
  try {
    const response = await fetch(UNITS_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: unit.id,
        unitName: unit.unitName,
        status: unit.status,
        location: unit.location,
        members: unit.members
      })
    });
    
    if (!response.ok) {
      console.error('Failed to update unit:', response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating unit:', error);
    return false;
  }
};

export const deleteUnitAPI = async (unitId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${UNITS_API_URL}?id=${unitId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to delete unit:', response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting unit:', error);
    return false;
  }
};