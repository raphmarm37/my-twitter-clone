import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { TWEET_MAX_LENGTH } from '../../utils/constants';
import { formatTimestamp, canEditItem } from '../../utils/formatters';
import { useImageUpload } from '../../hooks/useImageUpload';

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

  return (
    <div className="reply-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={`/profile/${reply.userId}`} className="username" style={{ fontSize: '14px' }}>
            {reply.userEmail}
          </Link>
          <span className="timestamp" style={{ fontSize: '12px' }}>
            · {formatTimestamp(reply.createdAt)}
            {reply.edited && <span className="ml-1">(edited)</span>}
          </span>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1">
            {canEdit && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                title="Edit reply"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onDelete(tweetId, reply.id)}
              disabled={deletingReplyId === reply.id}
              className="btn-icon danger"
              style={{ width: '28px', height: '28px' }}
              title="Delete reply"
            >
              {deletingReplyId === reply.id ? (
                <span style={{ fontSize: '10px' }}>...</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
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
            className="w-full"
            style={{ fontSize: '14px' }}
            rows="2"
            placeholder="Write your reply..."
          />

          {editImagePreview && (
            <div className="relative mt-2 inline-block">
              <img
                src={editImagePreview}
                alt="Edit reply preview"
                className="tweet-image"
                style={{ maxHeight: '150px' }}
              />
              <button
                type="button"
                onClick={handleRemoveEditImage}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
                title="Remove image"
              >
                ✕
              </button>
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
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                title="Add image"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
              <span
                style={{
                  fontSize: '12px',
                  color: editContent.length === TWEET_MAX_LENGTH
                    ? 'var(--color-error)'
                    : editContent.length >= 260
                      ? 'var(--color-warning)'
                      : 'var(--color-text-muted)'
                }}
              >
                {editContent.length}/{TWEET_MAX_LENGTH}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || (!editContent.trim() && !editImagePreview)}
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1" style={{ color: 'var(--color-text-primary)', fontSize: '14px', lineHeight: '1.4' }}>
            {reply.content}
          </p>
          {reply.imageUrl && (
            <div className="mt-2">
              <img
                src={reply.imageUrl}
                alt="Reply image"
                className="tweet-image"
                style={{ maxHeight: '200px' }}
                onClick={() => window.open(reply.imageUrl, '_blank')}
              />
            </div>
          )}
          {/* Like Button */}
          <div className="mt-2">
            <button
              onClick={() => onLike(tweetId, reply.id, reply.likes || [])}
              disabled={likingReplyId === reply.id}
              className={`action-btn like ${hasLiked ? 'active' : ''}`}
              style={{ fontSize: '12px', padding: '2px 6px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
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
