import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const useTweets = (user) => {
  const [tweets, setTweets] = useState([]);
  const [loadingTweets, setLoadingTweets] = useState(true);
  const [tweetReplies, setTweetReplies] = useState({});

  // Track tweet IDs we're subscribed to
  const subscribedTweetIds = useRef(new Set());
  const replyUnsubscribes = useRef({});

  // Fetch tweets
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

  // Optimized replies subscription - only subscribe to new tweets
  useEffect(() => {
    const currentTweetIds = new Set(tweets.map(t => t.id));

    // Subscribe to new tweets
    tweets.forEach(tweet => {
      if (!subscribedTweetIds.current.has(tweet.id)) {
        const repliesRef = collection(db, 'tweets', tweet.id, 'replies');
        const q = query(repliesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const repliesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          setTweetReplies(prev => ({
            ...prev,
            [tweet.id]: repliesData
          }));
        });

        replyUnsubscribes.current[tweet.id] = unsubscribe;
        subscribedTweetIds.current.add(tweet.id);
      }
    });

    // Unsubscribe from deleted tweets
    subscribedTweetIds.current.forEach(tweetId => {
      if (!currentTweetIds.has(tweetId)) {
        replyUnsubscribes.current[tweetId]?.();
        delete replyUnsubscribes.current[tweetId];
        subscribedTweetIds.current.delete(tweetId);
        setTweetReplies(prev => {
          const newReplies = { ...prev };
          delete newReplies[tweetId];
          return newReplies;
        });
      }
    });

    return () => {
      Object.values(replyUnsubscribes.current).forEach(unsub => unsub());
      replyUnsubscribes.current = {};
      subscribedTweetIds.current.clear();
    };
  }, [tweets]);

  const postTweet = useCallback(async (content, imageUrl = null) => {
    if (!user) throw new Error('User not authenticated');

    await addDoc(collection(db, 'tweets'), {
      content,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
      likes: [],
      ...(imageUrl && { imageUrl })
    });
  }, [user]);

  const deleteTweet = useCallback(async (tweetId) => {
    await deleteDoc(doc(db, 'tweets', tweetId));
  }, []);

  const updateTweet = useCallback(async (tweetId, content, imageUrl, removeImage = false) => {
    const updateData = {
      content,
      edited: serverTimestamp()
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    } else if (removeImage) {
      updateData.imageUrl = null;
    }

    await updateDoc(doc(db, 'tweets', tweetId), updateData);
  }, []);

  const likeTweet = useCallback(async (tweetId, currentLikes) => {
    if (!user) return;

    const hasLiked = currentLikes.includes(user.uid);
    const tweetRef = doc(db, 'tweets', tweetId);

    if (hasLiked) {
      await updateDoc(tweetRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(tweetRef, { likes: arrayUnion(user.uid) });
    }
  }, [user]);

  const postReply = useCallback(async (tweetId, content, imageUrl = null) => {
    if (!user) throw new Error('User not authenticated');

    const repliesRef = collection(db, 'tweets', tweetId, 'replies');
    await addDoc(repliesRef, {
      content,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
      likes: [],
      ...(imageUrl && { imageUrl })
    });
  }, [user]);

  const likeReply = useCallback(async (tweetId, replyId, currentLikes) => {
    if (!user) return;

    const hasLiked = currentLikes.includes(user.uid);
    const replyRef = doc(db, 'tweets', tweetId, 'replies', replyId);

    if (hasLiked) {
      await updateDoc(replyRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(replyRef, { likes: arrayUnion(user.uid) });
    }
  }, [user]);

  const deleteReply = useCallback(async (tweetId, replyId) => {
    await deleteDoc(doc(db, 'tweets', tweetId, 'replies', replyId));
  }, []);

  const updateReply = useCallback(async (tweetId, replyId, content, imageUrl, removeImage = false) => {
    const updateData = {
      content,
      edited: serverTimestamp()
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    } else if (removeImage) {
      updateData.imageUrl = null;
    }

    await updateDoc(doc(db, 'tweets', tweetId, 'replies', replyId), updateData);
  }, []);

  return {
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
  };
};
