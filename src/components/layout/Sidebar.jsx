import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UserIcon, LoginIcon, UserPlusIcon, LogoutIcon } from '../common/Icons';

const Sidebar = memo(({ currentUser, onLogout }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {/* Logo */}
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <HomeIcon size={26} />
            <span>Home</span>
          </NavLink>

          {currentUser && (
            <NavLink
              to={`/profile/${currentUser.uid}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <UserIcon size={26} />
              <span>Profile</span>
            </NavLink>
          )}

          {!currentUser && (
            <>
              <NavLink to="/login" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <LoginIcon size={26} />
                <span>Log in</span>
              </NavLink>

              <NavLink to="/signup" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <UserPlusIcon size={26} />
                <span>Sign up</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Logout button at bottom */}
        {currentUser && (
          <div className="sidebar-footer">
            <button onClick={onLogout} className="sidebar-link logout">
              <LogoutIcon size={26} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
