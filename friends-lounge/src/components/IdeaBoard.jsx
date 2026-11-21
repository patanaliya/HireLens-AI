import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IdeaCard } from './IdeaCard';
import { Search, Plus, Sparkles, Filter, SlidersHorizontal } from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'all', label: '🌟 All Ideas' },
  { id: 'project', label: '💡 Projects' },
  { id: 'hangout', label: '🍕 Hangouts' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'trip', label: '✈️ Trips' },
  { id: 'brainstorm', label: '🧠 Brainstorms' }
];

export const IdeaBoard = ({ onOpenCreateModal, onOpenDetailsModal, onOpenSparkModal }) => {
  const { ideas } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('upvotes'); // 'upvotes' | 'newest' | 'comments'

  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch =
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || idea.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort ideas
  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    if (sortBy === 'upvotes') {
      return (b.upvotes || 0) - (a.upvotes || 0);
    }
    if (sortBy === 'comments') {
      return ((b.comments || []).length) - ((a.comments || []).length);
    }
    // newest
    return 0;
  });

  return (
    <div className="pop-in">
      {/* Spark Callout Banner */}
      <div className="spark-banner">
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} />
            Need an idea spark?
          </h3>
          <p style={{ fontSize: '0.88rem', opacity: 0.95 }}>
            Spin the random prompt wheel to generate fun ideas for your friends to vote on!
          </p>
        </div>
        <button className="spark-btn" onClick={onOpenSparkModal}>
          Roll a Prompt 🎲
        </button>
      </div>

      {/* Controls Bar: Search, Category Filters, Sort, and New Idea button */}
      <div className="ideaboard-controls">
        <div className="search-tags-row">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search ideas or friends..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                className={`category-filter-btn ${selectedCategory === tab.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="upvotes">🔥 Most Upvoted</option>
            <option value="newest">🕒 Newest First</option>
            <option value="comments">💬 Most Discussed</option>
          </select>

          <button className="primary-btn" onClick={onOpenCreateModal}>
            <Plus size={18} />
            <span>Share New Idea</span>
          </button>
        </div>
      </div>

      {/* Ideas Grid */}
      {sortedIdeas.length === 0 ? (
        <div className="empty-state glass-panel">
          <div className="empty-state-icon">💡</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No ideas found</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
            {searchQuery
              ? `No ideas matched "${searchQuery}". Try different keywords or reset filters!`
              : 'Be the first one to post a brilliant idea for your friends!'}
          </p>
          <button className="primary-btn" style={{ margin: '0 auto' }} onClick={onOpenCreateModal}>
            <Plus size={16} />
            <span>Post an Idea Now</span>
          </button>
        </div>
      ) : (
        <div className="ideaboard-grid">
          {sortedIdeas.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onOpenDetails={onOpenDetailsModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
