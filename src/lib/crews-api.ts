import type { Crew } from './store';
import funcUrls from '../../backend/func2url.json';

const CREWS_API_URL = funcUrls.crews;

export const fetchCrews = async (): Promise<Crew[]> => {
  try {
    const response = await fetch(CREWS_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch crews:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.crews || [];
  } catch (error) {
    console.error('Error fetching crews:', error);
    return [];
  }
};

export const createCrewAPI = async (crew: Omit<Crew, 'id' | 'lastUpdate'>): Promise<number | null> => {
  try {
    const response = await fetch(CREWS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        unitName: crew.unitName,
        status: crew.status,
        location: crew.location,
        members: crew.members
      })
    });
    
    if (!response.ok) {
      console.error('Failed to create crew:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating crew:', error);
    return null;
  }
};

export const updateCrewAPI = async (crew: Crew): Promise<boolean> => {
  try {
    const response = await fetch(CREWS_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: crew.id,
        unitName: crew.unitName,
        status: crew.status,
        location: crew.location,
        members: crew.members
      })
    });
    
    if (!response.ok) {
      console.error('Failed to update crew:', response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating crew:', error);
    return false;
  }
};

export const deleteCrewAPI = async (crewId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${CREWS_API_URL}?id=${crewId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to delete crew:', response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting crew:', error);
    return false;
  }
};
