import { useState } from 'react';

export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState);

  const reset = () => setFormData(initialState);
  
  const update = (updates: Partial<T>) => 
    setFormData(prev => ({ ...prev, ...updates }));
  
  const setField = <K extends keyof T>(field: K, value: T[K]) => 
    setFormData(prev => ({ ...prev, [field]: value }));

  return { 
    formData, 
    setFormData, 
    reset, 
    update, 
    setField 
  };
}
