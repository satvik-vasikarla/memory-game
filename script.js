const STORAGE_KEY = 'memory-flow-state-v1';
const defaultState = {
  theme: 'dark',
  sound: true,
  animations: true,
  user: {
    name: 'John',
    xp: 640,
    level: 7,
    streak: 4,
    lastActiveDate: '2026-07-08'
  },
  stats: {
    conceptsLearned: 8,
    accuracy: 86,
    reviewsCompleted: 24,
    totalAttempts: 28,
    correctAnswers: 24,
    gamesPlayed: 6
  },
  achievements: {
    firstReview: true,
    streak7: false,
    concepts100: false,
    memoryMaster: false,
    speedRunner: false
  },
  concepts: [
    {
      id: 'api',
      title: 'API',
      definition: 'Allows software to communicate with each other.',
      category: 'Programming',
      difficulty: 'Easy',
      tags: ['integration', 'software'],
      memoryStrength: 88,
      status: 'Steady',
      reviewCount: 5,
      nextReviewAt: '2026-07-09',
      createdAt: '2026-07-01'
    },
    {
      id: 'state',
      title: 'State',
      definition: 'Stores data that changes over time in an app.',
      category: 'Programming',
      difficulty: 'Medium',
      tags: ['react', 'data'],
      memoryStrength: 71,
      status: 'Needs Review',
      reviewCount: 3,
      nextReviewAt: '2026-07-08',
      createdAt: '2026-07-02'
    },
    {
      id: 'closure',
      title: 'Closure',
      definition: 'A function that remembers variables from its parent scope.',
      category: 'Programming',
      difficulty: 'Hard',
      tags: ['functions', 'js'],
      memoryStrength: 62,
      status: 'Needs Review',
      reviewCount: 2,
      nextReviewAt: '2026-07-08',
      createdAt: '2026-07-03'
    },
    {
      id: 'heuristic',
      title: 'Heuristic',
      definition: 'A practical rule of thumb used to solve problems quickly.',
      category: 'Learning',
      difficulty: 'Medium',
      tags: ['thinking', 'strategy'],
      memoryStrength: 79,
      status: 'Steady',
      reviewCount: 4,
      nextReviewAt: '2026-07-10',
      createdAt: '2026-07-04'
    },
    {
      id: 'spaced-repetition',
      title: 'Spaced Repetition',
      definition: 'Reviewing material at increasing intervals to improve retention.',
      category: 'Learning',
      difficulty: 'Easy',
      tags: ['memory', 'study'],
      memoryStrength: 93,
      status: 'Mastered',
      reviewCount: 6,
      nextReviewAt: '2026-07-11',
      createdAt: '2026-07-05'
    },
    {
      id: 'diffusion',
      title: 'Diffusion',
      definition: 'The spread of ideas or information through a population.',
      category: 'Psychology',
      difficulty: 'Medium',
      tags: ['ideas', 'behavior'],
      memoryStrength: 67,
      status: 'Needs Review',
      reviewCount: 2,
      nextReviewAt: '2026-07-08',
      createdAt: '2026-07-05'
    }
  ],
  activity: [2, 4, 1, 6, 5, 3, 4],
  ui: {
    currentView: 'dashboard',
    searchQuery: '',
    categoryFilter: 'All',
    editingConceptId: null
  }
};

let state = loadState();
let gameState = null;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return structuredClone(defaultState);
    }
    const parsed = JSON.parse(saved);
    return { ...structuredClone(defaultState), ...parsed, user: { ...structuredClone(defaultState.user), ...(parsed.user || {}) }, stats: { ...structuredClone(defaultState.stats), ...(parsed.stats || {}) }, achievements: { ...structuredClone(defaultState.achievements), ...(parsed.achievements || {}) }, concepts: parsed.concepts || structuredClone(defaultState.concepts), activity: parsed.activity || structuredClone(defaultState.activity), ui: { ...structuredClone(defaultState.ui), ...(parsed.ui || {}) } };
  } catch (error) {
    console.warn('Could not load state', error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initializeApp() {
  syncDerivedState();
  applyTheme();
  render();
  bindEvents();
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) {
      state.ui.currentView = viewButton.dataset.view;
      if (state.ui.currentView !== 'add-concept') {
        state.ui.editingConceptId = null;
      }
      saveState();
      render();
      return;
    }

    const action = event.target.closest('[data-action]');
    if (!action) return;

    const actionName = action.dataset.action;
    if (actionName === 'review') {
      markConceptReviewed(action.dataset.id, true);
    }
    if (actionName === 'skip-review') {
      markConceptReviewed(action.dataset.id, false);
    }
    if (actionName === 'edit-concept') {
      const concept = state.concepts.find((entry) => entry.id === action.dataset.id);
      if (concept) {
        state.ui.editingConceptId = concept.id;
        state.ui.currentView = 'add-concept';
        render();
      }
    }
    if (actionName === 'play-mode') {
      state.ui.currentView = 'play';
      startGame(action.dataset.mode);
      render();
    }
    if (actionName === 'restart-game') {
      startGame(gameState?.mode || 'memory-match');
      render();
    }
    if (actionName === 'answer') {
      answerChallenge(action.dataset.option);
    }
    if (actionName === 'submit-answer') {
      const input = document.querySelector('#freeResponse');
      if (input) answerChallenge(input.value.trim());
    }
    if (actionName === 'select-card') {
      selectMemoryCard(action.dataset.cardId);
    }
    if (actionName === 'toggle-theme') {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      saveState();
      render();
    }
    if (actionName === 'toggle-sound') {
      state.sound = !state.sound;
      saveState();
      render();
    }
    if (actionName === 'toggle-animation') {
      state.animations = !state.animations;
      saveState();
      render();
    }
    if (actionName === 'reset-progress') {
      state = structuredClone(defaultState);
      state.theme = document.documentElement.getAttribute('data-theme') || 'dark';
      state.ui.currentView = 'dashboard';
      saveState();
      applyTheme();
      render();
      showToast('Progress reset.');
    }
  });

  document.getElementById('themeToggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveState();
  });

  document.addEventListener('submit', (event) => {
    if (event.target.id === 'conceptForm') {
      event.preventDefault();
      saveConceptForm(event.target);
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.id === 'librarySearch') {
      state.ui.searchQuery = event.target.value.trim().toLowerCase();
      renderLibrary();
    }
    if (event.target.id === 'categoryFilter') {
      state.ui.categoryFilter = event.target.value;
      renderLibrary();
    }
  });
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeButton = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeToggleIcon');
  if (themeButton && themeIcon) {
    const isDark = state.theme === 'dark';
    themeIcon.src = isDark ? 'canva-watercolor-illustration-of-a-bright-sun-MAG_TOzBgjg.webp' : '7184508.png';
    themeIcon.alt = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    themeButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function render() {
  updateHeader();
  renderNav();
  const content = document.getElementById('pageContent');
  if (!content) return;

  switch (state.ui.currentView) {
    case 'library':
      content.innerHTML = renderLibrary();
      break;
    case 'play':
      content.innerHTML = renderPlay();
      break;
    case 'daily-review':
      content.innerHTML = renderDailyReview();
      break;
    case 'progress':
      content.innerHTML = renderProgress();
      break;
    case 'achievements':
      content.innerHTML = renderAchievements();
      break;
    case 'add-concept':
      content.innerHTML = renderAddConcept();
      break;
    case 'settings':
      content.innerHTML = renderSettings();
      break;
    case 'contact':
      content.innerHTML = renderContact();
      break;
    default:
      content.innerHTML = renderDashboard();
      break;
  }
}

function updateHeader() {
  const title = document.getElementById('pageTitle');
  const streakBadge = document.getElementById('streakBadge');
  if (title) {
    title.textContent = viewTitle(state.ui.currentView);
  }
  if (streakBadge) {
    streakBadge.textContent = `Streak ${state.user.streak}`;
  }
}

function viewTitle(view) {
  const labels = {
    dashboard: 'Dashboard',
    library: 'Library',
    play: 'Play',
    'daily-review': 'Daily Review',
    progress: 'Progress',
    achievements: 'Achievements',
    'add-concept': 'Add Concept',
    contact: 'Contact',
    settings: 'Settings'
  };
  return labels[view] || 'Dashboard';
}

function renderNav() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === state.ui.currentView);
  });
}

function renderDashboard() {
  const recent = [...state.concepts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  const levelProgress = (state.user.xp % 250) / 250 * 100;
  const dueConcepts = getDueConcepts().length;

  return `
    <div class="page-content">
      <section class="hero">
        <div class="hero-panel">
          <p class="eyebrow">Welcome back</p>
          <h3>${state.user.name}, you are on a roll.</h3>
          <p>Keep your streak alive and turn concepts into quick wins with focused review loops and short challenge sessions.</p>
          <div class="section-heading" style="margin-top: 16px;">
            <button class="primary-button" data-view="daily-review">Continue Learning</button>
            <div class="mini-pill">Level ${state.user.level} · ${state.user.xp} XP</div>
          </div>
        </div>
        <div class="card">
          <div class="section-heading">
            <h4>Daily Challenge</h4>
            <span class="badge">${dueConcepts} due</span>
          </div>
          <p>Review your most fragile concepts with a quick match and recap loop.</p>
          <div class="bar" style="margin: 10px 0;"><span style="width: ${Math.min(levelProgress, 100)}%"></span></div>
          <button class="secondary-button" data-action="play-mode" data-mode="memory-match">Start challenge</button>
        </div>
      </section>

      <section class="stats-grid">
        <div class="stats-card">
          <span>XP</span>
          <strong>${state.user.xp}</strong>
        </div>
        <div class="stats-card">
          <span>Streak</span>
          <strong>${state.user.streak} days</strong>
        </div>
        <div class="stats-card">
          <span>Accuracy</span>
          <strong>${getAccuracy()}%</strong>
        </div>
        <div class="stats-card">
          <span>Reviews</span>
          <strong>${state.stats.reviewsCompleted}</strong>
        </div>
      </section>

      <section class="list-grid">
        <div class="card">
          <div class="section-heading">
            <h4>Recently Added Concepts</h4>
            <button class="pill-button" data-view="library">Open Library</button>
          </div>
          <div class="review-list">
            ${recent.map((concept) => `
              <div class="check-row">
                <div>
                  <strong>${concept.title}</strong>
                  <div><small>${concept.category}</small></div>
                </div>
                <span class="status-pill ${concept.memoryStrength >= 80 ? 'strong' : 'warn'}">${concept.memoryStrength}%</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="card">
          <div class="section-heading">
            <h4>Quick Stats</h4>
            <span class="badge">Live</span>
          </div>
          <div class="review-list">
            <div class="check-row"><span>Concepts learned</span><strong>${state.stats.conceptsLearned}</strong></div>
            <div class="check-row"><span>Accuracy</span><strong>${getAccuracy()}%</strong></div>
            <div class="check-row"><span>Reviews completed</span><strong>${state.stats.reviewsCompleted}</strong></div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderLibrary() {
  const categories = ['All', ...new Set(state.concepts.map((concept) => concept.category))];
  const filtered = state.concepts.filter((concept) => {
    const matchesSearch = !state.ui.searchQuery || concept.title.toLowerCase().includes(state.ui.searchQuery) || concept.definition.toLowerCase().includes(state.ui.searchQuery);
    const matchesCategory = state.ui.categoryFilter === 'All' || concept.category === state.ui.categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return `
    <div class="card">
      <div class="filter-row">
        <input id="librarySearch" placeholder="Search concepts" value="${state.ui.searchQuery}" />
        <select id="categoryFilter">
          ${categories.map((category) => `<option value="${category}" ${state.ui.categoryFilter === category ? 'selected' : ''}>${category}</option>`).join('')}
        </select>
        <button class="primary-button" data-view="add-concept">Add Concept</button>
      </div>
      <div class="concept-grid">
        ${filtered.map((concept) => `
          <article class="concept-card">
            <div class="section-heading">
              <h4>${concept.title}</h4>
              <button class="small-button" data-action="edit-concept" data-id="${concept.id}">✎</button>
            </div>
            <p>${concept.definition}</p>
            <div class="section-heading">
              <span class="badge">${concept.category}</span>
              <span class="status-pill ${concept.memoryStrength >= 80 ? 'strong' : 'warn'}">${concept.status}</span>
            </div>
            <div class="bar"><span style="width:${concept.memoryStrength}%"></span></div>
            <div class="section-heading">
              <small>Memory strength ${concept.memoryStrength}%</small>
              <small>Review x${concept.reviewCount}</small>
            </div>
            <div class="section-heading">
              <span class="badge">${concept.tags.join(', ')}</span>
            </div>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPlay() {
  const modes = [
    { key: 'memory-match', title: 'Memory Match', description: 'Pair concepts with their definitions before the timer runs out.' },
    { key: 'speed-round', title: 'Speed Round', description: 'Answer quickly to earn a bonus and build momentum.' },
    { key: 'multiple-choice', title: 'Multiple Choice', description: 'Choose the best definition from three options.' },
    { key: 'type-the-answer', title: 'Type the Answer', description: 'Recall the definition from memory and type it out.' },
    { key: 'mixed-challenge', title: 'Mixed Challenge', description: 'Rotate through a short set of varied prompts.' }
  ];

  return `
    <div class="game-grid">
      ${modes.map((mode) => `
        <div class="game-card">
          <div class="section-heading">
            <h4>${mode.title}</h4>
            <span class="badge">${mode.key === 'memory-match' ? 'Live' : 'Ready'}</span>
          </div>
          <p>${mode.description}</p>
          <button class="primary-button" data-action="play-mode" data-mode="${mode.key}">Start ${mode.title}</button>
        </div>
      `).join('')}
    </div>
    ${renderActiveGame()}
  `;
}

function renderActiveGame() {
  if (!gameState) {
    return `
      <div class="card" style="margin-top: 16px;">
        <h4>Pick a mode to begin</h4>
        <p>Each challenge updates your streak, XP, and review habits automatically.</p>
      </div>
    `;
  }

  if (gameState.mode === 'memory-match') {
    const scoreText = gameState.completed ? 'Completed' : `${gameState.score} pts`;
    return `
      <div class="card" style="margin-top: 16px;">
        <div class="game-header">
          <div>
            <p class="eyebrow">Memory Match</p>
            <h4>${scoreText}</h4>
          </div>
          <div class="topbar-actions">
            <div class="mini-pill">Moves ${gameState.moves}</div>
            <div class="mini-pill">Timer ${gameState.timer}s</div>
          </div>
        </div>
        <div class="memory-board">
          ${gameState.cards.map((card) => {
            const isFaceUp = gameState.flipped.includes(card.id) || gameState.matched.includes(card.id);
            const label = isFaceUp ? card.text : 'Tap to reveal';
            return `
              <button class="memory-card ${isFaceUp ? 'flipped' : ''} ${gameState.matched.includes(card.id) ? 'matched' : ''}" data-action="select-card" data-card-id="${card.id}">
                ${label}
              </button>
            `;
          }).join('')}
        </div>
        ${gameState.completed ? `
          <div class="hero-panel" style="margin-top: 14px;">
            <h4>Completed</h4>
            <p>You matched every concept with its definition. Your progress has been saved and you earned bonus XP.</p>
            <button class="primary-button" data-action="restart-game">Play again</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  const current = gameState.questions[gameState.currentQuestion];
  if (!current) {
    return `
      <div class="card" style="margin-top: 16px;">
        <h4>Challenge complete</h4>
        <p>You scored ${gameState.score} points. Keep going to improve your recall.</p>
        <button class="primary-button" data-action="restart-game">Try again</button>
      </div>
    `;
  }

  const isTypeMode = current.kind === 'type-the-answer';
  return `
    <div class="card" style="margin-top: 16px;">
      <div class="game-header">
        <div>
          <p class="eyebrow">${titleForMode(gameState.mode)}</p>
          <h4>${current.prompt}</h4>
        </div>
        <div class="mini-pill">${gameState.currentQuestion + 1}/${gameState.questions.length}</div>
      </div>
      ${isTypeMode ? `
        <div class="choice-list">
          <input id="freeResponse" placeholder="Type the definition" />
          <button class="primary-button" data-action="submit-answer">Submit answer</button>
        </div>
      ` : `
        <div class="choice-list">
          ${current.options.map((option) => `
            <button data-action="answer" data-option="${option}">${option}</button>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function renderDailyReview() {
  const concepts = getDueConcepts();
  const progress = concepts.length ? Math.round(((state.concepts.length - concepts.length) / state.concepts.length) * 100) : 100;

  return `
    <div class="card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Prioritized</p>
          <h4>Concepts due for review</h4>
        </div>
        <div class="mini-pill">${concepts.length} active</div>
      </div>
      <div class="bar"><span style="width:${progress}%"></span></div>
      <p style="margin-top: 10px;">Items that have not been reviewed recently appear first so your memory stays sharp.</p>
      <div class="review-list" style="margin-top: 14px;">
        ${concepts.length ? concepts.map((concept) => `
          <div class="check-row">
            <div>
              <strong>${concept.title}</strong>
              <div><small>${concept.definition}</small></div>
            </div>
            <div class="topbar-actions">
              <button class="small-button" data-action="review" data-id="${concept.id}">Review</button>
              <button class="small-button" data-action="skip-review" data-id="${concept.id}">Skip</button>
            </div>
          </div>
        `).join('') : '<p>No concepts due right now. Great job.</p>'}
      </div>
    </div>
  `;
}

function renderProgress() {
  const categories = [...new Set(state.concepts.map((concept) => concept.category))];
  const weakest = [...state.concepts].sort((a, b) => a.memoryStrength - b.memoryStrength).slice(0, 2).map((concept) => concept.category).join(', ');
  const strongest = [...state.concepts].sort((a, b) => b.memoryStrength - a.memoryStrength).slice(0, 2).map((concept) => concept.category).join(', ');
  return `
    <div class="stats-grid">
      <div class="stats-card"><span>XP earned</span><strong>${state.user.xp}</strong></div>
      <div class="stats-card"><span>Accuracy</span><strong>${getAccuracy()}%</strong></div>
      <div class="stats-card"><span>Concepts mastered</span><strong>${state.concepts.filter((concept) => concept.memoryStrength >= 85).length}</strong></div>
      <div class="stats-card"><span>Learning streak</span><strong>${state.user.streak} days</strong></div>
    </div>
    <div class="list-grid">
      <div class="card">
        <div class="section-heading">
          <h4>Weakest categories</h4>
          <span class="badge">Focus</span>
        </div>
        <p>${weakest || 'No data yet'}</p>
      </div>
      <div class="card">
        <div class="section-heading">
          <h4>Strongest categories</h4>
          <span class="badge">Momentum</span>
        </div>
        <p>${strongest || 'No data yet'}</p>
      </div>
    </div>
    <div class="card">
      <div class="section-heading">
        <h4>Weekly activity</h4>
        <span class="badge">Updated daily</span>
      </div>
      <div class="chart-bars">
        ${state.activity.map((value, index) => `
          <div class="chart-bar">
            <span style="height:${Math.max(15, value * 16)}px"></span>
            <small>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index]}</small>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card">
      <div class="section-heading">
        <h4>Skill coverage</h4>
        <span class="badge">${categories.length} categories</span>
      </div>
      <div class="review-list">
        ${categories.map((category) => `<div class="check-row"><span>${category}</span><strong>${state.concepts.filter((concept) => concept.category === category).length} concepts</strong></div>`).join('')}
      </div>
    </div>
  `;
}

function renderAchievements() {
  const badges = [
    { key: 'firstReview', title: 'First Review', description: 'Complete your first review.', unlocked: state.achievements.firstReview },
    { key: 'streak7', title: '7-Day Streak', description: 'Stay consistent for a week.', unlocked: state.achievements.streak7 },
    { key: 'concepts100', title: '100 Concepts Learned', description: 'Build a wide knowledge base.', unlocked: state.achievements.concepts100 },
    { key: 'memoryMaster', title: 'Memory Master', description: 'Master a strong set of concepts.', unlocked: state.achievements.memoryMaster },
    { key: 'speedRunner', title: 'Speed Runner', description: 'Beat your own pace in challenge mode.', unlocked: state.achievements.speedRunner }
  ];

  return `
    <div class="achievement-grid">
      ${badges.map((badge) => `
        <div class="achievement-card ${badge.unlocked ? 'strong' : ''}">
          <div class="section-heading">
            <h4>${badge.title}</h4>
            <span class="badge">${badge.unlocked ? 'Unlocked' : 'Locked'}</span>
          </div>
          <p>${badge.description}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAddConcept() {
  const concept = state.concepts.find((entry) => entry.id === state.ui.editingConceptId) || null;
  return `
    <div class="form-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Capture a new idea</p>
          <h4>${concept ? 'Edit concept' : 'Add a concept'}</h4>
        </div>
        <span class="badge">${concept ? 'Editing' : 'New'}</span>
      </div>
      <form id="conceptForm">
        <div class="form-grid">
          <label>
            <span>Concept name</span>
            <input name="title" required value="${concept ? concept.title : ''}" />
          </label>
          <label>
            <span>Category</span>
            <input name="category" required value="${concept ? concept.category : ''}" />
          </label>
          <label>
            <span>Definition</span>
            <textarea name="definition" rows="4" required>${concept ? concept.definition : ''}</textarea>
          </label>
          <label>
            <span>Difficulty</span>
            <select name="difficulty">
              <option value="Easy" ${concept?.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
              <option value="Medium" ${concept?.difficulty === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="Hard" ${concept?.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
            </select>
          </label>
        </div>
        <label>
          <span>Tags</span>
          <input name="tags" placeholder="Comma-separated tags" value="${concept ? concept.tags.join(', ') : ''}" />
        </label>
        <div class="section-heading">
          <button class="primary-button" type="submit">Save concept</button>
          <button class="secondary-button" type="button" data-view="library">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

function renderContact() {
  const contacts = [
    { name: 'Edgar Solis', role: 'Front-End Developer', email: 'solisedgar365@gmail.com', focus: 'Build interface features' },
    { name: 'Satvik', role: 'product lead', email: '', focus: 'Coordinate the project and maintain the roadmap.' },
    { name: 'quinton', role: 'QA & Documentation', email: '', focus: 'Test features, track issues, and maintain project documentation.' },
    { name: 'Thiago', role: 'GitHub & Integration Lead', email: '', focus: 'Practice GitHub collaboration and repository management.' },
    { name: 'Andre', role: 'UX/UI Designer', email: '', focus: 'Design layouts and user flows.' }
  ];

  return `
    <div class="page-content">
      <div class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Reach out</p>
            <h4>Contact the MemoryFlow team</h4>
          </div>
          <span class="badge">5 people</span>
        </div>
        <p>Choose the right person for your question, feedback, or idea.</p>
        <div class="concept-grid" style="margin-top: 14px;">
          ${contacts.map((contact) => `
            <article class="concept-card">
              <div class="section-heading">
                <h4>${contact.name}</h4>
                <span class="badge">${contact.role}</span>
              </div>
              <p>${contact.focus}</p>
              <div class="review-list">
                <div class="check-row"><span>Email</span><strong>${contact.email}</strong></div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>

      <div class="form-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Send a message</p>
            <h4>We’d love to hear from you</h4>
          </div>
        </div>
        <form id="contactForm">
          <div class="form-grid">
            <label>
              <span>Your name</span>
              <input name="name" required placeholder="Ava" />
            </label>
            <label>
              <span>Email address</span>
              <input name="email" type="email" required placeholder="you@example.com" />
            </label>
          </div>
          <label>
            <span>Message</span>
            <textarea name="message" rows="5" required placeholder="Tell us what you need help with..."></textarea>
          </label>
          <div class="section-heading">
            <button class="primary-button" type="submit">Send message</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Preferences</p>
          <h4>Experience settings</h4>
        </div>
      </div>
      <div class="review-list">
        <div class="check-row"><span>Light / Dark mode</span><button class="small-button" id="themeSettingButton" data-action="toggle-theme">${state.theme === 'dark' ? 'Dark' : 'Light'}</button></div>
        <div class="check-row"><span>Sound effects</span><button class="small-button" data-action="toggle-sound">${state.sound ? 'On' : 'Off'}</button></div>
        <div class="check-row"><span>Animations</span><button class="small-button" data-action="toggle-animation">${state.animations ? 'On' : 'Off'}</button></div>
        <div class="check-row"><span>Reset progress</span><button class="small-button" data-action="reset-progress">Reset</button></div>
      </div>
    </div>
  `;
}

function saveConceptForm(form) {
  const formData = new FormData(form);
  const values = Object.fromEntries(formData.entries());
  const title = values.title.trim();
  const definition = values.definition.trim();
  const category = values.category.trim();
  const difficulty = values.difficulty || 'Easy';
  const tags = values.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

  if (!title || !definition || !category) {
    showToast('Please fill in the required information.');
    return;
  }

  if (state.ui.editingConceptId) {
    const concept = state.concepts.find((entry) => entry.id === state.ui.editingConceptId);
    if (concept) {
      concept.title = title;
      concept.definition = definition;
      concept.category = category;
      concept.difficulty = difficulty;
      concept.tags = tags;
      concept.status = classifyMemory(concept.memoryStrength);
      showToast('Concept updated.');
    }
  } else {
    state.concepts.unshift({
      id: slugify(title),
      title,
      definition,
      category,
      difficulty,
      tags,
      memoryStrength: 60,
      status: 'Needs Review',
      reviewCount: 0,
      nextReviewAt: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10)
    });
    state.stats.conceptsLearned += 1;
    showToast('Concept added.');
  }

  state.ui.editingConceptId = null;
  state.ui.currentView = 'library';
  saveState();
  render();
}

function markConceptReviewed(id, correct) {
  const concept = state.concepts.find((entry) => entry.id === id);
  if (!concept) return;

  concept.reviewCount += 1;
  concept.memoryStrength = Math.min(100, concept.memoryStrength + (correct ? 10 : 4));
  concept.status = classifyMemory(concept.memoryStrength);
  concept.lastReviewedAt = new Date().toISOString().slice(0, 10);
  concept.nextReviewAt = new Date(Date.now() + 86400000 * (correct ? 2 : 1)).toISOString().slice(0, 10);

  state.stats.reviewsCompleted += 1;
  state.stats.totalAttempts += 1;
  if (correct) state.stats.correctAnswers += 1;
  state.stats.accuracy = getAccuracy();
  state.user.xp += correct ? 30 : 12;
  state.user.level = Math.floor(state.user.xp / 250) + 1;
  updateStreak();
  updateActivity();
  syncDerivedState();
  saveState();
  showToast(correct ? 'Review saved.' : 'Review logged.');
  render();
}

function syncDerivedState() {
  state.stats.accuracy = getAccuracy();
  state.stats.conceptsLearned = state.concepts.length;
  state.achievements.firstReview = state.stats.reviewsCompleted >= 1;
  state.achievements.streak7 = state.user.streak >= 7;
  state.achievements.concepts100 = state.concepts.length >= 100;
  state.achievements.memoryMaster = state.concepts.filter((concept) => concept.memoryStrength >= 85).length >= 5;
  state.achievements.speedRunner = state.stats.gamesPlayed >= 5;
}

function getAccuracy() {
  if (!state.stats.totalAttempts) return 100;
  return Math.round((state.stats.correctAnswers / state.stats.totalAttempts) * 100);
}

function getDueConcepts() {
  const today = new Date().toISOString().slice(0, 10);
  return [...state.concepts]
    .filter((concept) => concept.nextReviewAt <= today)
    .sort((a, b) => a.memoryStrength - b.memoryStrength);
}

function classifyMemory(value) {
  if (value >= 85) return 'Mastered';
  if (value >= 70) return 'Steady';
  return 'Needs Review';
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.user.lastActiveDate === today) return;
  const lastDate = new Date(state.user.lastActiveDate || today);
  const currentDate = new Date(today);
  const diff = Math.round((currentDate - lastDate) / 86400000);
  if (diff === 1) {
    state.user.streak += 1;
  } else if (diff > 1 || !state.user.lastActiveDate) {
    state.user.streak = 1;
  }
  state.user.lastActiveDate = today;
}

function updateActivity() {
  state.activity = [...state.activity.slice(1), Math.min(7, state.stats.reviewsCompleted % 7 + 1)];
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
}

function startGame(mode) {
  if (gameState?.intervalId) {
    window.clearInterval(gameState.intervalId);
  }

  if (mode === 'memory-match') {
    const pairs = state.concepts.slice(0, 6).flatMap((concept) => [
      { id: `${concept.id}-front`, text: concept.title, pairId: concept.id },
      { id: `${concept.id}-back`, text: concept.definition, pairId: concept.id }
    ]);
    const cards = shuffle(pairs);
satvik
    gameState = { mode, score: 0, moves: 0, timer: 0, cards, flipped: [], matched: [], completed: false, intervalId: null };
    gameState = { mode, score: 0, moves: 0, timer: 0, cards, flipped: [], matched: [], completed: false, intervalId: null, startedAt: Date.now() };
    if (gameState.intervalId) window.clearInterval(gameState.intervalId);
main
    gameState.intervalId = window.setInterval(() => {
      gameState.timer = Math.floor((Date.now() - gameState.startedAt) / 1000);
      render();
    }, 1000);
    return;
  }

  gameState = { mode, score: 0, currentQuestion: 0, questions: buildQuestions(mode), completed: false };
}

function buildQuestions(mode) {
  const base = state.concepts.slice(0, 6);
  if (mode === 'type-the-answer') {
    return base.map((concept) => ({ kind: 'type-the-answer', prompt: `What is the definition of ${concept.title}?`, answer: concept.definition, options: [] }));
  }

  if (mode === 'speed-round') {
    return base.slice(0, 4).map((concept) => {
      const distractors = state.concepts.filter((entry) => entry.id !== concept.id).slice(0, 2).map((entry) => entry.definition);
      const options = shuffle([concept.definition, ...distractors]).slice(0, 3);
      return { kind: 'multiple-choice', prompt: `Speed round: which definition fits ${concept.title}?`, answer: concept.definition, options };
    });
  }

  if (mode === 'mixed-challenge') {
    return base.slice(0, 4).map((concept, index) => {
      if (index % 2 === 0) {
        const distractors = state.concepts.filter((entry) => entry.id !== concept.id).slice(0, 2).map((entry) => entry.definition);
        return { kind: 'multiple-choice', prompt: `Mixed challenge: which definition fits ${concept.title}?`, answer: concept.definition, options: shuffle([concept.definition, ...distractors]).slice(0, 3) };
      }
      return { kind: 'type-the-answer', prompt: `Mixed challenge: type the definition of ${concept.title}`, answer: concept.definition, options: [] };
    });
  }

  return base.slice(0, 4).map((concept) => {
    const distractors = state.concepts.filter((entry) => entry.id !== concept.id).slice(0, 3).map((entry) => entry.definition);
    const options = shuffle([concept.definition, ...distractors]).slice(0, 4);
    return { kind: 'multiple-choice', prompt: `Which definition fits ${concept.title}?`, answer: concept.definition, options };
  });
}

function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function answerChallenge(option) {
  if (!gameState || gameState.completed) return;
  const current = gameState.questions[gameState.currentQuestion];
  if (!current) return;

  const isCorrect = current.kind === 'type-the-answer'
    ? normalizeText(option || '') === normalizeText(current.answer)
    : normalizeText(option || '') === normalizeText(current.answer);

  if (isCorrect) {
    gameState.score += 100;
    state.user.xp += 25;
    state.stats.gamesPlayed += 1;
    state.stats.totalAttempts += 1;
    state.stats.correctAnswers += 1;
    state.stats.accuracy = getAccuracy();
    showToast('Correct answer.');
  } else {
    state.stats.totalAttempts += 1;
    state.stats.accuracy = getAccuracy();
    showToast('Try another round.');
  }
  gameState.currentQuestion += 1;
  if (gameState.currentQuestion >= gameState.questions.length) {
    gameState.completed = true;
  }
  updateStreak();
  updateActivity();
  syncDerivedState();
  saveState();
  render();
}

function selectMemoryCard(cardId) {
  if (!gameState || gameState.completed) return;
  if (gameState.flipped.includes(cardId) || gameState.matched.includes(cardId)) return;
  gameState.flipped.push(cardId);
  if (gameState.flipped.length === 2) {
    gameState.moves += 1;
    const [firstId, secondId] = gameState.flipped;
    const firstCard = gameState.cards.find((card) => card.id === firstId);
    const secondCard = gameState.cards.find((card) => card.id === secondId);
    if (firstCard.pairId === secondCard.pairId) {
      gameState.score += 120;
      gameState.matched.push(firstId, secondId);
      gameState.flipped = [];
      if (gameState.matched.length === gameState.cards.length) {
        if (gameState.intervalId) {
          window.clearInterval(gameState.intervalId);
          gameState.intervalId = null;
        }
        gameState.completed = true;
        state.user.xp += 80;
        state.stats.gamesPlayed += 1;
        state.stats.totalAttempts += 1;
        state.stats.correctAnswers += 1;
        state.stats.accuracy = getAccuracy();
        updateStreak();
        updateActivity();
        syncDerivedState();
        saveState();
        showToast('Memory match complete.');
      }
    } else {
      window.setTimeout(() => {
        gameState.flipped = [];
        render();
      }, 600);
    }
  }
  render();
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function titleForMode(mode) {
  const labels = {
    'memory-match': 'Memory Match',
    'speed-round': 'Speed Round',
    'multiple-choice': 'Multiple Choice',
    'type-the-answer': 'Type the Answer',
    'mixed-challenge': 'Mixed Challenge'
  };
  return labels[mode] || 'Challenge';
}

document.addEventListener('DOMContentLoaded', initializeApp);
