import { useState, useCallback } from 'react';

const DEFAULT_DURATION = 3000;

export const useNotification = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const showSuccess = useCallback((message, duration = DEFAULT_DURATION) => {
    setSuccessMessage(message);
    if (duration > 0) {
      setTimeout(() => setSuccessMessage(''), duration);
    }
  }, []);

  const showError = useCallback((message, duration = DEFAULT_DURATION) => {
    setErrorMessage(message);
    if (duration > 0) {
      setTimeout(() => setErrorMessage(''), duration);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setSuccessMessage('');
    setErrorMessage('');
  }, []);

  return {
    successMessage,
    errorMessage,
    showSuccess,
    showError,
    clearMessages,
    setErrorMessage, // Keep for backward compatibility
  };
};
