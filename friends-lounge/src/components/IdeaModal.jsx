import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ThumbsUp, Send, MessageSquare, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'project', label: '💡 Project / Coding' },
  { id: 'hangout', label: '🍕 Weekend Hangout' },
  { id: 'gaming', label: '🎮 Gaming & Fun' },
  { id: 'trip', label: '✈️ Trip & Chill' },
  { id: 'brainstorm', label: '🧠 Wild Brainstorm' }
];

export const IdeaModal = ({ mode, idea, onClose }) => {
  const { currentUser, addIdea, toggleUpvote, addComment, toggleIdeaReaction } = useApp();

  // Create form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [description, setDescription] = useState('');

  // Comment input state
  const [newComment, setNewComment] = useState('');

  if (!mode) return null;

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const catObj = CATEGORIES.find(c => c.id === category);
    addIdea({
      title: title.trim(),
      category: category,
      categoryLabel: catObj ? catObj.label : '💡 Idea',
      description: description.trim()
    });

    onClose();
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !idea) return;
    addComment(idea.id, newComment);
    setNewComment('');
  };

  const isUpvoted = idea && (idea.upvotedBy || []).includes(currentUser.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pop-in" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {mode === 'create' ? '💡 Share a New Idea' : 'Idea & Discussion'}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Create Mode */}
        {mode === 'create' && (
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                Idea Title
              </label>
              <input
                type="text"
                placeholder="e.g. Secret Santa with customized code gifts..."
                className="textarea-clean"
                style={{ minHeight: 'auto', padding: '12px' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                Category
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    className={`category-filter-btn ${category === cat.id ? 'active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px' }}>
                Tell us more about it
              </label>
              <textarea
                placeholder="What's the plan? Who is it for? Why would it be fun or useful?..."
                className="textarea-clean"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className="icon-btn"
                onClick={onClose}
                style={{ width: 'auto', padding: '0 16px', borderRadius: '12px' }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                <Sparkles size={16} />
                <span>Publish Idea</span>
              </button>
            </div>
          </form>
        )}

        {/* View Details Mode */}
        {mode === 'view' && idea && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className={`idea-category-tag tag-${idea.category || 'project'}`}>
                {idea.categoryLabel}
              </span>

              <button
                className={`upvote-btn ${isUpvoted ? 'upvoted' : ''}`}
                onClick={() => toggleUpvote(idea.id)}
              >
                <ThumbsUp size={15} />
                <span>{idea.upvotes || 0} Upvotes</span>
              </button>
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '10px' }}>
              {idea.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <span>{idea.authorAvatar}</span>
              <span style={{ fontWeight: 600 }}>{idea.authorName}</span>
              <span>•</span>
              <span>{idea.timestamp}</span>
            </div>

            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
              {idea.description}
            </p>

            {/* Reactions row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Reactions:
              </span>
              {['❤️', '🔥', '💡', '🚀', '🎉'].map((emoji) => {
                const count = (idea.reactions && idea.reactions[emoji]) || 0;
                return (
                  <button
                    key={emoji}
                    className="reaction-chip"
                    onClick={() => toggleIdeaReaction(idea.id, emoji)}
                  >
                    <span>{emoji}</span>
                    {count > 0 && <span>{count}</span>}
                  </button>
                );
              })}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />

            {/* Comments & Brainstorming section */}
            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="var(--accent)" />
                Friends' Discussion ({idea.comments ? idea.comments.length : 0})
              </h4>

              {/* Comments List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '240px', overflowY: 'auto', marginBottom: '18px', paddingRight: '6px' }}>
                {(!idea.comments || idea.comments.length === 0) ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic', padding: '12px 0' }}>
                    No feedback yet. Be the first to share your thoughts on this idea!
                  </div>
                ) : (
                  idea.comments.map((comm) => (
                    <div
                      key={comm.id}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--badge-bg)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span>{comm.authorAvatar}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{comm.authorName}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {comm.timestamp}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {comm.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={`Reply as ${currentUser.name}...`}
                  className="textarea-clean"
                  style={{ minHeight: 'auto', padding: '10px 14px' }}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={!newComment.trim()}
                  style={{ opacity: newComment.trim() ? 1 : 0.6 }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
