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

  // Memoized filtered tweets
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Create Tweet Form */}
        <TweetComposer
          user={user}
          onPostTweet={handlePostTweet}
          successMessage={successMessage}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />

        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, {user?.email}!
              </h1>
              <p className="text-gray-600">You are now logged in</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              style={{ backgroundColor: '#dc2626', color: 'white' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Feed Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Home Feed</h2>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('forYou')}
              className="flex-1 py-3 px-4 text-center font-semibold transition-colors"
              style={{
                color: activeTab === 'forYou' ? '#1d9bf0' : '#536471',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'forYou' ? '3px solid #1d9bf0' : '3px solid transparent'
              }}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className="flex-1 py-3 px-4 text-center font-semibold transition-colors"
              style={{
                color: activeTab === 'all' ? '#1d9bf0' : '#536471',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'all' ? '3px solid #1d9bf0' : '3px solid transparent'
              }}
            >
              All Tweets
            </button>
          </div>

          {loadingTweets ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-600">Loading tweets...</p>
            </div>
          ) : filteredTweets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
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
  );
}

export default Home;
