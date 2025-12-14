import { type ToastActionElement } from '@/components/ui/toast';

export interface ToastFunction {
  (props: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
    action?: ToastActionElement;
  }): void;
}

export function createToastHelpers(toast: ToastFunction) {
  return {
    success: (title: string, description?: string) => {
      toast({ title, description });
    },

    error: (title: string, description?: string) => {
      toast({ 
        title, 
        description, 
        variant: 'destructive' 
      });
    },

    validationError: (message: string = 'Заполните обязательные поля') => {
      toast({
        title: 'Ошибка валидации',
        description: message,
        variant: 'destructive'
      });
    },

    permissionError: (message: string = 'Недостаточно прав для выполнения операции') => {
      toast({
        title: 'Недостаточно прав',
        description: message,
        variant: 'destructive'
      });
    },

    systemError: (message: string = 'Произошла системная ошибка') => {
      toast({
        title: 'Системная ошибка',
        description: message,
        variant: 'destructive'
      });
    }
  };
}
