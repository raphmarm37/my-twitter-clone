import { useState, useRef, useCallback, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { validateImage } from '../utils/validators';

export const useImageUpload = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageSelect = useCallback((e, onError) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      onError?.(validation.error);
      e.target.value = '';
      return;
    }

    setImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImage(null);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [imagePreview]);

  const uploadImage = useCallback((file, path) => {
    return new Promise((resolve, reject) => {
      setUploading(true);
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setUploading(false);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploading(false);
            resolve(downloadURL);
          } catch (error) {
            setUploading(false);
            reject(error);
          }
        }
      );
    });
  }, []);

  const reset = useCallback(() => {
    handleRemoveImage();
    setUploadProgress(0);
    setUploading(false);
  }, [handleRemoveImage]);

  const triggerFileInput = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // For setting existing image during edit
  const setExistingImage = useCallback((url) => {
    setImagePreview(url);
    setImage(null);
  }, []);

  return {
    image,
    imagePreview,
    uploadProgress,
    uploading,
    inputRef,
    handleImageSelect,
    handleRemoveImage,
    uploadImage,
    reset,
    triggerFileInput,
    setExistingImage,
  };
};
