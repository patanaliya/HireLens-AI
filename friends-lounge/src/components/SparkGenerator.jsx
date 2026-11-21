import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';

const SPARKS = [
  {
    title: 'Secret Recipe Cook-off & Tasting',
    category: 'hangout',
    categoryLabel: '🍕 Weekend Hangout',
    description: 'Everyone brings one dish cooked with a secret weird ingredient. We do a blind taste test and rate presentation, flavor, and creativity!'
  },
  {
    title: 'Collaborative AI Story Generator',
    category: 'project',
    categoryLabel: '💡 Project',
    description: 'Build a funny web app where each friend writes one sentence, and an AI model illustrates and narrates each chapter into a crazy animated comic.'
  },
  {
    title: 'Sunset Rooftop Cinema Night',
    category: 'hangout',
    categoryLabel: '🍕 Weekend Hangout',
    description: 'Set up a portable projector on someone’s terrace or backyard with cozy blankets, popcorn seasoning bar, and vote on classic 90s nostalgia movies.'
  },
  {
    title: '48-Hour No-Code App Sprint',
    category: 'project',
    categoryLabel: '💡 Project',
    description: 'Team up in pairs to build and launch silly micro-apps or Discord bots over a weekend, then present them live on Sunday evening.'
  },
  {
    title: 'Mystery Destination Road Trip',
    category: 'trip',
    categoryLabel: '✈️ Trip & Chill',
    description: 'One person gets the budget and plans a weekend getaway, but keeps the exact location secret from everyone until we arrive at the first gas stop!'
  },
  {
    title: 'Co-op Horror Game Night in the Dark',
    category: 'gaming',
    categoryLabel: '🎮 Gaming',
    description: 'Gather together or hop on Discord with lights off to play Phasmophobia or Lethal Company with proxy chat on. Heart monitor challenges optional!'
  }
];

export const SparkGenerator = ({ isOpen, onClose, onUseSpark }) => {
  const { triggerConfetti } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  if (!isOpen) return null;

  const handleRoll = () => {
    setIsSpinning(true);
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * SPARKS.length);
    } while (nextIdx === currentIndex && SPARKS.length > 1);

    setTimeout(() => {
      setCurrentIndex(nextIdx);
      setIsSpinning(false);
      triggerConfetti(40);
    }, 250);
  };

  const currentSpark = SPARKS[currentIndex];

  const handleApply = () => {
    onUseSpark(currentSpark);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pop-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🎲</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Idea Spark Generator</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '18px' }}>
          Stuck on what to do or build next with your friends? Roll the dice for instant inspiration!
        </p>

        {/* Card Display */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            marginBottom: '20px',
            border: '2px dashed var(--accent)',
            background: 'var(--bg-primary)',
            transition: 'all 0.2s ease',
            opacity: isSpinning ? 0.5 : 1,
            transform: isSpinning ? 'scale(0.97)' : 'scale(1)'
          }}
        >
          <span className={`idea-category-tag tag-${currentSpark.category}`} style={{ marginBottom: '10px' }}>
            {currentSpark.categoryLabel}
          </span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '10px 0 8px' }}>
            {currentSpark.title}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.5' }}>
            {currentSpark.description}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={handleRoll}
            style={{ width: 'auto', padding: '0 18px', gap: '8px', display: 'flex', borderRadius: '12px' }}
          >
            <RefreshCw size={16} className={isSpinning ? 'animate-spin' : ''} />
            <span>Roll Another</span>
          </button>

          <button type="button" className="primary-btn" onClick={handleApply}>
            <span>Post This Idea</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
