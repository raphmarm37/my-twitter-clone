import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { TWEET_MAX_LENGTH } from '../../utils/constants';
import { formatTimestamp, canEditItem } from '../../utils/formatters';
import { useImageUpload } from '../../hooks/useImageUpload';
import ReplyForm from './ReplyForm';
import ReplyCard from './ReplyCard';

const TweetCard = memo(({
  tweet,
  currentUserId,
  replies = [],
  onDelete,
  onUpdate,
  onLike,
  onPostReply,
  onDeleteReply,
  onUpdateReply,
  onLikeReply,
  deletingTweetId,
  likingTweetId,
  deletingReplyId,
  likingReplyId,
  setErrorMessage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const {
    image: editImage,
    imagePreview: editImagePreview,
    inputRef: editInputRef,
    handleImageSelect: handleEditImageSelect,
    handleRemoveImage: handleRemoveEditImage,
    uploadImage,
    setExistingImage,
  } = useImageUpload();

  const isOwner = tweet.userId === currentUserId;
  const canEdit = canEditItem(tweet, currentUserId);
  const hasLiked = tweet.likes?.includes(currentUserId);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditContent(tweet.content);
    if (tweet.imageUrl) {
      setExistingImage(tweet.imageUrl);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
    handleRemoveEditImage();
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() && !editImagePreview) {
      setErrorMessage('Tweet cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSavingEdit(true);

    try {
      let imageUrl = tweet.imageUrl;
      let removeImage = false;

      if (editImage) {
        const fileName = `tweets/${currentUserId}/${Date.now()}_${editImage.name}`;
        imageUrl = await uploadImage(editImage, fileName);
      } else if (!editImagePreview && tweet.imageUrl) {
        removeImage = true;
        imageUrl = null;
      }

      await onUpdate(tweet.id, editContent, imageUrl, removeImage);
      setIsEditing(false);
      setEditContent('');
      handleRemoveEditImage();
    } catch (error) {
      console.error('Error editing tweet:', error);
      setErrorMessage('Failed to edit tweet. Please try again.');
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

  const handleDelete = () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this tweet?');
    if (confirmDelete) {
      onDelete(tweet.id);
    }
  };

  const handleDeleteReply = (tweetId, replyId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this reply?');
    if (confirmDelete) {
      onDeleteReply(tweetId, replyId);
    }
  };

  return (
    <div className="tweet-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={`/profile/${tweet.userId}`} className="username">
            {tweet.userEmail}
          </Link>
          <span className="timestamp">
            · {formatTimestamp(tweet.createdAt)}
            {tweet.edited && <span className="ml-1">(edited)</span>}
          </span>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1">
            {canEdit && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="btn-icon"
                title="Edit tweet"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deletingTweetId === tweet.id}
              className="btn-icon danger"
              title="Delete tweet"
            >
              {deletingTweetId === tweet.id ? (
                <span className="text-xs">...</span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content or Edit Mode */}
      {isEditing ? (
        <div className="mt-3">
          <textarea
            value={editContent}
            onChange={handleEditContentChange}
            className="w-full"
            rows="3"
            placeholder="What's happening?"
          />

          {editImagePreview && (
            <div className="relative mt-3 inline-block">
              <img
                src={editImagePreview}
                alt="Edit preview"
                className="tweet-image"
                style={{ maxHeight: '200px' }}
              />
              <button
                type="button"
                onClick={handleRemoveEditImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
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

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => editInputRef.current?.click()}
                disabled={savingEdit || editImagePreview}
                className="btn-icon"
                title="Add image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
              <span
                className="text-sm"
                style={{
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
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
              <button onClick={handleCancelEdit} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1" style={{ color: 'var(--color-text-primary)', fontSize: '15px', lineHeight: '1.5' }}>
            {tweet.content}
          </p>
          {tweet.imageUrl && (
            <div className="mt-3">
              <img
                src={tweet.imageUrl}
                alt="Tweet image"
                className="tweet-image"
                style={{ maxHeight: '400px' }}
                onClick={() => window.open(tweet.imageUrl, '_blank')}
              />
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => onLike(tweet.id, tweet.likes || [])}
          disabled={likingTweetId === tweet.id}
          className={`action-btn like ${hasLiked ? 'active' : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{tweet.likes?.length || 0}</span>
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="action-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{replies.length}</span>
        </button>
      </div>

      {/* Reply Section */}
      {isExpanded && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <ReplyForm
            tweetId={tweet.id}
            currentUserId={currentUserId}
            onPostReply={onPostReply}
            onCancel={() => setIsExpanded(false)}
            setErrorMessage={setErrorMessage}
          />

          {replies.length > 0 && (
            <div className="space-y-3 mt-4">
              {replies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  tweetId={tweet.id}
                  currentUserId={currentUserId}
                  onDelete={handleDeleteReply}
                  onUpdate={onUpdateReply}
                  onLike={onLikeReply}
                  deletingReplyId={deletingReplyId}
                  likingReplyId={likingReplyId}
                  setErrorMessage={setErrorMessage}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TweetCard.displayName = 'TweetCard';

export default TweetCard;
