import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { SayHiWall } from './components/SayHiWall';
import { IdeaBoard } from './components/IdeaBoard';
import { IdeaModal } from './components/IdeaModal';
import { SparkGenerator } from './components/SparkGenerator';
import { ProfileModal } from './components/ProfileModal';

export function AppContent() {
  const { activeTab, addIdea } = useApp();

  // Modals state
  const [modalMode, setModalMode] = useState(null); // 'create' | 'view' | null
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isSparkOpen, setIsSparkOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleOpenCreateModal = () => {
    setSelectedIdea(null);
    setModalMode('create');
  };

  const handleOpenDetailsModal = (idea) => {
    setSelectedIdea(idea);
    setModalMode('view');
  };

  const handleCloseIdeaModal = () => {
    setModalMode(null);
    setSelectedIdea(null);
  };

  const handleUseSpark = (spark) => {
    addIdea(spark);
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        onOpenProfileModal={() => setIsProfileOpen(true)}
        onOpenSparkModal={() => setIsSparkOpen(true)}
      />

      {/* Main Tab Content */}
      <main>
        {activeTab === 'sayhi' && <SayHiWall />}
        {activeTab === 'ideas' && (
          <IdeaBoard
            onOpenCreateModal={handleOpenCreateModal}
            onOpenDetailsModal={handleOpenDetailsModal}
            onOpenSparkModal={() => setIsSparkOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <IdeaModal
        mode={modalMode}
        idea={selectedIdea}
        onClose={handleCloseIdeaModal}
      />

      <SparkGenerator
        isOpen={isSparkOpen}
        onClose={() => setIsSparkOpen(false)}
        onUseSpark={handleUseSpark}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Footer */}
      <footer style={{ marginTop: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>FriendLounge • A warm place to say hi & exchange ideas with friends ☕✨</p>
      </footer>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
