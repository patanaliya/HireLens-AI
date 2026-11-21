import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export const INITIAL_FRIENDS = [
  { id: '1', name: 'Alex Rivera', avatar: '🚀', status: 'Building side projects', mood: 'Creative' },
  { id: '2', name: 'Sam Chen', avatar: '☕', status: 'Sipping matcha & chilling', mood: 'Relaxed' },
  { id: '3', name: 'Maya Patel', avatar: '🎨', status: 'Designing new concepts', mood: 'Inspired' },
  { id: '4', name: 'Liam Taylor', avatar: '🎮', status: 'Gaming weekend plans?', mood: 'Hyped' },
];

export const INITIAL_GREETINGS = [
  {
    id: 'g-1',
    authorId: '2',
    authorName: 'Sam Chen',
    authorAvatar: '☕',
    text: 'Good morning everyone! Hope your week is going great. Anyone up for coffee or a quick sync later today?',
    moodTag: '☕ Morning Vibes',
    timestamp: '15 mins ago',
    reactions: { '❤️': 3, '👋': 5, '✨': 2 },
    userReactions: ['👋']
  },
  {
    id: 'g-2',
    authorId: '3',
    authorName: 'Maya Patel',
    authorAvatar: '🎨',
    text: 'Just finished the prototypes for our hackathon project! Super excited to get everyone’s thoughts!',
    moodTag: '🎨 Creating',
    timestamp: '1 hour ago',
    reactions: { '🔥': 4, '💡': 3, '🚀': 2 },
    userReactions: ['🔥']
  },
  {
    id: 'g-3',
    authorId: '4',
    authorName: 'Liam Taylor',
    authorAvatar: '🎮',
    text: 'Hey friends! Dropping by to say hi 👋 Let me know if anyone wants to test out the multiplayer build this evening!',
    moodTag: '🎮 Gaming',
    timestamp: '3 hours ago',
    reactions: { '👋': 6, '🎉': 2 },
    userReactions: ['👋']
  }
];

export const INITIAL_IDEAS = [
  {
    id: 'idea-1',
    title: 'Weekend Cabin Retreat & Hackathon',
    category: 'trip',
    categoryLabel: '✈️ Trip & Chill',
    description: 'What if we rent an Airbnb cabin near the lake for 3 days next month? We can barbecue, hike in the mornings, and do a fun 24-hour casual game jam together!',
    authorId: '1',
    authorName: 'Alex Rivera',
    authorAvatar: '🚀',
    timestamp: 'Today at 10:15 AM',
    upvotes: 8,
    upvotedBy: ['1', '2', '4'],
    reactions: { '🔥': 5, '❤️': 4, '🚀': 3 },
    comments: [
      {
        id: 'c-1',
        authorName: 'Sam Chen',
        authorAvatar: '☕',
        text: 'I am 100% in! I can bring the portable grill and board games.',
        timestamp: '2 hours ago'
      },
      {
        id: 'c-2',
        authorName: 'Maya Patel',
        authorAvatar: '🎨',
        text: 'Count me in for the jam! I will prepare assets and design UI in advance.',
        timestamp: '1 hour ago'
      }
    ]
  },
  {
    id: 'idea-2',
    title: 'Collaborative Music Playlist & Listening Room',
    category: 'project',
    categoryLabel: '💡 Project',
    description: 'A shared web room where friends can drop their favorite lo-fi / indie tracks and synchronize listening sessions while working or studying together.',
    authorId: '3',
    authorName: 'Maya Patel',
    authorAvatar: '🎨',
    timestamp: 'Yesterday',
    upvotes: 12,
    upvotedBy: ['1', '2', '3'],
    reactions: { '💡': 6, '🎵': 8, '❤️': 5 },
    comments: [
      {
        id: 'c-3',
        authorName: 'Liam Taylor',
        authorAvatar: '🎮',
        text: 'We could plug in the Spotify Web Playback SDK for this!',
        timestamp: 'Yesterday'
      }
    ]
  },
  {
    id: 'idea-3',
    title: 'Bi-Weekly Secret Board Game Tournament',
    category: 'gaming',
    categoryLabel: '🎮 Gaming',
    description: 'Every two weeks, one person picks a secret surprise party game (Catan, Jackbox, Codenames, Smash) and hosts the snacks. Rotating champion trophy included!',
    authorId: '4',
    authorName: 'Liam Taylor',
    authorAvatar: '🎮',
    timestamp: '2 days ago',
    upvotes: 15,
    upvotedBy: ['1', '2', '3', '4'],
    reactions: { '🏆': 7, '🔥': 6, '🎉': 5 },
    comments: []
  }
];

export const AppProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fl_theme') || 'light';
  });

  // Current active friend
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('fl_user');
    return saved ? JSON.parse(saved) : INITIAL_FRIENDS[0];
  });

  // Friends list
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('fl_friends');
    return saved ? JSON.parse(saved) : INITIAL_FRIENDS;
  });

  // Greetings feed
  const [greetings, setGreetings] = useState(() => {
    const saved = localStorage.getItem('fl_greetings');
    return saved ? JSON.parse(saved) : INITIAL_GREETINGS;
  });

  // Ideas board
  const [ideas, setIdeas] = useState(() => {
    const saved = localStorage.getItem('fl_ideas');
    return saved ? JSON.parse(saved) : INITIAL_IDEAS;
  });

  // Active navigation tab: 'sayhi' | 'ideas'
  const [activeTab, setActiveTab] = useState('sayhi');

  // Stats
  const [waveCount, setWaveCount] = useState(() => {
    return parseInt(localStorage.getItem('fl_waves') || '42', 10);
  });

  // Sync theme to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fl_theme', theme);
  }, [theme]);

  // Persist storage
  useEffect(() => {
    localStorage.setItem('fl_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('fl_greetings', JSON.stringify(greetings));
  }, [greetings]);

  useEffect(() => {
    localStorage.setItem('fl_ideas', JSON.stringify(ideas));
  }, [ideas]);

  useEffect(() => {
    localStorage.setItem('fl_waves', waveCount.toString());
  }, [waveCount]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Trigger celebratory confetti
  const triggerConfetti = (particleCount = 50) => {
    confetti({
      particleCount,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6']
    });
  };

  // Say Hi / Wave action
  const sendWave = (customMessage = '', mood = '👋 Friendly Wave') => {
    triggerConfetti(65);
    setWaveCount(prev => prev + 1);

    const defaultTexts = [
      `waved hi to everyone! 👋 Let's connect!`,
      `is sending good energy to all friends today! ✨`,
      `jumped into the lounge to say hello! 🎉`,
      `says hi! Hope you're all having a fantastic day! ☀️`
    ];

    const messageText = customMessage.trim() || 
      `${defaultTexts[Math.floor(Math.random() * defaultTexts.length)]}`;

    const newGreeting = {
      id: `g-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      text: messageText,
      moodTag: mood,
      timestamp: 'Just now',
      reactions: { '👋': 1, '❤️': 1 },
      userReactions: ['👋']
    };

    setGreetings(prev => [newGreeting, ...prev]);
  };

  // React to a greeting
  const toggleGreetingReaction = (greetingId, emoji) => {
    setGreetings(prev =>
      prev.map(item => {
        if (item.id !== greetingId) return item;
        const currentReactions = { ...item.reactions };
        const userReactions = [...(item.userReactions || [])];
        const alreadyReacted = userReactions.includes(emoji);

        if (alreadyReacted) {
          currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
          return {
            ...item,
            reactions: currentReactions,
            userReactions: userReactions.filter(r => r !== emoji)
          };
        } else {
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          return {
            ...item,
            reactions: currentReactions,
            userReactions: [...userReactions, emoji]
          };
        }
      })
    );
  };

  // Add new idea
  const addIdea = ({ title, category, categoryLabel, description }) => {
    triggerConfetti(80);
    const newIdea = {
      id: `idea-${Date.now()}`,
      title,
      category,
      categoryLabel,
      description,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      timestamp: 'Just now',
      upvotes: 1,
      upvotedBy: [currentUser.id],
      reactions: { '💡': 1, '🔥': 1 },
      comments: []
    };

    setIdeas(prev => [newIdea, ...prev]);
  };

  // Toggle upvote on an idea
  const toggleUpvote = (ideaId) => {
    setIdeas(prev =>
      prev.map(idea => {
        if (idea.id !== ideaId) return idea;
        const upvoted = (idea.upvotedBy || []).includes(currentUser.id);
        const newUpvotedBy = upvoted
          ? idea.upvotedBy.filter(id => id !== currentUser.id)
          : [...(idea.upvotedBy || []), currentUser.id];

        if (!upvoted) triggerConfetti(30);

        return {
          ...idea,
          upvotes: newUpvotedBy.length,
          upvotedBy: newUpvotedBy
        };
      })
    );
  };

  // Add comment to an idea
  const addComment = (ideaId, commentText) => {
    if (!commentText.trim()) return;
    setIdeas(prev =>
      prev.map(idea => {
        if (idea.id !== ideaId) return idea;
        const newComment = {
          id: `c-${Date.now()}`,
          authorName: currentUser.name,
          authorAvatar: currentUser.avatar,
          text: commentText.trim(),
          timestamp: 'Just now'
        };
        return {
          ...idea,
          comments: [...(idea.comments || []), newComment]
        };
      })
    );
  };

  // Add custom reaction to idea
  const toggleIdeaReaction = (ideaId, emoji) => {
    setIdeas(prev =>
      prev.map(idea => {
        if (idea.id !== ideaId) return idea;
        const curReactions = { ...idea.reactions };
        curReactions[emoji] = (curReactions[emoji] || 0) + 1;
        return { ...idea, reactions: curReactions };
      })
    );
  };

  // Update current user profile
  const updateUserProfile = (updatedProfile) => {
    setCurrentUser(updatedProfile);
    setFriends(prev =>
      prev.map(f => (f.id === updatedProfile.id ? updatedProfile : f))
    );
  };

  // Switch active friend easily
  const switchFriend = (friendId) => {
    const friend = friends.find(f => f.id === friendId);
    if (friend) setCurrentUser(friend);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        setCurrentUser,
        friends,
        switchFriend,
        updateUserProfile,
        activeTab,
        setActiveTab,
        waveCount,
        greetings,
        sendWave,
        toggleGreetingReaction,
        ideas,
        addIdea,
        toggleUpvote,
        addComment,
        toggleIdeaReaction,
        triggerConfetti
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
