import type { Crew } from './store';
import funcUrls from '../../backend/func2url.json';

const UNITS_API_URL = funcUrls.units;

export const fetchUnits = async (): Promise<Crew[]> => {
  try {
    const response = await fetch(UNITS_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch units:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.units || [];
  } catch (error) {
    console.error('Error fetching units:', error);
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
