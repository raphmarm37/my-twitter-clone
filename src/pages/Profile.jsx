import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { formatTimestamp } from '../utils/formatters';
import { HeartIcon, CommentIcon, ArrowLeftIcon } from '../components/common/Icons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

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

    const q = query(
      collection(db, 'tweets'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tweetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      tweetsData.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });

      setTweets(tweetsData);
      setLoadingTweets(false);

      if (tweetsData.length > 0) {
        setProfileUser({
          email: tweetsData[0].userEmail,
          userId: tweetsData[0].userId,
          createdAt: tweetsData[0].createdAt
        });
      } else {
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
    if (!currentUser || !userId) return;

    setFollowLoading(true);

    try {
      const currentUserDocRef = doc(db, 'users', currentUser.uid);
      const currentUserDocSnap = await getDoc(currentUserDocRef);

      if (!currentUserDocSnap.exists()) {
        await setDoc(currentUserDocRef, {
          email: currentUser.email,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          followers: [],
          following: []
        });
      }

      const profileUserDocRef = doc(db, 'users', userId);
      const profileUserDocSnap = await getDoc(profileUserDocRef);

      if (!profileUserDocSnap.exists()) {
        const userEmail = profileUser?.email || 'user@example.com';
        await setDoc(profileUserDocRef, {
          email: userEmail,
          userId: userId,
          createdAt: serverTimestamp(),
          followers: [],
          following: []
        });
      }

      const currentData = currentUserDocSnap.exists() ? currentUserDocSnap.data() : { following: [] };
      const isFollowing = currentData.following?.includes(userId);

      if (isFollowing) {
        await updateDoc(currentUserDocRef, { following: arrayRemove(userId) });
        await updateDoc(profileUserDocRef, { followers: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(currentUserDocRef, { following: arrayUnion(userId) });
        await updateDoc(profileUserDocRef, { followers: arrayUnion(currentUser.uid) });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to follow/unfollow. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  const formatAccountDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" text="Loading..." />
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;
  const isFollowing = currentUserData?.following?.includes(userId);
  const emptyMessage = isOwnProfile
    ? "You haven't posted any tweets yet."
    : "This user hasn't posted any tweets yet.";

  return (
    <div
      className="min-h-screen"
      style={{
        padding: 'var(--space-6) var(--space-4)'
      }}
    >
      <div className="max-w-xl mx-auto">
        {/* Profile Header */}
        <div className="card p-5 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {profileUser?.email || 'Loading...'}
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Joined {formatAccountDate(tweets[0]?.createdAt)}
              </p>
            </div>
            {isOwnProfile ? (
              <button className="btn-secondary">Edit Profile</button>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={isFollowing ? 'btn-follow following' : 'btn-follow'}
              >
                {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{tweets.length}</span>
              <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>Tweets</span>
            </div>
            <div>
              <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{profileUserData?.followers?.length || 0}</span>
              <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>Followers</span>
            </div>
            <div>
              <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{profileUserData?.following?.length || 0}</span>
              <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>Following</span>
            </div>
          </div>
        </div>

        {/* User's Tweets */}
        <div className="card overflow-hidden">
          <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Tweets
            </h2>
          </div>

          <div className="p-4">
            {loadingTweets ? (
              <LoadingSpinner size="sm" text="Loading tweets..." />
            ) : tweets.length === 0 ? (
              <EmptyState icon={CommentIcon} message={emptyMessage} />
            ) : (
              <div className="space-y-4">
                {tweets.map((tweet) => (
                  <div key={tweet.id} className="tweet-card">
                    <div className="flex items-center justify-between">
                      <span className="username text-sm">{tweet.userEmail}</span>
                      <span className="timestamp">{formatTimestamp(tweet.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-[15px] leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                      {tweet.content}
                    </p>
                    {tweet.imageUrl && (
                      <div className="mt-3">
                        <img
                          src={tweet.imageUrl}
                          alt="Tweet image"
                          className="tweet-image"
                          onClick={() => window.open(tweet.imageUrl, '_blank')}
                        />
                      </div>
                    )}
                    <div className="mt-3">
                      <span className="action-btn like cursor-default">
                        <HeartIcon size={16} />
                        <span>{tweet.likes?.length || 0}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-5 text-center">
          <button onClick={() => navigate('/')} className="btn-link">
            <ArrowLeftIcon size={16} />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
