import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from './constants';

export const validateImage = (file) => {
  if (!file) return { valid: false, error: 'No file selected' };

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please select a JPG, PNG, GIF, or WebP image.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File is too large. Maximum size is 5MB.' };
  }

  return { valid: true, error: null };
};
