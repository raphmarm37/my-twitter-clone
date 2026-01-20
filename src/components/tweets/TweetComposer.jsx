import React, { useState, memo } from 'react';
import { TWEET_MAX_LENGTH } from '../../utils/constants';
import { useImageUpload } from '../../hooks/useImageUpload';
import ImageUploader from '../common/ImageUploader';

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
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Create Tweet</h2>

      {successMessage && (
        <div className="bg-green-50 border-2 border-green-500 px-4 py-3 rounded-lg mb-4">
          <span style={{ color: '#16a34a' }}>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-600 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-start">
            <span className="mr-3 text-xl" style={{ color: '#dc2626' }}>⚠</span>
            <span style={{ color: '#dc2626' }}>{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="What's happening?"
          disabled={posting}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-none text-gray-900"
          rows="4"
        />

        <ImageUploader
          imagePreview={imagePreview}
          uploadProgress={uploadProgress}
          uploading={uploading}
          inputRef={inputRef}
          onImageSelect={(e) => handleImageSelect(e, setErrorMessage)}
          onRemoveImage={handleRemoveImage}
          onTriggerInput={triggerFileInput}
          disabled={posting}
          showButton={false}
          previewMaxHeight="16rem"
        />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={posting || imagePreview}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: '#2563eb', backgroundColor: 'transparent', border: '1px solid #2563eb' }}
              onMouseEnter={(e) => {
                if (!posting && !imagePreview) {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }
              }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Add image (JPG, PNG, GIF, WebP - max 5MB)"
            >
              <span>📷</span>
              <span>Add Image</span>
            </button>
            <span
              className={`text-sm ${charCount === TWEET_MAX_LENGTH ? 'font-bold' : charCount >= 260 ? 'font-semibold' : ''}`}
              style={{ color: charCount === TWEET_MAX_LENGTH ? '#dc2626' : charCount >= 260 ? '#ea580c' : '#4b5563' }}
            >
              {charCount}/{TWEET_MAX_LENGTH}
            </span>
          </div>
          <button
            type="submit"
            disabled={isDisabled}
            className="px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2563eb', color: 'white' }}
            onMouseEnter={(e) => !isDisabled && (e.target.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            {uploading ? 'Uploading...' : posting ? 'Posting...' : 'Post tweet'}
          </button>
        </div>
      </form>
    </div>
  );
});

TweetComposer.displayName = 'TweetComposer';

export default TweetComposer;
