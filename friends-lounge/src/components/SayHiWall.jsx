import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Hand, Send, Sparkles, Heart, Flame, MessageCircle, Smile } from 'lucide-react';

const MOOD_OPTIONS = [
  { label: '👋 Friendly Wave', emoji: '👋' },
  { label: '☕ Morning Coffee', emoji: '☕' },
  { label: '💡 Brainstorming', emoji: '💡' },
  { label: '🎉 Celebrating', emoji: '🎉' },
  { label: '🎮 Chill Gaming', emoji: '🎮' },
  { label: '🍕 Snack Break', emoji: '🍕' }
];

export const SayHiWall = () => {
  const {
    currentUser,
    friends,
    greetings,
    sendWave,
    toggleGreetingReaction,
    waveCount,
    ideas
  } = useApp();

  const [customMessage, setCustomMessage] = useState('');
  const [selectedMood, setSelectedMood] = useState(MOOD_OPTIONS[0].label);

  const handlePostGreeting = (e) => {
    e.preventDefault();
    if (!customMessage.trim()) return;
    sendWave(customMessage, selectedMood);
    setCustomMessage('');
  };

  const handleQuickWave = () => {
    sendWave('', selectedMood);
  };

  return (
    <div className="sayhi-container pop-in">
      {/* Hero Banner */}
      <div className="hero-banner glass-panel">
        <div className="hero-content">
          <h1>Say Hi to Your Friends! <span className="animate-wave">👋</span></h1>
          <p className="hero-subtitle">
            Welcome to the lounge, <strong>{currentUser.name}</strong>! Drop a friendly hello, share what’s on your mind, or cheer on your friends' updates.
          </p>
        </div>

        <div className="hero-quick-stats">
          <div className="stat-pill">
            <div className="stat-value">{friends.length}</div>
            <div className="stat-label">Friends Active</div>
          </div>
          <div className="stat-pill">
            <div className="stat-value">{waveCount}</div>
            <div className="stat-label">Waves Shared</div>
          </div>
          <div className="stat-pill">
            <div className="stat-value">{ideas.length}</div>
            <div className="stat-label">Shared Ideas</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Post Box, Right Greetings Feed */}
      <div className="sayhi-grid">
        {/* Left Action Box */}
        <div className="action-card glass-panel">
          <h3>
            <Hand size={20} color="var(--accent)" />
            Say Hello
          </h3>

          {/* Quick Wave Button */}
          <button className="wave-hero-btn pulse-glow" onClick={handleQuickWave}>
            <span style={{ fontSize: '1.4rem' }}>👋</span>
            <span>Send a Wave to Friends!</span>
          </button>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', margin: '-10px 0 16px' }}>
            Instant cheer with confetti animation
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '14px 0' }} />

          {/* Custom Greeting Form */}
          <form onSubmit={handlePostGreeting} className="status-input-group">
            <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Or write a custom message:
            </label>

            <textarea
              className="textarea-clean"
              placeholder={`Hi everyone! It's ${currentUser.name.split(' ')[0]} here, wanted to say...`}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Pick your vibe:
              </div>
              <div className="mood-selector">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    type="button"
                    key={mood.label}
                    className={`mood-btn ${selectedMood === mood.label ? 'active' : ''}`}
                    onClick={() => setSelectedMood(mood.label)}
                  >
                    <span>{mood.emoji}</span>
                    <span>{mood.label.replace(/^[^ ]+ /, '')}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={!customMessage.trim()}
              style={{
                opacity: customMessage.trim() ? 1 : 0.6,
                cursor: customMessage.trim() ? 'pointer' : 'not-allowed',
                marginTop: '6px'
              }}
            >
              <Send size={16} />
              <span>Post to Greeting Wall</span>
            </button>
          </form>
        </div>

        {/* Right Feed Column */}
        <div className="feed-column">
          <div className="feed-header">
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={20} color="var(--accent-pink)" />
              Lounge Activity & Greetings ({greetings.length})
            </h3>
          </div>

          <div className="greeting-feed-list">
            {greetings.map((item) => {
              const reactions = item.reactions || {};
              const userReactions = item.userReactions || [];

              return (
                <div key={item.id} className="greeting-card glass-panel pop-in">
                  <div className="greeting-avatar">{item.authorAvatar}</div>

                  <div className="greeting-body">
                    <div className="greeting-top">
                      <span className="greeting-author">{item.authorName}</span>
                      {item.moodTag && (
                        <span className="greeting-badge">{item.moodTag}</span>
                      )}
                      <span className="greeting-time">{item.timestamp}</span>
                    </div>

                    <div className="greeting-message">{item.text}</div>

                    {/* Reactions list */}
                    <div className="greeting-reactions">
                      {['👋', '❤️', '🔥', '✨'].map((emoji) => {
                        const count = reactions[emoji] || 0;
                        const hasReacted = userReactions.includes(emoji);

                        return (
                          <button
                            key={emoji}
                            className={`reaction-chip ${hasReacted ? 'reacted' : ''}`}
                            onClick={() => toggleGreetingReaction(item.id, emoji)}
                            title={`React with ${emoji}`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
