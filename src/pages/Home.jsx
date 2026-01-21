import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTweets } from '../hooks/useTweets';
import { useTheme } from '../hooks/useTheme';
import { useNotification } from '../hooks/useNotification';
import TweetComposer from '../components/tweets/TweetComposer';
import TweetCard from '../components/tweets/TweetCard';
import ThemeToggle from '../components/common/ThemeToggle';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

function Home() {
  const { user, userData, loading, handleLogout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { successMessage, errorMessage, showSuccess, showError, setErrorMessage } = useNotification();
  const {
    tweets,
    loadingTweets,
    tweetReplies,
    postTweet,
    deleteTweet,
    updateTweet,
    likeTweet,
    postReply,
    deleteReply,
    updateReply,
    likeReply,
  } = useTweets(user);

  const [activeTab, setActiveTab] = useState('forYou');
  const [deletingTweetId, setDeletingTweetId] = useState(null);
  const [likingTweetId, setLikingTweetId] = useState(null);
  const [deletingReplyId, setDeletingReplyId] = useState(null);
  const [likingReplyId, setLikingReplyId] = useState(null);

  const filteredTweets = useMemo(() => {
    if (activeTab === 'forYou') {
      return tweets.filter(tweet =>
        userData?.following?.includes(tweet.userId) || tweet.userId === user?.uid
      );
    }
    return tweets;
  }, [tweets, activeTab, userData, user]);

  const handlePostTweet = useCallback(async (content, imageUrl) => {
    await postTweet(content, imageUrl);
    showSuccess('Tweet posted successfully!');
  }, [postTweet, showSuccess]);

  const handleDeleteTweet = useCallback(async (tweetId) => {
    setDeletingTweetId(tweetId);
    try {
      await deleteTweet(tweetId);
      showSuccess('Tweet deleted successfully!');
    } catch (error) {
      console.error('Error deleting tweet:', error);
      showError('Failed to delete tweet. Please try again.');
    } finally {
      setDeletingTweetId(null);
    }
  }, [deleteTweet, showSuccess, showError]);

  const handleUpdateTweet = useCallback(async (tweetId, content, imageUrl, removeImage) => {
    await updateTweet(tweetId, content, imageUrl, removeImage);
    showSuccess('Tweet updated successfully!');
  }, [updateTweet, showSuccess]);

  const handleLikeTweet = useCallback(async (tweetId, currentLikes) => {
    setLikingTweetId(tweetId);
    try {
      await likeTweet(tweetId, currentLikes);
    } catch (error) {
      console.error('Error liking tweet:', error);
      showError('Failed to like tweet. Please try again.');
    } finally {
      setLikingTweetId(null);
    }
  }, [likeTweet, showError]);

  const handlePostReply = useCallback(async (tweetId, content, imageUrl) => {
    await postReply(tweetId, content, imageUrl);
  }, [postReply]);

  const handleDeleteReply = useCallback(async (tweetId, replyId) => {
    setDeletingReplyId(replyId);
    try {
      await deleteReply(tweetId, replyId);
    } catch (error) {
      console.error('Error deleting reply:', error);
      showError('Failed to delete reply. Please try again.');
    } finally {
      setDeletingReplyId(null);
    }
  }, [deleteReply, showError]);

  const handleUpdateReply = useCallback(async (tweetId, replyId, content, imageUrl, removeImage) => {
    await updateReply(tweetId, replyId, content, imageUrl, removeImage);
    showSuccess('Reply updated successfully!');
  }, [updateReply, showSuccess]);

  const handleLikeReply = useCallback(async (tweetId, replyId, currentLikes) => {
    setLikingReplyId(replyId);
    try {
      await likeReply(tweetId, replyId, currentLikes);
    } catch (error) {
      console.error('Error liking reply:', error);
      showError('Failed to like reply. Please try again.');
    } finally {
      setLikingReplyId(null);
    }
  }, [likeReply, showError]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <LoadingSpinner size="md" text="Loading..." />
      </div>
    );
  }

  const emptyMessage = activeTab === 'forYou'
    ? "No tweets from people you follow yet. Try following some users or switch to 'All Tweets'!"
    : "No tweets yet. Be the first to post!";

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        padding: 'var(--space-6) var(--space-4)'
      }}
    >
      <div className="max-w-xl mx-auto">
        {/* Create Tweet Form */}
        <TweetComposer
          user={user}
          onPostTweet={handlePostTweet}
          successMessage={successMessage}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />

        {/* Welcome Section */}
        <div className="card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Welcome back!
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {user?.email}
              </p>
            </div>
            <button onClick={handleLogout} className="btn-danger">
              Logout
            </button>
          </div>
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Theme</span>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>

        {/* Feed Section */}
        <div className="card overflow-hidden">
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setActiveTab('forYou')}
              className={`tab-btn ${activeTab === 'forYou' ? 'active' : ''}`}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            >
              All Tweets
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {loadingTweets ? (
              <LoadingSpinner size="sm" text="Loading tweets..." />
            ) : filteredTweets.length === 0 ? (
              <EmptyState message={emptyMessage} />
            ) : (
              <div className="space-y-4">
                {filteredTweets.map((tweet) => (
                  <TweetCard
                    key={tweet.id}
                    tweet={tweet}
                    currentUserId={user?.uid}
                    replies={tweetReplies[tweet.id] || []}
                    onDelete={handleDeleteTweet}
                    onUpdate={handleUpdateTweet}
                    onLike={handleLikeTweet}
                    onPostReply={handlePostReply}
                    onDeleteReply={handleDeleteReply}
                    onUpdateReply={handleUpdateReply}
                    onLikeReply={handleLikeReply}
                    deletingTweetId={deletingTweetId}
                    likingTweetId={likingTweetId}
                    deletingReplyId={deletingReplyId}
                    likingReplyId={likingReplyId}
                    setErrorMessage={setErrorMessage}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
