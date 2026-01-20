import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { formatTimestamp } from '../utils/formatters';

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

  const formatAccountDate = (timestamp) => {
    if (!timestamp) return 'Recently';

    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

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

  const isOwnProfile = currentUser?.uid === userId;
  const isFollowing = currentUserData?.following?.includes(userId);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        padding: 'var(--space-6) var(--space-4)'
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Profile Header */}
        <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          <div className="flex items-start justify-between" style={{ marginBottom: 'var(--space-4)' }}>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-1)'
              }}>
                {profileUser?.email || 'Loading...'}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Joined {formatAccountDate(tweets[0]?.createdAt)}
              </p>
            </div>
            {isOwnProfile ? (
              <button className="btn-secondary">
                Edit Profile
              </button>
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

          <div className="flex gap-4" style={{ fontSize: '14px' }}>
            <div>
              <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{tweets.length}</span>
              <span style={{ color: 'var(--color-text-secondary)', marginLeft: '4px' }}>Tweets</span>
            </div>
            <div>
              <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{profileUserData?.followers?.length || 0}</span>
              <span style={{ color: 'var(--color-text-secondary)', marginLeft: '4px' }}>Followers</span>
            </div>
            <div>
              <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{profileUserData?.following?.length || 0}</span>
              <span style={{ color: 'var(--color-text-secondary)', marginLeft: '4px' }}>Following</span>
            </div>
          </div>
        </div>

        {/* User's Tweets */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--color-text-primary)'
            }}>
              Tweets
            </h2>
          </div>

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
            ) : tweets.length === 0 ? (
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
                  {isOwnProfile ? "You haven't posted any tweets yet." : "This user hasn't posted any tweets yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tweets.map((tweet) => (
                  <div key={tweet.id} className="tweet-card">
                    <div className="flex items-center justify-between">
                      <span className="username" style={{ fontSize: '14px' }}>{tweet.userEmail}</span>
                      <span className="timestamp">{formatTimestamp(tweet.createdAt)}</span>
                    </div>
                    <p style={{
                      color: 'var(--color-text-primary)',
                      fontSize: '15px',
                      lineHeight: '1.5',
                      marginTop: 'var(--space-1)'
                    }}>
                      {tweet.content}
                    </p>
                    {tweet.imageUrl && (
                      <div style={{ marginTop: 'var(--space-3)' }}>
                        <img
                          src={tweet.imageUrl}
                          alt="Tweet image"
                          className="tweet-image"
                          onClick={() => window.open(tweet.imageUrl, '_blank')}
                        />
                      </div>
                    )}
                    <div style={{ marginTop: 'var(--space-3)' }}>
                      <span className="action-btn like" style={{ cursor: 'default' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
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
        <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            className="btn-link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
