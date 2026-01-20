import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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
  // Edit image states
  const [editTweetImage, setEditTweetImage] = useState({});
  const [editTweetImagePreview, setEditTweetImagePreview] = useState({});
  const [editTweetImageRemoved, setEditTweetImageRemoved] = useState({});
  const [editReplyImage, setEditReplyImage] = useState({});
  const [editReplyImagePreview, setEditReplyImagePreview] = useState({});
  const [editReplyImageRemoved, setEditReplyImageRemoved] = useState({});
  const editTweetImageInputRefs = useRef({});
  const editReplyImageInputRefs = useRef({});
  // Image upload states for tweet
  const [tweetImage, setTweetImage] = useState(null);
  const [tweetImagePreview, setTweetImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  // Image upload states for replies
  const [replyImages, setReplyImages] = useState({});
  const [replyImagePreviews, setReplyImagePreviews] = useState({});
  const [replyUploadProgress, setReplyUploadProgress] = useState({});
  const [replyUploading, setReplyUploading] = useState({});
  const tweetImageInputRef = useRef(null);
  const replyImageInputRefs = useRef({});
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

    if (!tweetContent.trim() && !tweetImage) {
      setErrorMessage('Tweet cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setPosting(true);
    setUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let imageUrl = null;

      // Upload image if selected
      if (tweetImage) {
        const fileName = `tweets/${user.uid}/${Date.now()}_${tweetImage.name}`;
        try {
          imageUrl = await uploadImage(tweetImage, fileName);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setErrorMessage('Failed to upload image. Please try again.');
          setTimeout(() => setErrorMessage(''), 3000);
          setPosting(false);
          setUploading(false);
          return;
        }
      }

      await addDoc(collection(db, 'tweets'), {
        content: tweetContent,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        likes: [],
        ...(imageUrl && { imageUrl })
      });

      setSuccessMessage('Tweet posted successfully!');
      setTweetContent('');
      setCharCount(0);
      handleRemoveTweetImage();
      setUploadProgress(0);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error posting tweet:', error);
      setErrorMessage('Failed to post tweet. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setPosting(false);
      setUploading(false);
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
    if (!user || (!replyContent[tweetId]?.trim() && !replyImages[tweetId])) return;

    setPostingReply(tweetId);
    setReplyUploading(prev => ({ ...prev, [tweetId]: true }));

    try {
      let imageUrl = null;

      // Upload image if selected
      if (replyImages[tweetId]) {
        const fileName = `replies/${user.uid}/${Date.now()}_${replyImages[tweetId].name}`;
        try {
          imageUrl = await uploadReplyImage(replyImages[tweetId], fileName, tweetId);
        } catch (uploadError) {
          console.error('Error uploading reply image:', uploadError);
          setErrorMessage('Failed to upload image. Please try again.');
          setTimeout(() => setErrorMessage(''), 3000);
          setPostingReply(null);
          setReplyUploading(prev => ({ ...prev, [tweetId]: false }));
          return;
        }
      }

      const repliesRef = collection(db, 'tweets', tweetId, 'replies');
      await addDoc(repliesRef, {
        content: replyContent[tweetId] || '',
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        ...(imageUrl && { imageUrl })
      });

      setReplyContent(prev => ({
        ...prev,
        [tweetId]: ''
      }));
      handleRemoveReplyImage(tweetId);
      setReplyUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[tweetId];
        return newProgress;
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      setErrorMessage('Failed to post reply. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setPostingReply(null);
      setReplyUploading(prev => ({ ...prev, [tweetId]: false }));
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

  const handleEditTweet = (tweetId, currentContent, currentImageUrl) => {
    setEditingTweetId(tweetId);
    setEditContent(prev => ({
      ...prev,
      [tweetId]: currentContent
    }));
    // Reset edit image states
    setEditTweetImage(prev => ({ ...prev, [tweetId]: null }));
    setEditTweetImagePreview(prev => ({ ...prev, [tweetId]: currentImageUrl || null }));
    setEditTweetImageRemoved(prev => ({ ...prev, [tweetId]: false }));
  };

  const handleEditChange = (tweetId, content) => {
    if (content.length <= 280) {
      setEditContent(prev => ({
        ...prev,
        [tweetId]: content
      }));
    }
  };

  const handleSaveEdit = async (tweetId, originalImageUrl) => {
    if (!editContent[tweetId]?.trim() && !editTweetImagePreview[tweetId]) {
      setErrorMessage('Tweet cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSavingEdit(true);

    try {
      let imageUrl = originalImageUrl;

      // If a new image was selected, upload it
      if (editTweetImage[tweetId]) {
        const fileName = `tweets/${user.uid}/${Date.now()}_${editTweetImage[tweetId].name}`;
        try {
          imageUrl = await uploadImage(editTweetImage[tweetId], fileName);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setErrorMessage('Failed to upload image. Please try again.');
          setTimeout(() => setErrorMessage(''), 3000);
          setSavingEdit(false);
          return;
        }
      } else if (editTweetImageRemoved[tweetId]) {
        // Image was removed
        imageUrl = null;
      }

      const updateData = {
        content: editContent[tweetId] || '',
        edited: serverTimestamp()
      };

      // Update imageUrl field
      if (imageUrl) {
        updateData.imageUrl = imageUrl;
      } else if (editTweetImageRemoved[tweetId] || (originalImageUrl && !editTweetImagePreview[tweetId])) {
        // Remove the imageUrl field if image was removed
        updateData.imageUrl = null;
      }

      await updateDoc(doc(db, 'tweets', tweetId), updateData);

      setSuccessMessage('Tweet updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingTweetId(null);
      setEditContent(prev => {
        const newContent = { ...prev };
        delete newContent[tweetId];
        return newContent;
      });
      // Clear edit image states
      setEditTweetImage(prev => {
        const newState = { ...prev };
        delete newState[tweetId];
        return newState;
      });
      setEditTweetImagePreview(prev => {
        const newState = { ...prev };
        delete newState[tweetId];
        return newState;
      });
      setEditTweetImageRemoved(prev => {
        const newState = { ...prev };
        delete newState[tweetId];
        return newState;
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
    // Clear edit image states
    setEditTweetImage(prev => {
      const newState = { ...prev };
      delete newState[tweetId];
      return newState;
    });
    setEditTweetImagePreview(prev => {
      const newState = { ...prev };
      delete newState[tweetId];
      return newState;
    });
    setEditTweetImageRemoved(prev => {
      const newState = { ...prev };
      delete newState[tweetId];
      return newState;
    });
  };

  // Handle edit tweet image selection
  const handleEditTweetImageSelect = (tweetId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      setTimeout(() => setErrorMessage(''), 3000);
      e.target.value = '';
      return;
    }

    setEditTweetImage(prev => ({ ...prev, [tweetId]: file }));
    const previewUrl = URL.createObjectURL(file);
    setEditTweetImagePreview(prev => ({ ...prev, [tweetId]: previewUrl }));
    setEditTweetImageRemoved(prev => ({ ...prev, [tweetId]: false }));
  };

  // Remove edit tweet image
  const handleRemoveEditTweetImage = (tweetId) => {
    setEditTweetImage(prev => {
      const newState = { ...prev };
      delete newState[tweetId];
      return newState;
    });
    if (editTweetImagePreview[tweetId] && editTweetImagePreview[tweetId].startsWith('blob:')) {
      URL.revokeObjectURL(editTweetImagePreview[tweetId]);
    }
    setEditTweetImagePreview(prev => ({ ...prev, [tweetId]: null }));
    setEditTweetImageRemoved(prev => ({ ...prev, [tweetId]: true }));
    if (editTweetImageInputRefs.current[tweetId]) {
      editTweetImageInputRefs.current[tweetId].value = '';
    }
  };

  const canEditReply = (reply) => {
    if (!reply.createdAt || reply.userId !== user?.uid) return false;

    const now = new Date();
    const replyTime = reply.createdAt.toDate();
    const diffInMinutes = (now - replyTime) / (1000 * 60);

    return diffInMinutes < 5;
  };

  const handleEditReply = (replyId, currentContent, currentImageUrl) => {
    setEditingReplyId(replyId);
    setEditReplyContent(prev => ({
      ...prev,
      [replyId]: currentContent
    }));
    // Reset edit image states
    setEditReplyImage(prev => ({ ...prev, [replyId]: null }));
    setEditReplyImagePreview(prev => ({ ...prev, [replyId]: currentImageUrl || null }));
    setEditReplyImageRemoved(prev => ({ ...prev, [replyId]: false }));
  };

  const handleEditReplyChange = (replyId, content) => {
    if (content.length <= 280) {
      setEditReplyContent(prev => ({
        ...prev,
        [replyId]: content
      }));
    }
  };

  const handleSaveReplyEdit = async (tweetId, replyId, originalImageUrl) => {
    if (!editReplyContent[replyId]?.trim() && !editReplyImagePreview[replyId]) {
      setErrorMessage('Reply cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSavingReplyEdit(true);

    try {
      let imageUrl = originalImageUrl;

      // If a new image was selected, upload it
      if (editReplyImage[replyId]) {
        const fileName = `replies/${user.uid}/${Date.now()}_${editReplyImage[replyId].name}`;
        try {
          imageUrl = await uploadReplyImage(editReplyImage[replyId], fileName, tweetId);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setErrorMessage('Failed to upload image. Please try again.');
          setTimeout(() => setErrorMessage(''), 3000);
          setSavingReplyEdit(false);
          return;
        }
      } else if (editReplyImageRemoved[replyId]) {
        imageUrl = null;
      }

      const updateData = {
        content: editReplyContent[replyId] || '',
        edited: serverTimestamp()
      };

      if (imageUrl) {
        updateData.imageUrl = imageUrl;
      } else if (editReplyImageRemoved[replyId] || (originalImageUrl && !editReplyImagePreview[replyId])) {
        updateData.imageUrl = null;
      }

      await updateDoc(doc(db, 'tweets', tweetId, 'replies', replyId), updateData);

      setSuccessMessage('Reply updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingReplyId(null);
      setEditReplyContent(prev => {
        const newContent = { ...prev };
        delete newContent[replyId];
        return newContent;
      });
      // Clear edit image states
      setEditReplyImage(prev => {
        const newState = { ...prev };
        delete newState[replyId];
        return newState;
      });
      setEditReplyImagePreview(prev => {
        const newState = { ...prev };
        delete newState[replyId];
        return newState;
      });
      setEditReplyImageRemoved(prev => {
        const newState = { ...prev };
        delete newState[replyId];
        return newState;
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
    // Clear edit image states
    setEditReplyImage(prev => {
      const newState = { ...prev };
      delete newState[replyId];
      return newState;
    });
    setEditReplyImagePreview(prev => {
      const newState = { ...prev };
      delete newState[replyId];
      return newState;
    });
    setEditReplyImageRemoved(prev => {
      const newState = { ...prev };
      delete newState[replyId];
      return newState;
    });
  };

  // Handle edit reply image selection
  const handleEditReplyImageSelect = (replyId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      setTimeout(() => setErrorMessage(''), 3000);
      e.target.value = '';
      return;
    }

    setEditReplyImage(prev => ({ ...prev, [replyId]: file }));
    const previewUrl = URL.createObjectURL(file);
    setEditReplyImagePreview(prev => ({ ...prev, [replyId]: previewUrl }));
    setEditReplyImageRemoved(prev => ({ ...prev, [replyId]: false }));
  };

  // Remove edit reply image
  const handleRemoveEditReplyImage = (replyId) => {
    setEditReplyImage(prev => {
      const newState = { ...prev };
      delete newState[replyId];
      return newState;
    });
    if (editReplyImagePreview[replyId] && editReplyImagePreview[replyId].startsWith('blob:')) {
      URL.revokeObjectURL(editReplyImagePreview[replyId]);
    }
    setEditReplyImagePreview(prev => ({ ...prev, [replyId]: null }));
    setEditReplyImageRemoved(prev => ({ ...prev, [replyId]: true }));
    if (editReplyImageInputRefs.current[replyId]) {
      editReplyImageInputRefs.current[replyId].value = '';
    }
  };

  // Image validation
  const validateImage = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please select a JPG, PNG, GIF, or WebP image.' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File is too large. Maximum size is 5MB.' };
    }

    return { valid: true, error: null };
  };

  // Handle tweet image selection
  const handleTweetImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      setTimeout(() => setErrorMessage(''), 3000);
      e.target.value = '';
      return;
    }

    setTweetImage(file);
    const previewUrl = URL.createObjectURL(file);
    setTweetImagePreview(previewUrl);
  };

  // Remove tweet image
  const handleRemoveTweetImage = () => {
    setTweetImage(null);
    if (tweetImagePreview) {
      URL.revokeObjectURL(tweetImagePreview);
      setTweetImagePreview(null);
    }
    if (tweetImageInputRef.current) {
      tweetImageInputRef.current.value = '';
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = (file, path) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  // Handle reply image selection
  const handleReplyImageSelect = (tweetId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      setTimeout(() => setErrorMessage(''), 3000);
      e.target.value = '';
      return;
    }

    setReplyImages(prev => ({ ...prev, [tweetId]: file }));
    const previewUrl = URL.createObjectURL(file);
    setReplyImagePreviews(prev => ({ ...prev, [tweetId]: previewUrl }));
  };

  // Remove reply image
  const handleRemoveReplyImage = (tweetId) => {
    setReplyImages(prev => {
      const newImages = { ...prev };
      delete newImages[tweetId];
      return newImages;
    });
    if (replyImagePreviews[tweetId]) {
      URL.revokeObjectURL(replyImagePreviews[tweetId]);
      setReplyImagePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[tweetId];
        return newPreviews;
      });
    }
    if (replyImageInputRefs.current[tweetId]) {
      replyImageInputRefs.current[tweetId].value = '';
    }
  };

  // Upload reply image to Firebase Storage
  const uploadReplyImage = (file, path, tweetId) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setReplyUploadProgress(prev => ({ ...prev, [tweetId]: progress }));
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
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

            {/* Image Preview */}
            {tweetImagePreview && (
              <div className="relative mt-3 inline-block">
                <img
                  src={tweetImagePreview}
                  alt="Preview"
                  className="max-h-64 rounded-lg border border-gray-200"
                  style={{ maxWidth: '100%', objectFit: 'contain' }}
                />
                <button
                  type="button"
                  onClick={handleRemoveTweetImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-600">Uploading image...</span>
                  <span className="text-sm font-medium" style={{ color: '#2563eb' }}>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%`, backgroundColor: '#2563eb' }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                {/* Image Upload Button */}
                <input
                  type="file"
                  ref={tweetImageInputRef}
                  onChange={handleTweetImageSelect}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  disabled={posting}
                />
                <button
                  type="button"
                  onClick={() => tweetImageInputRef.current?.click()}
                  disabled={posting || tweetImagePreview}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: '#2563eb', backgroundColor: 'transparent', border: '1px solid #2563eb' }}
                  onMouseEnter={(e) => {
                    if (!posting && !tweetImagePreview) {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }
                  }}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Add image (JPG, PNG, GIF, WebP - max 5MB)"
                >
                  <span>📷</span>
                  <span>Add Image</span>
                </button>
                <span className={`text-sm ${charCount === 280 ? 'font-bold' : charCount >= 260 ? 'font-semibold' : ''}`} style={{ color: charCount === 280 ? '#dc2626' : charCount >= 260 ? '#ea580c' : '#4b5563' }}>
                  {charCount}/280
                </span>
              </div>
              <button
                type="submit"
                disabled={posting || (!tweetContent.trim() && !tweetImage)}
                className="px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2563eb', color: 'white' }}
                onMouseEnter={(e) => !posting && (tweetContent.trim() || tweetImage) && (e.target.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                {uploading ? 'Uploading...' : posting ? 'Posting...' : 'Post tweet'}
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
                              onClick={() => handleEditTweet(tweet.id, tweet.content, tweet.imageUrl)}
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

                      {/* Edit Image Preview */}
                      {editTweetImagePreview[tweet.id] && (
                        <div className="relative mt-2 inline-block">
                          <img
                            src={editTweetImagePreview[tweet.id]}
                            alt="Edit preview"
                            className="max-h-48 rounded-lg border border-gray-200"
                            style={{ maxWidth: '100%', objectFit: 'contain' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditTweetImage(tweet.id)}
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

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {/* Edit Image Upload Button */}
                          <input
                            type="file"
                            ref={(el) => editTweetImageInputRefs.current[tweet.id] = el}
                            onChange={(e) => handleEditTweetImageSelect(tweet.id, e)}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            disabled={savingEdit}
                          />
                          <button
                            type="button"
                            onClick={() => editTweetImageInputRefs.current[tweet.id]?.click()}
                            disabled={savingEdit || editTweetImagePreview[tweet.id]}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ color: '#2563eb', backgroundColor: 'transparent', border: '1px solid #2563eb' }}
                            onMouseEnter={(e) => {
                              if (!savingEdit && !editTweetImagePreview[tweet.id]) {
                                e.currentTarget.style.backgroundColor = '#eff6ff';
                              }
                            }}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Change image"
                          >
                            <span>📷</span>
                          </button>
                          <span className="text-sm" style={{ color: (editContent[tweet.id]?.length || 0) === 280 ? '#dc2626' : (editContent[tweet.id]?.length || 0) >= 260 ? '#ea580c' : '#4b5563' }}>
                            {editContent[tweet.id]?.length || 0}/280
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(tweet.id, tweet.imageUrl)}
                            disabled={savingEdit || (!editContent[tweet.id]?.trim() && !editTweetImagePreview[tweet.id])}
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
                    <>
                      <p className="text-gray-900 mb-3">{tweet.content}</p>
                      {/* Tweet Image */}
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

                        {/* Reply Image Preview */}
                        {replyImagePreviews[tweet.id] && (
                          <div className="relative mt-2 inline-block">
                            <img
                              src={replyImagePreviews[tweet.id]}
                              alt="Reply preview"
                              className="max-h-40 rounded-lg border border-gray-200"
                              style={{ maxWidth: '100%', objectFit: 'contain' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveReplyImage(tweet.id)}
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

                        {/* Reply Upload Progress */}
                        {replyUploading[tweet.id] && replyUploadProgress[tweet.id] > 0 && replyUploadProgress[tweet.id] < 100 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-600">Uploading...</span>
                              <span className="text-xs font-medium" style={{ color: '#2563eb' }}>{replyUploadProgress[tweet.id]}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${replyUploadProgress[tweet.id]}%`, backgroundColor: '#2563eb' }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {/* Reply Image Upload Button */}
                            <input
                              type="file"
                              ref={(el) => replyImageInputRefs.current[tweet.id] = el}
                              onChange={(e) => handleReplyImageSelect(tweet.id, e)}
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="hidden"
                              disabled={postingReply === tweet.id}
                            />
                            <button
                              type="button"
                              onClick={() => replyImageInputRefs.current[tweet.id]?.click()}
                              disabled={postingReply === tweet.id || replyImagePreviews[tweet.id]}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ color: '#2563eb', backgroundColor: 'transparent', border: '1px solid #2563eb' }}
                              onMouseEnter={(e) => {
                                if (postingReply !== tweet.id && !replyImagePreviews[tweet.id]) {
                                  e.currentTarget.style.backgroundColor = '#eff6ff';
                                }
                              }}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              title="Add image"
                            >
                              <span>📷</span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePostReply(tweet.id)}
                              disabled={postingReply === tweet.id || (!replyContent[tweet.id]?.trim() && !replyImages[tweet.id])}
                              className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none'
                              }}
                            >
                              {replyUploading[tweet.id] ? 'Uploading...' : postingReply === tweet.id ? 'Posting...' : 'Post Reply'}
                            </button>
                            <button
                              onClick={() => {
                                toggleReplies(tweet.id);
                                handleRemoveReplyImage(tweet.id);
                              }}
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
                                          onClick={() => handleEditReply(reply.id, reply.content, reply.imageUrl)}
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

                                  {/* Edit Reply Image Preview */}
                                  {editReplyImagePreview[reply.id] && (
                                    <div className="relative mt-2 inline-block">
                                      <img
                                        src={editReplyImagePreview[reply.id]}
                                        alt="Edit reply preview"
                                        className="max-h-32 rounded-lg border border-gray-200"
                                        style={{ maxWidth: '100%', objectFit: 'contain' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveEditReplyImage(reply.id)}
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

                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                      {/* Edit Reply Image Upload Button */}
                                      <input
                                        type="file"
                                        ref={(el) => editReplyImageInputRefs.current[reply.id] = el}
                                        onChange={(e) => handleEditReplyImageSelect(reply.id, e)}
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        className="hidden"
                                        disabled={savingReplyEdit}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => editReplyImageInputRefs.current[reply.id]?.click()}
                                        disabled={savingReplyEdit || editReplyImagePreview[reply.id]}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ color: '#2563eb', backgroundColor: 'transparent', border: '1px solid #2563eb' }}
                                        onMouseEnter={(e) => {
                                          if (!savingReplyEdit && !editReplyImagePreview[reply.id]) {
                                            e.currentTarget.style.backgroundColor = '#eff6ff';
                                          }
                                        }}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        title="Change image"
                                      >
                                        <span>📷</span>
                                      </button>
                                      <span className="text-xs" style={{ color: (editReplyContent[reply.id]?.length || 0) === 280 ? '#dc2626' : (editReplyContent[reply.id]?.length || 0) >= 260 ? '#ea580c' : '#4b5563' }}>
                                        {editReplyContent[reply.id]?.length || 0}/280
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveReplyEdit(tweet.id, reply.id, reply.imageUrl)}
                                        disabled={savingReplyEdit || (!editReplyContent[reply.id]?.trim() && !editReplyImagePreview[reply.id])}
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
                                <>
                                  <p className="text-sm text-gray-700">{reply.content}</p>
                                  {/* Reply Image */}
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
