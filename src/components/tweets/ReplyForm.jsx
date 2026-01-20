import { useState, memo } from 'react';
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
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reply..."
        rows="2"
        style={{ marginBottom: 'var(--space-2)', fontSize: '14px' }}
      />

      {imagePreview && (
        <div className="relative inline-block" style={{ marginBottom: 'var(--space-2)' }}>
          <img
            src={imagePreview}
            alt="Reply preview"
            className="tweet-image"
            style={{ maxHeight: '150px' }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute flex items-center justify-center text-white text-xs"
            style={{
              top: '4px',
              right: '4px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.75)'
            }}
            title="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      {uploading && uploadProgress > 0 && uploadProgress < 100 && (
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Uploading...</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)' }}>{uploadProgress}%</span>
          </div>
          <div className="progress-bar" style={{ height: '3px' }}>
            <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
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

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={posting || imagePreview}
          className="btn-icon"
          style={{ width: '32px', height: '32px' }}
          title="Add image"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            {uploading ? 'Uploading...' : posting ? 'Posting...' : 'Reply'}
          </button>
          <button
            onClick={handleCancel}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '14px' }}
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
