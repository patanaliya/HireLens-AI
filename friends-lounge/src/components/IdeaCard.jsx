import React from 'react';
import { useApp } from '../context/AppContext';
import { ThumbsUp, MessageSquare, Heart, Flame, Sparkles } from 'lucide-react';

export const IdeaCard = ({ idea, onOpenDetails }) => {
  const { currentUser, toggleUpvote, toggleIdeaReaction } = useApp();

  const isUpvoted = (idea.upvotedBy || []).includes(currentUser.id);
  const commentCount = (idea.comments || []).length;

  return (
    <div className="idea-card glass-panel pop-in">
      <div>
        <div className="idea-card-header">
          <span className={`idea-category-tag tag-${idea.category || 'project'}`}>
            {idea.categoryLabel || '💡 Idea'}
          </span>

          <button
            className={`upvote-btn ${isUpvoted ? 'upvoted' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleUpvote(idea.id);
            }}
            title={isUpvoted ? 'Remove upvote' : 'Upvote this idea!'}
          >
            <ThumbsUp size={15} />
            <span>{idea.upvotes || 0}</span>
          </button>
        </div>

        <h3
          className="idea-card-title"
          onClick={() => onOpenDetails(idea)}
          style={{ cursor: 'pointer' }}
        >
          {idea.title}
        </h3>

        <p
          className="idea-card-desc"
          onClick={() => onOpenDetails(idea)}
          style={{ cursor: 'pointer' }}
        >
          {idea.description}
        </p>
      </div>

      <div>
        {/* Reactions row */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {['❤️', '🔥', '💡', '🚀'].map((emoji) => {
            const count = (idea.reactions && idea.reactions[emoji]) || 0;
            return (
              <button
                key={emoji}
                className="reaction-chip"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleIdeaReaction(idea.id, emoji);
                }}
                style={{ padding: '3px 8px', fontSize: '0.78rem' }}
              >
                <span>{emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="idea-card-footer">
          <div className="idea-author-info">
            <span style={{ fontSize: '1.2rem' }}>{idea.authorAvatar}</span>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{idea.authorName}</span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {idea.timestamp}
              </span>
            </div>
          </div>

          <div className="idea-actions-row">
            <button
              className="comment-count-btn"
              onClick={() => onOpenDetails(idea)}
              title="View & add comments"
            >
              <MessageSquare size={14} />
              <span>{commentCount} {commentCount === 1 ? 'thought' : 'thoughts'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
