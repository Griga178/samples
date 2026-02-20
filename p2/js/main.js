/* =========================================
   MAIN APPLICATION LOGIC
   ========================================= */

// State
let currentLang = localStorage.getItem('language') || 'ru';
let currentTheme = localStorage.getItem('theme') || 'light';
let currentFilter = 'all';

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const themeText = themeToggle.querySelector('.theme-text');
const langToggle = document.getElementById('lang-toggle');
const langText = langToggle.querySelector('.lang-text');
const projectsGrid = document.getElementById('projects-grid');
const filterTabs = document.getElementById('filter-tabs');

/* =========================================
   THEME MANAGEMENT
   ========================================= */

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    // updateThemeButtonText();
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    // updateThemeButtonText();
}

function updateThemeButtonText() {
    const key = currentTheme === 'light' ? 'theme_dark' : 'theme_light';
    themeText.textContent = translations[currentLang][key];
}

themeToggle.addEventListener('click', toggleTheme);

/* =========================================
   LANGUAGE MANAGEMENT
   ========================================= */

function initLanguage() {
    updateLanguageUI();
    updateAllText();
    // updateThemeButtonText();
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ru' : 'en';
    localStorage.setItem('language', currentLang);
    updateLanguageUI();
    updateAllText();
    // updateThemeButtonText();
    renderFilterTabs();
    renderProjects();
}

function updateLanguageUI() {
    langText.textContent = currentLang === 'en' ? 'RU' : 'EN';
    document.documentElement.lang = currentLang;
}

function updateAllText() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
}

langToggle.addEventListener('click', toggleLanguage);

/* =========================================
   PROJECTS RENDERING
   ========================================= */

function renderFilterTabs() {
    filterTabs.innerHTML = '';

    filterCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${cat.key === currentFilter ? 'active' : ''}`;
        btn.setAttribute('data-filter', cat.key);
        btn.textContent = cat.label[currentLang];

        btn.addEventListener('click', () => {
            currentFilter = cat.key;
            renderFilterTabs();
            renderProjects();
        });

        filterTabs.appendChild(btn);
    });
}

function renderProjects() {
    projectsGrid.innerHTML = '';

    const filteredProjects = currentFilter === 'all'
        ? projects
        : projects.filter(p => p.category === currentFilter);

    filteredProjects.forEach((project, index) => {
        const card = document.createElement('article');
        card.className = 'project-card';
        card.setAttribute('data-category', project.category);
        card.style.animationDelay = `${index * 0.1}s`;

        const title = project.title[currentLang];
        const description = project.description[currentLang];
        const sourceCodeText = currentLang === 'en' ? 'Source Code' : 'Исходный код';
        const liveDemoText = currentLang === 'en' ? 'Live Demo →' : 'Демо →';
        const viewNotebookText = currentLang === 'en' ? 'View Notebook' : 'Открыть Notebook';

        const linksHTML = `
            <a href="${project.links.github}" target="_blank">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                ${project.category === 'data' ? viewNotebookText : sourceCodeText}
            </a>
            ${project.hasDemo ? `<a href="${project.links.demo}" target="_blank">${liveDemoText}</a>` : ''}
        `;

        const tagsHTML = project.tags.map(tag =>
            `<span class="tag">${tag}</span>`
        ).join('');

        card.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${title}</h3>
            </div>
            <p class="project-desc">${description}</p>
            <div class="project-tags">${tagsHTML}</div>
            <div class="project-links">${linksHTML}</div>
        `;

        projectsGrid.appendChild(card);
    });
}

/* =========================================
   INITIALIZATION
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
    renderFilterTabs();
    renderProjects();
});
