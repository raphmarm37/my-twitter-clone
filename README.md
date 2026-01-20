## Note
Built with AI-assisted development using Claude Code as a learning project 
to understand modern web development workflows and Firebase integration.
___________________________________________________________________________

# Twitter Clone

A full-featured social media platform inspired by Twitter, built with modern web technologies. This project demonstrates proficiency in React, Firebase, and real-time data management.

## Features

### Authentication
- User registration with email and password
- Secure login system
- Protected routes (redirects to login if not authenticated)
- Session persistence

### Tweets
- Create tweets with a 280-character limit
- Real-time character counter with color-coded warnings
- Edit tweets within 5 minutes of posting
- Delete your own tweets
- "(edited)" indicator for modified tweets
- Automatic timestamp formatting (e.g., "2 minutes ago", "3 hours ago")

### Replies & Comments
- Reply to any tweet
- Edit replies within 5 minutes
- Delete your own replies
- Nested conversation threads
- Real-time reply count display
- Collapsible reply sections

### Social Features
- Like/unlike tweets with heart icon
- Real-time like count updates
- Visual feedback for liked content

### User Profiles
- View any user's profile
- Display user statistics (tweets, followers, following)
- Show account creation date
- View all tweets from a specific user
- Clickable usernames throughout the app

### Follow System
- Follow/unfollow other users
- Dynamic "Following" button with hover effects
- Real-time follower/following counts
- Personalized feed based on who you follow

### Feed Organization
- **"For You" tab**: Shows tweets from people you follow + your own tweets
- **"All Tweets" tab**: Shows all tweets from everyone
- Smart empty states with helpful messages
- Real-time updates across all feeds

### User Experience
- Responsive design
- Loading states for all async operations
- Success/error notifications
- Confirmation dialogs for destructive actions
- Hover effects and smooth transitions
- Clean, Twitter-inspired UI

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Fast build tool and dev server
- **React Router v7** - Client-side routing
- **Tailwind CSS v4** - Utility-first CSS framework

### Backend & Database
- **Firebase Authentication** - User authentication and session management
- **Cloud Firestore** - NoSQL real-time database
- **Firebase SDK** - Client-side Firebase integration