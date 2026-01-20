import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTweets } from '../hooks/useTweets';
import TweetComposer from '../components/tweets/TweetComposer';
import TweetCard from '../components/tweets/TweetCard';

function Home() {
  const { user, userData, loading, handleLogout } = useAuth();
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
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
    setSuccessMessage('Tweet posted successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, [postTweet]);

  const handleDeleteTweet = useCallback(async (tweetId) => {
    setDeletingTweetId(tweetId);
    try {
      await deleteTweet(tweetId);
      setSuccessMessage('Tweet deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting tweet:', error);
      setErrorMessage('Failed to delete tweet. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setDeletingTweetId(null);
    }
  }, [deleteTweet]);

  const handleUpdateTweet = useCallback(async (tweetId, content, imageUrl, removeImage) => {
    await updateTweet(tweetId, content, imageUrl, removeImage);
    setSuccessMessage('Tweet updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, [updateTweet]);

  const handleLikeTweet = useCallback(async (tweetId, currentLikes) => {
    setLikingTweetId(tweetId);
    try {
      await likeTweet(tweetId, currentLikes);
    } catch (error) {
      console.error('Error liking tweet:', error);
      setErrorMessage('Failed to like tweet. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLikingTweetId(null);
    }
  }, [likeTweet]);

  const handlePostReply = useCallback(async (tweetId, content, imageUrl) => {
    await postReply(tweetId, content, imageUrl);
  }, [postReply]);

  const handleDeleteReply = useCallback(async (tweetId, replyId) => {
    setDeletingReplyId(replyId);
    try {
      await deleteReply(tweetId, replyId);
    } catch (error) {
      console.error('Error deleting reply:', error);
      setErrorMessage('Failed to delete reply. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setDeletingReplyId(null);
    }
  }, [deleteReply]);

  const handleUpdateReply = useCallback(async (tweetId, replyId, content, imageUrl, removeImage) => {
    await updateReply(tweetId, replyId, content, imageUrl, removeImage);
    setSuccessMessage('Reply updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, [updateReply]);

  const handleLikeReply = useCallback(async (tweetId, replyId, currentLikes) => {
    setLikingReplyId(replyId);
    try {
      await likeReply(tweetId, replyId, currentLikes);
    } catch (error) {
      console.error('Error liking reply:', error);
      setErrorMessage('Failed to like reply. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLikingReplyId(null);
    }
  }, [likeReply]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: 'var(--color-border)',
              borderTopColor: 'var(--color-primary)'
            }}
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        padding: 'var(--space-6) var(--space-4)'
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Create Tweet Form */}
        <TweetComposer
          user={user}
          onPostTweet={handlePostTweet}
          successMessage={successMessage}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />

        {/* Welcome Section */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
              Welcome back!
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {user?.email}
            </p>
          </div>
          <button onClick={handleLogout} className="btn-danger">
            Logout
          </button>
        </div>

        {/* Feed Section */}
        <div className="card" style={{ overflow: 'hidden' }}>
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
          <div style={{ padding: 'var(--space-4)' }}>
            {loadingTweets ? (
              <div className="flex items-center justify-center" style={{ padding: 'var(--space-8)' }}>
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: 'var(--color-border)',
                      borderTopColor: 'var(--color-primary)'
                    }}
                  />
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Loading tweets...</p>
                </div>
              </div>
            ) : filteredTweets.length === 0 ? (
              <div className="text-center" style={{ padding: 'var(--space-8)' }}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ margin: '0 auto var(--space-4)', color: 'var(--color-text-muted)' }}
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
                  {activeTab === 'forYou'
                    ? "No tweets from people you follow yet. Try following some users or switch to 'All Tweets'!"
                    : "No tweets yet. Be the first to post!"}
                </p>
              </div>
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
