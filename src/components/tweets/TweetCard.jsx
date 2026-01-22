import { useState, memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TWEET_MAX_LENGTH } from '../../utils/constants';
import { formatTimestamp, canEditItem } from '../../utils/formatters';
import { useEditableContent } from '../../hooks/useEditableContent';
import { HeartIcon, CommentIcon, EditIcon, TrashIcon, ImageIcon } from '../common/Icons';
import ImagePreview from '../common/ImagePreview';
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

  const handleUpdate = useCallback(async (itemId, content, imageUrl, removeImage) => {
    await onUpdate(itemId, content, imageUrl, removeImage);
  }, [onUpdate]);

  const {
    isEditing,
    editContent,
    savingEdit,
    editImagePreview,
    editInputRef,
    charCountColor,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleEditContentChange,
    handleEditImageSelect,
    handleRemoveEditImage,
  } = useEditableContent(tweet, handleUpdate, setErrorMessage, `tweets/${currentUserId}`);

  const isOwner = tweet.userId === currentUserId;
  const canEdit = canEditItem(tweet, currentUserId);
  const hasLiked = tweet.likes?.includes(currentUserId);

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
              <button onClick={handleStartEdit} className="btn-icon" title="Edit tweet">
                <EditIcon size={18} />
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
                <TrashIcon size={18} />
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
            <div className="mt-3">
              <ImagePreview
                src={editImagePreview}
                alt="Edit preview"
                maxHeight="200px"
                size="md"
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

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => editInputRef.current?.click()}
                disabled={savingEdit || editImagePreview}
                className="btn-icon"
                title="Add image"
              >
                <ImageIcon size={20} />
              </button>
              <span className="text-sm" style={{ color: charCountColor }}>
                {editContent.length}/{TWEET_MAX_LENGTH}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveEdit(tweet.id)}
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
          <p className="mt-1 text-[15px] leading-relaxed text-primary">
            {tweet.content}
          </p>
          {tweet.imageUrl && (
            <div className="mt-3">
              <img
                src={tweet.imageUrl}
                alt="Tweet image"
                className="tweet-image max-h-[400px]"
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
          <HeartIcon size={18} filled={hasLiked} />
          <span>{tweet.likes?.length || 0}</span>
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="action-btn"
        >
          <CommentIcon size={18} />
          <span>{replies.length}</span>
        </button>
      </div>

      {/* Reply Section */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-default">
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
