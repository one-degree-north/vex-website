// ============================================
// Content Loader - Loads JSON data into pages
// ============================================

class ContentLoader {
  constructor() {
    this.cache = {};
  }

  async load(file) {
    if (this.cache[file]) {
      return this.cache[file];
    }

    try {
      const response = await fetch(`/data/${file}`);
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      const data = await response.json();
      this.cache[file] = data;
      return data;
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
      return null;
    }
  }

  // ============================================
  // Teams Page
  // ============================================
  async loadTeams(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loading"></div>';

    const data = await this.load('teams.json');
    if (!data || !data.teams) {
      container.innerHTML = '<p>No teams found.</p>';
      return;
    }

    container.innerHTML = data.teams.map(team => `
      <div class="card team-card animate">
        <div class="team-id">${team.id}</div>
        <img class="team-photo" src="${team.photo || '/images/teams/default.jpg'}" alt="${team.name}" onerror="this.src='/images/teams/default.jpg'">
        <div class="card-content">
          <h3 class="card-title">${team.name}</h3>
          <p class="card-description">${team.description || ''}</p>
          <div class="team-members">
            ${team.members.map(m => `<span>${m}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');

    // Re-init animations
    initAnimations();
  }

  // ============================================
  // Topics with Lessons (Khan Academy style)
  // ============================================
  async loadTopics(containerId, jsonFile) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loading"></div>';

    const data = await this.load(jsonFile);
    if (!data || !data.topics) {
      container.innerHTML = '<p>No topics found.</p>';
      return;
    }

    const course = jsonFile.replace('.json', '');

    container.innerHTML = data.topics.map((topic, index) => `
      <div class="topic-card animate">
        <div class="topic-header" onclick="this.parentElement.classList.toggle('open')">
          <div class="topic-info">
            <h3 class="topic-title">${topic.title}</h3>
            <p class="topic-description">${topic.description || ''}</p>
          </div>
          <div class="topic-meta">
            <span class="topic-progress"></span>
            <span class="lesson-count">${topic.lessons.length} lessons</span>
            <span class="topic-arrow">▼</span>
          </div>
        </div>
        <div class="topic-lessons">
          ${topic.lessons.map((lesson, i) => `
            <a href="lesson.html?course=${course}&topic=${topic.id}&lesson=${lesson.id}" class="lesson-item" data-course="${course}" data-topic="${topic.id}" data-lesson="${lesson.id}">
              <span class="lesson-number">${i + 1}</span>
              <div class="lesson-info">
                <span class="lesson-title">${lesson.title}</span>
                ${lesson.description ? `<span class="lesson-desc">${lesson.description}</span>` : ''}
              </div>
              <span class="lesson-check" aria-hidden="true"></span>
            </a>
          `).join('')}
        </div>
      </div>
    `).join('');

    initAnimations();

    // Let progress modules paint completion checkmarks once the list exists.
    document.dispatchEvent(new CustomEvent('topics-rendered', { detail: { course } }));
  }

  // ============================================
  // Competition Tools
  // ============================================
  async loadTools(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loading"></div>';

    const data = await this.load('competitions.json');
    if (!data || !data.tools) {
      container.innerHTML = '<p>No tools found.</p>';
      return;
    }

    container.innerHTML = data.tools.map(tool => `
      <a href="${tool.url}" class="card tool-card animate" style="text-decoration: none; color: inherit;">
        <div class="card-content" style="text-align: center; padding: 2rem;">
          <div class="tool-icon" style="font-size: 3rem; margin-bottom: 1rem;">
            ${tool.icon === 'split' ? '⚡' : tool.icon === 'list' ? '📋' : tool.icon === 'help' ? '📖' : '🔧'}
          </div>
          <h3 class="card-title">${tool.name}</h3>
          <p class="card-description">${tool.description}</p>
          <span class="btn btn-secondary" style="margin-top: 1rem; display: inline-block;">Open Tool →</span>
        </div>
      </a>
    `).join('');

    // Re-init animations
    initAnimations();
  }

  // ============================================
  // Stats
  // ============================================
  async loadStats(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = await this.load('stats.json');
    if (!data || !data.stats) return;

    container.innerHTML = data.stats.map(stat => `
      <div class="stat-item animate">
        <div class="stat-number">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
      </div>
    `).join('');

    initAnimations();
  }
}

// Create global instance
const contentLoader = new ContentLoader();

// Helper function for animations (referenced from main.js)
function initAnimations() {
  const animateElements = document.querySelectorAll('.animate:not(.visible)');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  animateElements.forEach(el => observer.observe(el));
}

// Helper function for lightbox (referenced from main.js)
function initLightbox() {
  document.querySelectorAll('.gallery-item').forEach(item => {
    // Remove existing listeners by cloning
    const clone = item.cloneNode(true);
    item.parentNode.replaceChild(clone, item);

    clone.addEventListener('click', () => {
      const img = clone.querySelector('img');
      const lightbox = document.querySelector('.lightbox');
      if (lightbox) {
        const lightboxImg = lightbox.querySelector('img');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
      }
    });
  });
}
