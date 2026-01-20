import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

function Home() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tweetContent, setTweetContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [posting, setPosting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tweets, setTweets] = useState([]);
  const [loadingTweets, setLoadingTweets] = useState(true);
  const [deletingTweetId, setDeletingTweetId] = useState(null);
  const [likingTweetId, setLikingTweetId] = useState(null);
  const [activeTab, setActiveTab] = useState('forYou');
  const [expandedTweetId, setExpandedTweetId] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const [postingReply, setPostingReply] = useState(null);
  const [tweetReplies, setTweetReplies] = useState({});
  const [deletingReplyId, setDeletingReplyId] = useState(null);
  const [editingTweetId, setEditingTweetId] = useState(null);
  const [editContent, setEditContent] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState({});
  const [savingReplyEdit, setSavingReplyEdit] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch current user data
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'tweets'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tweetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTweets(tweetsData);
      setLoadingTweets(false);
    }, (error) => {
      console.error('Error fetching tweets:', error);
      setLoadingTweets(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch replies for all tweets
  useEffect(() => {
    if (tweets.length === 0) return;

    const unsubscribes = tweets.map(tweet => {
      const repliesRef = collection(db, 'tweets', tweet.id, 'replies');
      const q = query(repliesRef, orderBy('createdAt', 'asc'));

      return onSnapshot(q, (snapshot) => {
        const repliesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTweetReplies(prev => ({
          ...prev,
          [tweet.id]: repliesData
        }));
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [tweets]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';

    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTweetChange = (e) => {
    const content = e.target.value;
    if (content.length <= 280) {
      setTweetContent(content);
      setCharCount(content.length);
    }
  };

  const handlePostTweet = async (e) => {
    e.preventDefault();

    if (!tweetContent.trim()) {
      setErrorMessage('Tweet cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setPosting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await addDoc(collection(db, 'tweets'), {
        content: tweetContent,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        likes: []
      });

      setSuccessMessage('Tweet posted successfully!');
      setTweetContent('');
      setCharCount(0);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error posting tweet:', error);
      setErrorMessage('Failed to post tweet. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this tweet?');

    if (!confirmDelete) return;

    setDeletingTweetId(tweetId);

    try {
      await deleteDoc(doc(db, 'tweets', tweetId));
      setSuccessMessage('Tweet deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting tweet:', error);
      setErrorMessage('Failed to delete tweet. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setDeletingTweetId(null);
    }
  };

  const handleLikeTweet = async (tweetId, currentLikes) => {
    if (!user) return;

    setLikingTweetId(tweetId);

    const hasLiked = currentLikes.includes(user.uid);

    try {
      const tweetRef = doc(db, 'tweets', tweetId);

      if (hasLiked) {
        await updateDoc(tweetRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(tweetRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error('Error liking tweet:', error);
      setErrorMessage('Failed to like tweet. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLikingTweetId(null);
    }
  };

  const toggleReplies = (tweetId) => {
    setExpandedTweetId(prev => prev === tweetId ? null : tweetId);
  };

  const handleReplyChange = (tweetId, content) => {
    setReplyContent(prev => ({
      ...prev,
      [tweetId]: content
    }));
  };

  const handlePostReply = async (tweetId) => {
    if (!user || !replyContent[tweetId]?.trim()) return;

    setPostingReply(tweetId);

    try {
      const repliesRef = collection(db, 'tweets', tweetId, 'replies');
      await addDoc(repliesRef, {
        content: replyContent[tweetId],
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp()
      });

      setReplyContent(prev => ({
        ...prev,
        [tweetId]: ''
      }));
    } catch (error) {
      console.error('Error posting reply:', error);
      setErrorMessage('Failed to post reply. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setPostingReply(null);
    }
  };

  const handleDeleteReply = async (tweetId, replyId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this reply?');
    if (!confirmDelete) return;

    setDeletingReplyId(replyId);

    try {
      await deleteDoc(doc(db, 'tweets', tweetId, 'replies', replyId));
    } catch (error) {
      console.error('Error deleting reply:', error);
      setErrorMessage('Failed to delete reply. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setDeletingReplyId(null);
    }
  };

  const canEditTweet = (tweet) => {
    if (!tweet.createdAt || tweet.userId !== user?.uid) return false;

    const now = new Date();
    const tweetTime = tweet.createdAt.toDate();
    const diffInMinutes = (now - tweetTime) / (1000 * 60);

    return diffInMinutes < 5;
  };

  const handleEditTweet = (tweetId, currentContent) => {
    setEditingTweetId(tweetId);
    setEditContent(prev => ({
      ...prev,
      [tweetId]: currentContent
    }));
  };

  const handleEditChange = (tweetId, content) => {
    if (content.length <= 280) {
      setEditContent(prev => ({
        ...prev,
        [tweetId]: content
      }));
    }
  };

  const handleSaveEdit = async (tweetId) => {
    if (!editContent[tweetId]?.trim()) {
      setErrorMessage('Tweet cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSavingEdit(true);

    try {
      await updateDoc(doc(db, 'tweets', tweetId), {
        content: editContent[tweetId],
        edited: serverTimestamp()
      });

      setSuccessMessage('Tweet updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingTweetId(null);
      setEditContent(prev => {
        const newContent = { ...prev };
        delete newContent[tweetId];
        return newContent;
      });
    } catch (error) {
      console.error('Error editing tweet:', error);
      setErrorMessage('Failed to edit tweet. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelEdit = (tweetId) => {
    setEditingTweetId(null);
    setEditContent(prev => {
      const newContent = { ...prev };
      delete newContent[tweetId];
      return newContent;
    });
  };

  const canEditReply = (reply) => {
    if (!reply.createdAt || reply.userId !== user?.uid) return false;

    const now = new Date();
    const replyTime = reply.createdAt.toDate();
    const diffInMinutes = (now - replyTime) / (1000 * 60);

    return diffInMinutes < 5;
  };

  const handleEditReply = (replyId, currentContent) => {
    setEditingReplyId(replyId);
    setEditReplyContent(prev => ({
      ...prev,
      [replyId]: currentContent
    }));
  };

  const handleEditReplyChange = (replyId, content) => {
    if (content.length <= 280) {
      setEditReplyContent(prev => ({
        ...prev,
        [replyId]: content
      }));
    }
  };

  const handleSaveReplyEdit = async (tweetId, replyId) => {
    if (!editReplyContent[replyId]?.trim()) {
      setErrorMessage('Reply cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSavingReplyEdit(true);

    try {
      await updateDoc(doc(db, 'tweets', tweetId, 'replies', replyId), {
        content: editReplyContent[replyId],
        edited: serverTimestamp()
      });

      setSuccessMessage('Reply updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingReplyId(null);
      setEditReplyContent(prev => {
        const newContent = { ...prev };
        delete newContent[replyId];
        return newContent;
      });
    } catch (error) {
      console.error('Error editing reply:', error);
      setErrorMessage('Failed to edit reply. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingReplyEdit(false);
    }
  };

  const handleCancelReplyEdit = (replyId) => {
    setEditingReplyId(null);
    setEditReplyContent(prev => {
      const newContent = { ...prev };
      delete newContent[replyId];
      return newContent;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Filter tweets based on active tab
  const filteredTweets = activeTab === 'forYou'
    ? tweets.filter(tweet =>
        userData?.following?.includes(tweet.userId) || tweet.userId === user?.uid
      )
    : tweets;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Create Tweet Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create Tweet</h2>

          {successMessage && (
            <div className="bg-green-50 border-2 border-green-500 px-4 py-3 rounded-lg mb-4">
              <span style={{ color: '#16a34a' }}>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border-2 border-red-600 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-start">
                <span className="mr-3 text-xl" style={{ color: '#dc2626' }}>⚠</span>
                <span style={{ color: '#dc2626' }}>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handlePostTweet}>
            <textarea
              value={tweetContent}
              onChange={handleTweetChange}
              placeholder="What's happening?"
              disabled={posting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-none text-gray-900"
              rows="4"
            />

            <div className="flex items-center justify-between mt-3">
              <span className={`text-sm ${charCount === 280 ? 'font-bold' : charCount >= 260 ? 'font-semibold' : ''}`} style={{ color: charCount === 280 ? '#dc2626' : charCount >= 260 ? '#ea580c' : '#4b5563' }}>
                {charCount}/280
              </span>
              <button
                type="submit"
                disabled={posting || !tweetContent.trim()}
                className="px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2563eb', color: 'white' }}
                onMouseEnter={(e) => !posting && tweetContent.trim() && (e.target.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                {posting ? 'Posting...' : 'Post tweet'}
              </button>
            </div>
          </form>
        </div>

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
                <div key={tweet.id} className="border border-gray-200 rounded-lg p-4 shadow-sm relative">
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
                      {tweet.userId === user?.uid && (
                        <>
                          {canEditTweet(tweet) && editingTweetId !== tweet.id && (
                            <button
                              onClick={() => handleEditTweet(tweet.id, tweet.content)}
                              className="text-sm px-2 py-1 rounded transition-colors"
                              style={{
                                color: '#2563eb',
                                backgroundColor: 'transparent',
                                border: 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#eff6ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Edit tweet"
                            >
                              ✎
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTweet(tweet.id)}
                            disabled={deletingTweetId === tweet.id}
                            className="text-sm px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              color: '#dc2626',
                              backgroundColor: 'transparent',
                              border: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (deletingTweetId !== tweet.id) {
                                e.currentTarget.style.backgroundColor = '#fef2f2';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Delete tweet"
                          >
                            {deletingTweetId === tweet.id ? '...' : '✕'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tweet Content or Edit Mode */}
                  {editingTweetId === tweet.id ? (
                    <div className="mb-3">
                      <textarea
                        value={editContent[tweet.id] || ''}
                        onChange={(e) => handleEditChange(tweet.id, e.target.value)}
                        className="w-full p-3 border border-blue-500 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        rows="3"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm" style={{ color: (editContent[tweet.id]?.length || 0) === 280 ? '#dc2626' : (editContent[tweet.id]?.length || 0) >= 260 ? '#ea580c' : '#4b5563' }}>
                          {editContent[tweet.id]?.length || 0}/280
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(tweet.id)}
                            disabled={savingEdit || !editContent[tweet.id]?.trim()}
                            className="px-4 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            {savingEdit ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => handleCancelEdit(tweet.id)}
                            className="px-4 py-1 rounded-md text-sm font-medium"
                            style={{
                              backgroundColor: 'transparent',
                              color: '#6b7280',
                              border: '1px solid #d1d5db'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 mb-3">{tweet.content}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLikeTweet(tweet.id, tweet.likes || [])}
                      disabled={likingTweetId === tweet.id}
                      className="flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: tweet.likes?.includes(user?.uid) ? '#dc2626' : '#6b7280',
                        backgroundColor: 'transparent',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (likingTweetId !== tweet.id) {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="text-lg">
                        {tweet.likes?.includes(user?.uid) ? '♥' : '♡'}
                      </span>
                      <span>{tweet.likes?.length || 0}</span>
                    </button>

                    <button
                      onClick={() => toggleReplies(tweet.id)}
                      className="flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors"
                      style={{
                        color: '#6b7280',
                        backgroundColor: 'transparent',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="text-lg">💬</span>
                      <span>{tweetReplies[tweet.id]?.length || 0}</span>
                    </button>
                  </div>

                  {/* Reply Section */}
                  {expandedTweetId === tweet.id && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      {/* Reply Form */}
                      <div className="mb-4">
                        <textarea
                          value={replyContent[tweet.id] || ''}
                          onChange={(e) => handleReplyChange(tweet.id, e.target.value)}
                          placeholder="Write your reply..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          rows="2"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handlePostReply(tweet.id)}
                            disabled={postingReply === tweet.id || !replyContent[tweet.id]?.trim()}
                            className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            {postingReply === tweet.id ? 'Posting...' : 'Post Reply'}
                          </button>
                          <button
                            onClick={() => toggleReplies(tweet.id)}
                            className="px-4 py-2 rounded-md text-sm font-medium"
                            style={{
                              backgroundColor: 'transparent',
                              color: '#6b7280',
                              border: '1px solid #d1d5db'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                      {/* Replies List */}
                      {tweetReplies[tweet.id]?.length > 0 && (
                        <div className="space-y-3">
                          {tweetReplies[tweet.id].map((reply) => (
                            <div key={reply.id} className="bg-gray-50 rounded-lg p-3 ml-4">
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
                                  {reply.userId === user?.uid && (
                                    <>
                                      {canEditReply(reply) && editingReplyId !== reply.id && (
                                        <button
                                          onClick={() => handleEditReply(reply.id, reply.content)}
                                          className="text-xs px-1 py-1 rounded transition-colors"
                                          style={{
                                            color: '#2563eb',
                                            backgroundColor: 'transparent',
                                            border: 'none'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#eff6ff';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                          title="Edit reply"
                                        >
                                          ✎
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDeleteReply(tweet.id, reply.id)}
                                        disabled={deletingReplyId === reply.id}
                                        className="text-xs px-1 py-1 rounded transition-colors disabled:opacity-50"
                                        style={{
                                          color: '#dc2626',
                                          backgroundColor: 'transparent',
                                          border: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (deletingReplyId !== reply.id) {
                                            e.currentTarget.style.backgroundColor = '#fef2f2';
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                        title="Delete reply"
                                      >
                                        {deletingReplyId === reply.id ? '...' : '✕'}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Reply Content or Edit Mode */}
                              {editingReplyId === reply.id ? (
                                <div className="mt-2">
                                  <textarea
                                    value={editReplyContent[reply.id] || ''}
                                    onChange={(e) => handleEditReplyChange(reply.id, e.target.value)}
                                    className="w-full p-2 border border-blue-500 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                                    rows="2"
                                  />
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs" style={{ color: (editReplyContent[reply.id]?.length || 0) === 280 ? '#dc2626' : (editReplyContent[reply.id]?.length || 0) >= 260 ? '#ea580c' : '#4b5563' }}>
                                      {editReplyContent[reply.id]?.length || 0}/280
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveReplyEdit(tweet.id, reply.id)}
                                        disabled={savingReplyEdit || !editReplyContent[reply.id]?.trim()}
                                        className="px-3 py-1 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                          backgroundColor: '#2563eb',
                                          color: 'white',
                                          border: 'none'
                                        }}
                                      >
                                        {savingReplyEdit ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        onClick={() => handleCancelReplyEdit(reply.id)}
                                        className="px-3 py-1 rounded-md text-xs font-medium"
                                        style={{
                                          backgroundColor: 'transparent',
                                          color: '#6b7280',
                                          border: '1px solid #d1d5db'
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-700">{reply.content}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
