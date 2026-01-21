import { useState, memo } from 'react';
import { TWEET_MAX_LENGTH } from '../../utils/constants';
import { useImageUpload } from '../../hooks/useImageUpload';
import { ImageIcon, AlertIcon } from '../common/Icons';
import ImagePreview from '../common/ImagePreview';

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

  const charCountColor = charCount === TWEET_MAX_LENGTH
    ? 'var(--color-error)'
    : charCount >= 260
      ? 'var(--color-warning)'
      : 'var(--color-text-muted)';

  return (
    <div className="card p-5 mb-5">
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        Create Tweet
      </h2>

      {successMessage && (
        <div className="alert alert-success mb-4">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error mb-4">
          <div className="flex items-center gap-2">
            <AlertIcon size={18} />
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
          className="mb-3"
        />

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3">
            <ImagePreview
              src={imagePreview}
              alt="Preview"
              maxHeight="250px"
              size="lg"
              onRemove={handleRemoveImage}
            />
          </div>
        )}

        {/* Upload Progress */}
        {uploading && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>Uploading image...</span>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--color-primary)' }}>{uploadProgress}%</span>
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
              <ImageIcon size={20} />
            </button>

            {/* Character count */}
            <span
              className="text-sm"
              style={{
                fontWeight: charCount >= 260 ? '600' : '400',
                color: charCountColor
              }}
            >
              {charCount}/{TWEET_MAX_LENGTH}
            </span>
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="btn-primary min-w-[100px]"
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
