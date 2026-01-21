import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { TWEET_MAX_LENGTH } from '../../utils/constants';
import { formatTimestamp, canEditItem } from '../../utils/formatters';
import { useImageUpload } from '../../hooks/useImageUpload';
import { HeartIcon, EditIcon, TrashIcon, ImageIcon } from '../common/Icons';
import ImagePreview from '../common/ImagePreview';

const ReplyCard = memo(({
  reply,
  tweetId,
  currentUserId,
  onDelete,
  onUpdate,
  onLike,
  deletingReplyId,
  likingReplyId,
  setErrorMessage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const hasLiked = reply.likes?.includes(currentUserId);

  const {
    image: editImage,
    imagePreview: editImagePreview,
    inputRef: editInputRef,
    handleImageSelect: handleEditImageSelect,
    handleRemoveImage: handleRemoveEditImage,
    uploadImage,
    setExistingImage,
  } = useImageUpload();

  const isOwner = reply.userId === currentUserId;
  const canEdit = canEditItem(reply, currentUserId);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditContent(reply.content);
    if (reply.imageUrl) {
      setExistingImage(reply.imageUrl);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
    handleRemoveEditImage();
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() && !editImagePreview) {
      setErrorMessage('Reply cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSavingEdit(true);

    try {
      let imageUrl = reply.imageUrl;
      let removeImage = false;

      if (editImage) {
        const fileName = `replies/${currentUserId}/${Date.now()}_${editImage.name}`;
        imageUrl = await uploadImage(editImage, fileName);
      } else if (!editImagePreview && reply.imageUrl) {
        removeImage = true;
        imageUrl = null;
      }

      await onUpdate(tweetId, reply.id, editContent, imageUrl, removeImage);
      setIsEditing(false);
      setEditContent('');
      handleRemoveEditImage();
    } catch (error) {
      console.error('Error editing reply:', error);
      setErrorMessage('Failed to edit reply. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditContentChange = (e) => {
    if (e.target.value.length <= TWEET_MAX_LENGTH) {
      setEditContent(e.target.value);
    }
  };

  const charCountColor = editContent.length === TWEET_MAX_LENGTH
    ? 'var(--color-error)'
    : editContent.length >= 260
      ? 'var(--color-warning)'
      : 'var(--color-text-muted)';

  return (
    <div className="reply-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={`/profile/${reply.userId}`} className="username text-sm">
            {reply.userEmail}
          </Link>
          <span className="timestamp text-xs">
            · {formatTimestamp(reply.createdAt)}
            {reply.edited && <span className="ml-1">(edited)</span>}
          </span>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1">
            {canEdit && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="btn-icon w-7 h-7"
                title="Edit reply"
              >
                <EditIcon size={14} />
              </button>
            )}
            <button
              onClick={() => onDelete(tweetId, reply.id)}
              disabled={deletingReplyId === reply.id}
              className="btn-icon danger w-7 h-7"
              title="Delete reply"
            >
              {deletingReplyId === reply.id ? (
                <span className="text-[10px]">...</span>
              ) : (
                <TrashIcon size={14} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content or Edit Mode */}
      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={editContent}
            onChange={handleEditContentChange}
            className="w-full text-sm"
            rows="2"
            placeholder="Write your reply..."
          />

          {editImagePreview && (
            <div className="mt-2">
              <ImagePreview
                src={editImagePreview}
                alt="Edit reply preview"
                maxHeight="150px"
                size="sm"
                onRemove={handleRemoveEditImage}
              />
            </div>
          )}

          <input
            type="file"
            ref={editInputRef}
            onChange={(e) => handleEditImageSelect(e, setErrorMessage)}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            disabled={savingEdit}
          />

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => editInputRef.current?.click()}
                disabled={savingEdit || editImagePreview}
                className="btn-icon w-7 h-7"
                title="Add image"
              >
                <ImageIcon size={16} />
              </button>
              <span className="text-xs" style={{ color: charCountColor }}>
                {editContent.length}/{TWEET_MAX_LENGTH}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || (!editContent.trim() && !editImagePreview)}
                className="btn-primary px-3 py-1.5 text-[13px]"
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="btn-secondary px-3 py-1.5 text-[13px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>
            {reply.content}
          </p>
          {reply.imageUrl && (
            <div className="mt-2">
              <img
                src={reply.imageUrl}
                alt="Reply image"
                className="tweet-image max-h-[200px]"
                onClick={() => window.open(reply.imageUrl, '_blank')}
              />
            </div>
          )}
          {/* Like Button */}
          <div className="mt-2">
            <button
              onClick={() => onLike(tweetId, reply.id, reply.likes || [])}
              disabled={likingReplyId === reply.id}
              className={`action-btn like text-xs px-1.5 py-0.5 ${hasLiked ? 'active' : ''}`}
            >
              <HeartIcon size={14} filled={hasLiked} />
              <span>{reply.likes?.length || 0}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
});

ReplyCard.displayName = 'ReplyCard';

export default ReplyCard;
