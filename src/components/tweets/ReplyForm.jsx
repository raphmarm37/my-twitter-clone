import React, { useState, memo } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';

const ReplyForm = memo(({
  tweetId,
  currentUserId,
  onPostReply,
  onCancel,
  setErrorMessage,
}) => {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const {
    image,
    imagePreview,
    uploadProgress,
    uploading,
    inputRef,
    handleImageSelect,
    handleRemoveImage,
    uploadImage,
    reset,
  } = useImageUpload();

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;

    setPosting(true);

    try {
      let imageUrl = null;

      if (image) {
        const fileName = `replies/${currentUserId}/${Date.now()}_${image.name}`;
        try {
          imageUrl = await uploadImage(image, fileName);
        } catch (uploadError) {
          console.error('Error uploading reply image:', uploadError);
          setErrorMessage('Failed to upload image. Please try again.');
          setTimeout(() => setErrorMessage(''), 3000);
          setPosting(false);
          return;
        }
      }

      await onPostReply(tweetId, content || '', imageUrl);
      setContent('');
      reset();
    } catch (error) {
      console.error('Error posting reply:', error);
      setErrorMessage('Failed to post reply. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setPosting(false);
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const isDisabled = posting || (!content.trim() && !image);

  return (
    <div className="mb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reply..."
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        rows="2"
      />

      {imagePreview && (
        <div className="relative mt-2 inline-block">
          <img
            src={imagePreview}
            alt="Reply preview"
            className="max-h-40 rounded-lg border border-gray-200"
            style={{ maxWidth: '100%', objectFit: 'contain' }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors text-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
            title="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      {uploading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-600">Uploading...</span>
            <span className="text-xs font-medium" style={{ color: '#2563eb' }}>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%`, backgroundColor: '#2563eb' }}
            />
          </div>
        </div>
      )}

      <input
        type="file"
        ref={inputRef}
        onChange={(e) => handleImageSelect(e, setErrorMessage)}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        disabled={posting}
      />

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={posting || imagePreview}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: '#2563eb', backgroundColor: 'transparent', border: '1px solid #2563eb' }}
            onMouseEnter={(e) => {
              if (!posting && !imagePreview) {
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }
            }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Add image"
          >
            <span>📷</span>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2563eb', color: 'white', border: 'none' }}
          >
            {uploading ? 'Uploading...' : posting ? 'Posting...' : 'Post Reply'}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #d1d5db' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

ReplyForm.displayName = 'ReplyForm';

export default ReplyForm;
