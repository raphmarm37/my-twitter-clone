import React, { useState, memo } from 'react';
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
  deletingTweetId,
  likingTweetId,
  deletingReplyId,
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
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <Link
          to={`/profile/${tweet.userId}`}
          className="font-semibold text-gray-900 hover:underline"
        >
          {tweet.userEmail}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {formatTimestamp(tweet.createdAt)}
            {tweet.edited && <span className="text-xs text-gray-400 ml-1">(edited)</span>}
          </span>
          {isOwner && (
            <>
              {canEdit && !isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="text-sm px-2 py-1 rounded transition-colors"
                  style={{ color: '#2563eb', backgroundColor: 'transparent', border: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Edit tweet"
                >
                  ✎
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deletingTweetId === tweet.id}
                className="text-sm px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: '#dc2626', backgroundColor: 'transparent', border: 'none' }}
                onMouseEnter={(e) => {
                  if (deletingTweetId !== tweet.id) {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                  }
                }}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Delete tweet"
              >
                {deletingTweetId === tweet.id ? '...' : '✕'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content or Edit Mode */}
      {isEditing ? (
        <div className="mb-3">
          <textarea
            value={editContent}
            onChange={handleEditContentChange}
            className="w-full p-3 border border-blue-500 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            rows="3"
          />

          {editImagePreview && (
            <div className="relative mt-2 inline-block">
              <img
                src={editImagePreview}
                alt="Edit preview"
                className="max-h-48 rounded-lg border border-gray-200"
                style={{ maxWidth: '100%', objectFit: 'contain' }}
              />
              <button
                type="button"
                onClick={handleRemoveEditImage}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors text-sm"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
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
                className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: '#2563eb', backgroundColor: 'transparent', border: '1px solid #2563eb' }}
                onMouseEnter={(e) => {
                  if (!savingEdit && !editImagePreview) {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                  }
                }}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Change image"
              >
                <span>📷</span>
              </button>
              <span
                className="text-sm"
                style={{ color: editContent.length === TWEET_MAX_LENGTH ? '#dc2626' : editContent.length >= 260 ? '#ea580c' : '#4b5563' }}
              >
                {editContent.length}/{TWEET_MAX_LENGTH}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || (!editContent.trim() && !editImagePreview)}
                className="px-4 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2563eb', color: 'white', border: 'none' }}
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-1 rounded-md text-sm font-medium"
                style={{ backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #d1d5db' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-gray-900 mb-3">{tweet.content}</p>
          {tweet.imageUrl && (
            <div className="mb-3">
              <img
                src={tweet.imageUrl}
                alt="Tweet image"
                className="rounded-lg border border-gray-200 cursor-pointer hover:opacity-95 transition-opacity"
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                onClick={() => window.open(tweet.imageUrl, '_blank')}
              />
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onLike(tweet.id, tweet.likes || [])}
          disabled={likingTweetId === tweet.id}
          className="flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: hasLiked ? '#dc2626' : '#6b7280', backgroundColor: 'transparent', border: 'none' }}
          onMouseEnter={(e) => {
            if (likingTweetId !== tweet.id) {
              e.currentTarget.style.backgroundColor = '#fef2f2';
            }
          }}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span className="text-lg">{hasLiked ? '♥' : '♡'}</span>
          <span>{tweet.likes?.length || 0}</span>
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors"
          style={{ color: '#6b7280', backgroundColor: 'transparent', border: 'none' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span className="text-lg">💬</span>
          <span>{replies.length}</span>
        </button>
      </div>

      {/* Reply Section */}
      {isExpanded && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <ReplyForm
            tweetId={tweet.id}
            currentUserId={currentUserId}
            onPostReply={onPostReply}
            onCancel={() => setIsExpanded(false)}
            setErrorMessage={setErrorMessage}
          />

          {replies.length > 0 && (
            <div className="space-y-3">
              {replies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  tweetId={tweet.id}
                  currentUserId={currentUserId}
                  onDelete={handleDeleteReply}
                  onUpdate={onUpdateReply}
                  deletingReplyId={deletingReplyId}
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
