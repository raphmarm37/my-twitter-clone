import { memo } from 'react';

const ImagePreview = memo(({
  src,
  alt = 'Preview',
  maxHeight = '200px',
  onRemove,
  size = 'md' // 'sm' | 'md' | 'lg'
}) => {
  const buttonSizes = {
    sm: { width: '24px', height: '24px', top: '4px', right: '4px', fontSize: '10px' },
    md: { width: '28px', height: '28px', top: '8px', right: '8px', fontSize: '12px' },
    lg: { width: '32px', height: '32px', top: '8px', right: '8px', fontSize: '14px' },
  };

  const buttonStyle = buttonSizes[size] || buttonSizes.md;

  return (
    <div className="relative inline-block">
      <img
        src={src}
        alt={alt}
        className="tweet-image"
        style={{ maxHeight }}
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute flex items-center justify-center text-white"
          style={{
            top: buttonStyle.top,
            right: buttonStyle.right,
            width: buttonStyle.width,
            height: buttonStyle.height,
            fontSize: buttonStyle.fontSize,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            transition: 'background-color var(--transition-fast)'
          }}
          title="Remove image"
        >
          ✕
        </button>
      )}
    </div>
  );
});

ImagePreview.displayName = 'ImagePreview';

export default ImagePreview;
