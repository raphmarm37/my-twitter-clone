import { memo } from 'react';

const RightSidebar = memo(() => {
  return (
    <aside className="right-sidebar">
      <div className="right-sidebar-content">
        {/* Subscribe to Premium */}
        <div className="right-sidebar-card">
          <h3>Subscribe to Premium</h3>
          <p>Subscribe to unlock new features and if eligible, receive a share of ads revenue.</p>
          <button className="btn btn-primary mt-3" style={{ borderRadius: '9999px' }}>
            Subscribe
          </button>
        </div>

        {/* What's happening */}
        <div className="right-sidebar-card">
          <h3>What's happening</h3>
          <div className="right-sidebar-item">
            <div className="right-sidebar-item-subtitle">Trending in Tech</div>
            <div className="right-sidebar-item-title">#ReactJS</div>
            <div className="right-sidebar-item-meta">12.5K posts</div>
          </div>
          <div className="right-sidebar-item">
            <div className="right-sidebar-item-subtitle">Sports · Trending</div>
            <div className="right-sidebar-item-title">Champions League</div>
            <div className="right-sidebar-item-meta">45.2K posts</div>
          </div>
          <div className="right-sidebar-item">
            <div className="right-sidebar-item-subtitle">Entertainment</div>
            <div className="right-sidebar-item-title">New Movie Release</div>
            <div className="right-sidebar-item-meta">8.7K posts</div>
          </div>
        </div>

        {/* Who to follow */}
        <div className="right-sidebar-card">
          <h3>Who to follow</h3>
          <div className="right-sidebar-item">
            <div className="right-sidebar-item-title">@techguru</div>
            <div className="right-sidebar-item-subtitle">Tech enthusiast & developer</div>
          </div>
          <div className="right-sidebar-item">
            <div className="right-sidebar-item-title">@designpro</div>
            <div className="right-sidebar-item-subtitle">UI/UX Designer</div>
          </div>
        </div>
      </div>
    </aside>
  );
});

RightSidebar.displayName = 'RightSidebar';

export default RightSidebar;
