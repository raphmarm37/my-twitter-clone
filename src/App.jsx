import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import { auth, db } from './firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import './App.css'

function App() {
  const [firebaseConnected, setFirebaseConnected] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    try {
      if (auth && db) {
        console.log('Firebase Connected: Yes')
        console.log('Auth:', auth)
        console.log('Firestore:', db)
        setFirebaseConnected(true)
      } else {
        console.log('Firebase Connected: No')
        setFirebaseConnected(false)
      }
    } catch (error) {
      console.error('Firebase Connection Error:', error)
      setFirebaseConnected(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <nav style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
        {currentUser && (
          <Link to={`/profile/${currentUser.uid}`} style={{ marginRight: '20px' }}>Profile</Link>
        )}
        <Link to="/login" style={{ marginRight: '20px' }}>Login</Link>
        <Link to="/signup">Signup</Link>
        <span style={{ marginLeft: 'auto', float: 'right', color: firebaseConnected ? 'green' : 'red' }}>
          Firebase Connected: {firebaseConnected ? 'Yes' : 'No'}
        </span>
      </nav>

      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile/:userId" element={<Profile />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
