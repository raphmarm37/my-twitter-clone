import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [profileUserData, setProfileUserData] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTweets, setLoadingTweets] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setLoading(false);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch current user data
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentUserData(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch profile user data
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        setProfileUserData(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Fetch user's tweets (without orderBy to avoid index requirement)
    const q = query(
      collection(db, 'tweets'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tweetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort in JavaScript instead
      tweetsData.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });

      setTweets(tweetsData);
      setLoadingTweets(false);

      // Get profile user info from first tweet
      if (tweetsData.length > 0) {
        setProfileUser({
          email: tweetsData[0].userEmail,
          userId: tweetsData[0].userId,
          createdAt: tweetsData[0].createdAt
        });
      } else {
        // If no tweets, try to get user info from auth
        setProfileUser({
          email: 'User',
          userId: userId,
          createdAt: null
        });
      }
    }, (error) => {
      console.error('Error fetching tweets:', error);
      setLoadingTweets(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!currentUser || !userId) {
      console.log('Missing user or userId');
      return;
    }

    setFollowLoading(true);

    try {
      // Check if current user document exists, create if not
      const currentUserDocRef = doc(db, 'users', currentUser.uid);
      const currentUserDocSnap = await getDoc(currentUserDocRef);

      if (!currentUserDocSnap.exists()) {
        console.log('Creating current user document');
        await setDoc(currentUserDocRef, {
          email: currentUser.email,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          followers: [],
          following: []
        });
      }

      // Check if profile user document exists, create if not
      const profileUserDocRef = doc(db, 'users', userId);
      const profileUserDocSnap = await getDoc(profileUserDocRef);

      if (!profileUserDocSnap.exists()) {
        console.log('Creating profile user document');
        // Get email from first tweet if available
        const userEmail = profileUser?.email || 'user@example.com';
        await setDoc(profileUserDocRef, {
          email: userEmail,
          userId: userId,
          createdAt: serverTimestamp(),
          followers: [],
          following: []
        });
      }

      // Now perform the follow/unfollow action
      const currentData = currentUserDocSnap.exists() ? currentUserDocSnap.data() : { following: [] };
      const isFollowing = currentData.following?.includes(userId);

      console.log('Is following:', isFollowing);

      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserDocRef, {
          following: arrayRemove(userId)
        });
        await updateDoc(profileUserDocRef, {
          followers: arrayRemove(currentUser.uid)
        });
        console.log('Unfollowed successfully');
      } else {
        // Follow
        await updateDoc(currentUserDocRef, {
          following: arrayUnion(userId)
        });
        await updateDoc(profileUserDocRef, {
          followers: arrayUnion(currentUser.uid)
        });
        console.log('Followed successfully');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to follow/unfollow. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

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

  const formatAccountDate = (timestamp) => {
    if (!timestamp) return 'Recently';

    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {profileUser?.email || 'Loading...'}
              </h1>
              <p className="text-gray-600 text-sm">
                Joined {formatAccountDate(tweets[0]?.createdAt)}
              </p>
            </div>
            {isOwnProfile ? (
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className="px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentUserData?.following?.includes(userId) ? 'transparent' : '#1d9bf0',
                  color: currentUserData?.following?.includes(userId) ? '#1d9bf0' : 'white',
                  border: currentUserData?.following?.includes(userId) ? '2px solid #1d9bf0' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!followLoading) {
                    if (currentUserData?.following?.includes(userId)) {
                      e.currentTarget.style.backgroundColor = '#ffebee';
                      e.currentTarget.style.borderColor = '#dc2626';
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.textContent = 'Unfollow';
                    } else {
                      e.currentTarget.style.backgroundColor = '#1a8cd8';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (!followLoading) {
                    if (currentUserData?.following?.includes(userId)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = '#1d9bf0';
                      e.currentTarget.style.color = '#1d9bf0';
                      e.currentTarget.textContent = 'Following';
                    } else {
                      e.currentTarget.style.backgroundColor = '#1d9bf0';
                    }
                  }
                }}
              >
                {followLoading ? 'Loading...' : currentUserData?.following?.includes(userId) ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-bold text-gray-900">{tweets.length}</span>
              <span className="text-gray-600 ml-1">Tweets</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{profileUserData?.followers?.length || 0}</span>
              <span className="text-gray-600 ml-1">Followers</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{profileUserData?.following?.length || 0}</span>
              <span className="text-gray-600 ml-1">Following</span>
            </div>
          </div>
        </div>

        {/* User's Tweets */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tweets</h2>

          {loadingTweets ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-600">Loading tweets...</p>
            </div>
          ) : tweets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {isOwnProfile ? "You haven't posted any tweets yet." : "This user hasn't posted any tweets yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tweets.map((tweet) => (
                <div key={tweet.id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-900">{tweet.userEmail}</span>
                    <span className="text-sm text-gray-500">{formatTimestamp(tweet.createdAt)}</span>
                  </div>
                  <p className="text-gray-900 mb-3">{tweet.content}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm" style={{ color: '#6b7280' }}>
                      <span className="text-lg">♡</span>
                      <span>{tweet.likes?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm px-4 py-2 rounded"
            style={{
              color: '#3b82f6',
              backgroundColor: 'transparent',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
