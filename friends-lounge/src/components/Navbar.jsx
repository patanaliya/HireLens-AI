import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon, Sparkles, MessageSquareHeart, Lightbulb, UserCheck, ChevronDown } from 'lucide-react';

export const Navbar = ({ onOpenProfileModal, onOpenSparkModal }) => {
  const {
    theme,
    toggleTheme,
    currentUser,
    friends,
    switchFriend,
    activeTab,
    setActiveTab
  } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="navbar glass-panel">
      {/* Brand */}
      <div className="navbar-brand">
        <div className="brand-icon">
          <span className="animate-wave">👋</span>
        </div>
        <div>
          <span className="brand-font" style={{ fontSize: '1.25rem', fontWeight: 800 }}>FriendLounge</span>
          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '-2px' }}>
            Say Hi & Exchange Ideas
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'sayhi' ? 'active' : ''}`}
          onClick={() => setActiveTab('sayhi')}
        >
          <MessageSquareHeart size={18} />
          <span>Say Hi Lounge</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'ideas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ideas')}
        >
          <Lightbulb size={18} />
          <span>Idea Board</span>
        </button>
      </div>

      {/* Nav Actions */}
      <div className="nav-actions">
        {/* Spark idea generator button */}
        <button
          className="icon-btn"
          title="Spark a brainstorm prompt"
          onClick={onOpenSparkModal}
          style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(236, 72, 153, 0.15))', borderColor: 'rgba(245, 158, 11, 0.3)' }}
        >
          <Sparkles size={18} color="#f59e0b" />
        </button>

        {/* Theme Toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Friend Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="profile-pill"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Switch friend profile or edit"
          >
            <span className="profile-avatar">{currentUser.avatar}</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div className="profile-name">{currentUser.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{currentUser.mood}</div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {dropdownOpen && (
            <div
              className="glass-panel pop-in"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '230px',
                padding: '8px',
                zIndex: 60,
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Switch Friend View:
              </div>

              {friends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => {
                    switchFriend(friend.id);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    background: friend.id === currentUser.id ? 'var(--accent-light)' : 'transparent',
                    color: friend.id === currentUser.id ? 'var(--accent)' : 'var(--text-primary)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                    fontWeight: friend.id === currentUser.id ? 700 : 500,
                    marginBottom: '2px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{friend.avatar}</span>
                  <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div>{friend.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{friend.status}</div>
                  </div>
                  {friend.id === currentUser.id && <UserCheck size={14} />}
                </button>
              ))}

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '6px 0' }} />

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenProfileModal();
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--accent)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: '0.84rem',
                  fontWeight: 600
                }}
              >
                ✏️ Customize My Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
