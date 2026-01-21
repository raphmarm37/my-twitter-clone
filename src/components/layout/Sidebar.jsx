import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UserIcon, LoginIcon, UserPlusIcon, LogoutIcon, AppLogo } from '../common/Icons';

const Sidebar = memo(({ currentUser, onLogout }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {/* Logo */}
        <div className="sidebar-logo">
          <AppLogo size={52} />
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
