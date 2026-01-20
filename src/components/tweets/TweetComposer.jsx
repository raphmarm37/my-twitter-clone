import { useState, memo } from 'react';
import { TWEET_MAX_LENGTH } from '../../utils/constants';
import { useImageUpload } from '../../hooks/useImageUpload';

const TweetComposer = memo(({ user, onPostTweet, successMessage, errorMessage, setErrorMessage }) => {
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
    triggerFileInput,
  } = useImageUpload();

  const handleContentChange = (e) => {
    const value = e.target.value;
    if (value.length <= TWEET_MAX_LENGTH) {
      setContent(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !image) {
      setErrorMessage('Tweet cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setPosting(true);

    try {
      let imageUrl = null;

      if (image) {
        const fileName = `tweets/${user.uid}/${Date.now()}_${image.name}`;
        try {
          imageUrl = await uploadImage(image, fileName);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setErrorMessage('Failed to upload image. Please try again.');
          setTimeout(() => setErrorMessage(''), 3000);
          setPosting(false);
          return;
        }
      }

      await onPostTweet(content, imageUrl);
      setContent('');
      reset();
    } catch (error) {
      console.error('Error posting tweet:', error);
      setErrorMessage('Failed to post tweet. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setPosting(false);
    }
  };

  const charCount = content.length;
  const isDisabled = posting || (!content.trim() && !image);

  return (
    <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
        Create Tweet
      </h2>

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="What's happening?"
          disabled={posting}
          rows="4"
          style={{ marginBottom: 'var(--space-3)' }}
        />

        {/* Image Preview */}
        {imagePreview && (
          <div className="relative inline-block" style={{ marginBottom: 'var(--space-3)' }}>
            <img
              src={imagePreview}
              alt="Preview"
              className="tweet-image"
              style={{ maxHeight: '250px' }}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute flex items-center justify-center text-white"
              style={{
                top: '8px',
                right: '8px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                transition: 'background-color var(--transition-fast)'
              }}
              title="Remove image"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && uploadProgress > 0 && uploadProgress < 100 && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-1)' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Uploading image...</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)' }}>{uploadProgress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Image Upload Button */}
            <input
              type="file"
              ref={inputRef}
              onChange={(e) => handleImageSelect(e, setErrorMessage)}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              disabled={posting}
            />
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={posting || imagePreview}
              className="btn-icon"
              title="Add image (JPG, PNG, GIF, WebP - max 5MB)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>

            {/* Character count */}
            <span
              style={{
                fontSize: '14px',
                fontWeight: charCount >= 260 ? '600' : '400',
                color: charCount === TWEET_MAX_LENGTH
                  ? 'var(--color-error)'
                  : charCount >= 260
                    ? 'var(--color-warning)'
                    : 'var(--color-text-muted)'
              }}
            >
              {charCount}/{TWEET_MAX_LENGTH}
            </span>
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="btn-primary"
            style={{ minWidth: '100px' }}
          >
            {uploading ? 'Uploading...' : posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
});

TweetComposer.displayName = 'TweetComposer';

export default TweetComposer;
