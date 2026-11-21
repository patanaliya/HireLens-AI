import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, Smile } from 'lucide-react';

const AVATAR_CHOICES = ['🚀', '☕', '🎨', '🎮', '🥑', '🎧', '🐱', '🦊', '⚡', '🌟', '🍕', '👾', '🔥', '📚'];

export const ProfileModal = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [status, setStatus] = useState(currentUser.status);
  const [mood, setMood] = useState(currentUser.mood);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUserProfile({
      ...currentUser,
      name: name.trim(),
      avatar,
      status: status.trim() || 'Hanging out',
      mood: mood.trim() || 'Friendly'
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pop-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Customize Your Profile</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Avatar Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '8px' }}>
              Pick Your Avatar Emoji
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {AVATAR_CHOICES.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    border: avatar === emoji ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    background: avatar === emoji ? 'var(--accent-light)' : 'var(--badge-bg)',
                    fontSize: '1.3rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
              Your Name
            </label>
            <input
              type="text"
              className="textarea-clean"
              style={{ minHeight: 'auto', padding: '12px' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Status Message */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
              Current Status / What are you up to?
            </label>
            <input
              type="text"
              placeholder="e.g. Sipping tea & daydreaming..."
              className="textarea-clean"
              style={{ minHeight: 'auto', padding: '12px' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>

          {/* Mood */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
              Mood Keyword
            </label>
            <input
              type="text"
              placeholder="e.g. Hyped, Relaxed, Creative..."
              className="textarea-clean"
              style={{ minHeight: 'auto', padding: '12px' }}
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              style={{ width: 'auto', padding: '0 16px', borderRadius: '12px' }}
            >
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              <Check size={16} />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
