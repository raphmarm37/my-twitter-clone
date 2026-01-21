import { useState, memo } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { ImageIcon } from '../common/Icons';
import ImagePreview from '../common/ImagePreview';

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
        rows="2"
        className="mb-2 text-sm"
      />

      {imagePreview && (
        <div className="mb-2">
          <ImagePreview
            src={imagePreview}
            alt="Reply preview"
            maxHeight="150px"
            size="sm"
            onRemove={handleRemoveImage}
          />
        </div>
      )}

      {uploading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Uploading...</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{uploadProgress}%</span>
          </div>
          <div className="progress-bar h-[3px]">
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
          className="btn-icon w-8 h-8"
          title="Add image"
        >
          <ImageIcon size={18} />
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="btn-primary px-4 py-2 text-sm"
          >
            {uploading ? 'Uploading...' : posting ? 'Posting...' : 'Reply'}
          </button>
          <button
            onClick={handleCancel}
            className="btn-secondary px-4 py-2 text-sm"
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
