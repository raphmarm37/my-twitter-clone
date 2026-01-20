import React, { memo } from 'react';

const ImageUploader = memo(({
  imagePreview,
  uploadProgress,
  uploading,
  inputRef,
  onImageSelect,
  onRemoveImage,
  onTriggerInput,
  disabled = false,
  showButton = true,
  buttonSize = 'normal', // 'normal' | 'small'
  previewMaxHeight = '16rem',
}) => {
  const isSmall = buttonSize === 'small';

  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        ref={inputRef}
        onChange={onImageSelect}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        disabled={disabled}
      />

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative mt-2 inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="rounded-lg border border-gray-200"
            style={{ maxWidth: '100%', maxHeight: previewMaxHeight, objectFit: 'contain' }}
          />
          <button
            type="button"
            onClick={onRemoveImage}
            className={`absolute top-1 right-1 rounded-full flex items-center justify-center transition-colors ${isSmall ? 'w-5 h-5 text-xs' : 'w-8 h-8'}`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
            title="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-gray-600 ${isSmall ? 'text-xs' : 'text-sm'}`}>Uploading...</span>
            <span className={`font-medium ${isSmall ? 'text-xs' : 'text-sm'}`} style={{ color: '#2563eb' }}>
              {uploadProgress}%
            </span>
          </div>
          <div className={`w-full bg-gray-200 rounded-full ${isSmall ? 'h-1.5' : 'h-2'}`}>
            <div
              className={`rounded-full transition-all duration-300 ${isSmall ? 'h-1.5' : 'h-2'}`}
              style={{ width: `${uploadProgress}%`, backgroundColor: '#2563eb' }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {showButton && (
        <button
          type="button"
          onClick={onTriggerInput}
          disabled={disabled || imagePreview}
          className={`flex items-center gap-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isSmall ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'}`}
          style={{ color: '#2563eb', backgroundColor: 'transparent', border: '1px solid #2563eb' }}
          onMouseEnter={(e) => {
            if (!disabled && !imagePreview) {
              e.currentTarget.style.backgroundColor = '#eff6ff';
            }
          }}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Add image (JPG, PNG, GIF, WebP - max 5MB)"
        >
          <span>📷</span>
          {!isSmall && <span>Add Image</span>}
        </button>
      )}
    </>
  );
});

ImageUploader.displayName = 'ImageUploader';

export default ImageUploader;
