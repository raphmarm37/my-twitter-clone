import React, { useState, memo } from 'react';
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
  deletingReplyId,
  setErrorMessage,
}) => {
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
    <div className="bg-gray-50 rounded-lg p-3 ml-4">
      <div className="flex items-start justify-between mb-1">
        <Link
          to={`/profile/${reply.userId}`}
          className="font-semibold text-sm text-gray-900 hover:underline"
        >
          {reply.userEmail}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formatTimestamp(reply.createdAt)}
            {reply.edited && <span className="text-xs text-gray-400 ml-1">(edited)</span>}
          </span>
          {isOwner && (
            <>
              {canEdit && !isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="text-xs px-1 py-1 rounded transition-colors"
                  style={{ color: '#2563eb', backgroundColor: 'transparent', border: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Edit reply"
                >
                  ✎
                </button>
              )}
              <button
                onClick={() => onDelete(tweetId, reply.id)}
                disabled={deletingReplyId === reply.id}
                className="text-xs px-1 py-1 rounded transition-colors disabled:opacity-50"
                style={{ color: '#dc2626', backgroundColor: 'transparent', border: 'none' }}
                onMouseEnter={(e) => {
                  if (deletingReplyId !== reply.id) {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                  }
                }}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Delete reply"
              >
                {deletingReplyId === reply.id ? '...' : '✕'}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={editContent}
            onChange={handleEditContentChange}
            className="w-full p-2 border border-blue-500 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
            rows="2"
          />

          {editImagePreview && (
            <div className="relative mt-2 inline-block">
              <img
                src={editImagePreview}
                alt="Edit reply preview"
                className="max-h-32 rounded-lg border border-gray-200"
                style={{ maxWidth: '100%', objectFit: 'contain' }}
              />
              <button
                type="button"
                onClick={handleRemoveEditImage}
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors text-xs"
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
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="text-xs"
                style={{ color: editContent.length === TWEET_MAX_LENGTH ? '#dc2626' : editContent.length >= 260 ? '#ea580c' : '#4b5563' }}
              >
                {editContent.length}/{TWEET_MAX_LENGTH}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || (!editContent.trim() && !editImagePreview)}
                className="px-3 py-1 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2563eb', color: 'white', border: 'none' }}
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 rounded-md text-xs font-medium"
                style={{ backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #d1d5db' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-700">{reply.content}</p>
          {reply.imageUrl && (
            <div className="mt-2">
              <img
                src={reply.imageUrl}
                alt="Reply image"
                className="rounded-lg border border-gray-200 cursor-pointer hover:opacity-95 transition-opacity"
                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                onClick={() => window.open(reply.imageUrl, '_blank')}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
});

ReplyCard.displayName = 'ReplyCard';

export default ReplyCard;
