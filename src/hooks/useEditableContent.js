import { useState, useCallback } from 'react';
import { TWEET_MAX_LENGTH } from '../utils/constants';
import { useImageUpload } from './useImageUpload';

export const useEditableContent = (item, onUpdate, setErrorMessage, uploadPath) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const {
    image: editImage,
    imagePreview: editImagePreview,
    inputRef: editInputRef,
    handleImageSelect: handleEditImageSelect,
    handleRemoveImage: handleRemoveEditImage,
    uploadImage,
    setExistingImage,
  } = useImageUpload();

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditContent(item.content);
    if (item.imageUrl) {
      setExistingImage(item.imageUrl);
    }
  }, [item.content, item.imageUrl, setExistingImage]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent('');
    handleRemoveEditImage();
  }, [handleRemoveEditImage]);

  const handleSaveEdit = useCallback(async (itemId, extraParams = {}) => {
    if (!editContent.trim() && !editImagePreview) {
      setErrorMessage('Content cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSavingEdit(true);

    try {
      let imageUrl = item.imageUrl;
      let removeImage = false;

      if (editImage) {
        const fileName = `${uploadPath}/${Date.now()}_${editImage.name}`;
        imageUrl = await uploadImage(editImage, fileName);
      } else if (!editImagePreview && item.imageUrl) {
        removeImage = true;
        imageUrl = null;
      }

      await onUpdate(itemId, editContent, imageUrl, removeImage, extraParams);
      setIsEditing(false);
      setEditContent('');
      handleRemoveEditImage();
    } catch (error) {
      console.error('Error editing:', error);
      setErrorMessage('Failed to save. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingEdit(false);
    }
  }, [editContent, editImage, editImagePreview, item.imageUrl, uploadPath, onUpdate, uploadImage, handleRemoveEditImage, setErrorMessage]);

  const handleEditContentChange = useCallback((e) => {
    if (e.target.value.length <= TWEET_MAX_LENGTH) {
      setEditContent(e.target.value);
    }
  }, []);

  const charCountColor = editContent.length === TWEET_MAX_LENGTH
    ? 'var(--color-error)'
    : editContent.length >= 260
      ? 'var(--color-warning)'
      : 'var(--color-text-muted)';

  return {
    isEditing,
    editContent,
    savingEdit,
    editImagePreview,
    editInputRef,
    charCountColor,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleEditContentChange,
    handleEditImageSelect,
    handleRemoveEditImage,
  };
};
