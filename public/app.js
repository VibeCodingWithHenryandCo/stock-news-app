// Stock News Search Application - Enhanced Edition
// Features: Authentication, Sentiment Analysis, Charts, Bookmarks, i18n

// ============================================================================
// CONFIGURATION & STATE
// ============================================================================

const API_BASE = window.location.origin;
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let currentPage = 1;
let currentQuery = '';
let allArticles = [];
let stockChart = null;

// ============================================================================
// INTERNATIONALIZATION (i18n)
// ============================================================================

const translations = {
    en: {
        appTitle: "Stock News Search",
        subtitle: "Search for the newest and most impactful stock news",
        search: "Search",
        searchPlaceholder: "Enter stock symbol (e.g., AAPL, TSLA)",
        login: "Login",
        logout: "Logout",
        register: "Register",
        loginTitle: "Login to Your Account",
        registerTitle: "Create New Account",
        loginBtn: "Login",
        registerBtn: "Register",
        savedSearches: "Saved Searches",
        bookmarks: "Bookmarks",
        filterSentiment: "Sentiment:",
        filterImpact: "Impact:",
        all: "All",
        positive: "Positive",
        neutral: "Neutral",
        negative: "Negative",
        high: "High",
        medium: "Medium",
        low: "Low",
        loading: "Searching for news...",
        previous: "Previous",
        next: "Next",
        footer: "Built with ❤️ for stock market enthusiasts",
        noResults: "No news found. Try a different search term.",
        readMore: "Read full article",
        saveSearch: "Save this search",
        bookmarkArticle: "Bookmark",
        removeBookmark: "Remove bookmark"
    },
    es: {
        appTitle: "Búsqueda de Noticias de Acciones",
        subtitle: "Busque las noticias de acciones más nuevas e impactantes",
        search: "Buscar",
        searchPlaceholder: "Ingrese símbolo de acción (ej: AAPL, TSLA)",
        login: "Iniciar Sesión",
        logout: "Cerrar Sesión",
        register: "Registrarse",
        loginTitle: "Inicia Sesión en tu Cuenta",
        registerTitle: "Crear Nueva Cuenta",
        loginBtn: "Iniciar Sesión",
        registerBtn: "Registrarse",
        savedSearches: "Búsquedas Guardadas",
        bookmarks: "Marcadores",
        filterSentiment: "Sentimiento:",
        filterImpact: "Impacto:",
        all: "Todos",
        positive: "Positivo",
        neutral: "Neutral",
        negative: "Negativo",
        high: "Alto",
        medium: "Medio",
        low: "Bajo",
        loading: "Buscando noticias...",
        previous: "Anterior",
        next: "Siguiente",
        footer: "Hecho con ❤️ para entusiastas del mercado de valores",
        noResults: "No se encontraron noticias. Intente con otro término.",
        readMore: "Leer artículo completo",
        saveSearch: "Guardar esta búsqueda",
        bookmarkArticle: "Marcar",
        removeBookmark: "Quitar marcador"
    },
    zh: {
        appTitle: "股票新闻搜索",
        subtitle: "搜索最新和最具影响力的股票新闻",
        search: "搜索",
        searchPlaceholder: "输入股票代码（例如：AAPL、TSLA）",
        login: "登录",
        logout: "登出",
        register: "注册",
        loginTitle: "登录您的账户",
        registerTitle: "创建新账户",
        loginBtn: "登录",
        registerBtn: "注册",
        savedSearches: "保存的搜索",
        bookmarks: "书签",
        filterSentiment: "情绪：",
        filterImpact: "影响：",
        all: "全部",
        positive: "积极",
        neutral: "中性",
        negative: "消极",
        high: "高",
        medium: "中",
        low: "低",
        loading: "搜索新闻中...",
        previous: "上一页",
        next: "下一页",
        footer: "为股市爱好者精心打造 ❤️",
        noResults: "未找到新闻。请尝试其他搜索词。",
        readMore: "阅读完整文章",
        saveSearch: "保存此搜索",
        bookmarkArticle: "收藏",
        removeBookmark: "移除收藏"
    }
};

let currentLanguage = localStorage.getItem('language') || 'en';

function translatePage() {
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });

    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
}

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
    // Search
    searchInput: document.getElementById('searchInput'),
    searchButton: document.getElementById('searchButton'),
    saveSearchBtn: document.getElementById('saveSearchBtn'),
    
    // Filters
    sentimentFilter: document.getElementById('sentimentFilter'),
    impactFilter: document.getElementById('impactFilter'),
    
    // Display
    loading: document.getElementById('loading'),
    results: document.getElementById('results'),
    
    // Pagination
    pagination: document.getElementById('pagination'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),
    
    // Auth
    authModal: document.getElementById('authModal'),
    loginButton: document.getElementById('loginButton'),
    logoutButton: document.getElementById('logoutButton'),
    authButtons: document.getElementById('authButtons'),
    userMenu: document.getElementById('userMenu'),
    userName: document.getElementById('userName'),
    loginTab: document.getElementById('loginTab'),
    registerTab: document.getElementById('registerTab'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    
    // Sidebars
    savedSearchesSidebar: document.getElementById('savedSearchesSidebar'),
    bookmarksSidebar: document.getElementById('bookmarksSidebar'),
    savedSearchesBtn: document.getElementById('savedSearchesBtn'),
    bookmarksBtn: document.getElementById('bookmarksBtn'),
    closeSidebar: document.getElementById('closeSidebar'),
    closeBookmarksSidebar: document.getElementById('closeBookmarksSidebar'),
    savedSearchesList: document.getElementById('savedSearchesList'),
    bookmarksList: document.getElementById('bookmarksList'),
    
    // Chart
    stockChartSection: document.getElementById('stockChartSection'),
    stockChart: document.getElementById('stockChart'),
    stockSymbol: document.getElementById('stockSymbol'),
    stockInfo: document.getElementById('stockInfo'),
    
    // Language
    languageSelect: document.getElementById('languageSelect')
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            closeAuthModal();
            updateAuthUI();
            showNotification('Login successful!', 'success');
        } else {
            throw new Error(data.error || 'Login failed');
        }
    } catch (error) {
        document.getElementById('loginError').textContent = error.message;
    }
}

async function register(username, email, password) {
    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            closeAuthModal();
            updateAuthUI();
            showNotification('Registration successful!', 'success');
        } else {
            throw new Error(data.errors ? data.errors[0].msg : data.error || 'Registration failed');
        }
    } catch (error) {
        document.getElementById('registerError').textContent = error.message;
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateAuthUI();
    showNotification('Logged out successfully', 'info');
}

function updateAuthUI() {
    if (currentUser) {
        elements.authButtons.style.display = 'none';
        elements.userMenu.style.display = 'flex';
        elements.userName.textContent = `👤 ${currentUser.username}`;
        elements.saveSearchBtn.style.display = 'inline-block';
    } else {
        elements.authButtons.style.display = 'flex';
        elements.userMenu.style.display = 'none';
        elements.saveSearchBtn.style.display = 'none';
    }
}

async function checkAuthStatus() {
    if (authToken) {
        try {
            const response = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            const data = await response.json();

            if (data.success) {
                currentUser = data.user;
                updateAuthUI();
            } else {
                logout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
        }
    }
}

// ============================================================================
// SEARCH & NEWS FETCHING
// ============================================================================

let searchDebounceTimer = null;

function debounceSearch() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        searchNews();
    }, 500);
}

async function searchNews(page = 1) {
    const query = elements.searchInput.value.trim();
    
    if (!query) {
        showError('Please enter a stock symbol or company name');
        return;
    }

    currentQuery = query;
    currentPage = page;

    // Show loading state
    elements.loading.style.display = 'block';
    elements.results.innerHTML = '';
    elements.pagination.style.display = 'none';

    try {
        const response = await fetch(
            `${API_BASE}/api/news?query=${encodeURIComponent(query)}&page=${page}&limit=20`
        );
        const data = await response.json();

        elements.loading.style.display = 'none';

        if (data.success && data.articles) {
            allArticles = data.articles;
            displayResults(data.articles);
            updatePagination(data.pagination);
            
            // Fetch stock quote for chart
            fetchStockQuote(query);
        } else {
            showError(data.error || 'Failed to fetch news');
        }
    } catch (error) {
        elements.loading.style.display = 'none';
        showError('Network error. Please try again.');
        console.error('Search error:', error);
    }
}

// ============================================================================
// STOCK CHART
// ============================================================================

async function fetchStockQuote(symbol) {
    try {
        const response = await fetch(`${API_BASE}/api/stock/${encodeURIComponent(symbol)}`);
        const data = await response.json();

        if (data.success && data.quote) {
            displayStockChart(symbol, data.quote);
        }
    } catch (error) {
        console.error('Stock quote error:', error);
    }
}

function displayStockChart(symbol, quote) {
    elements.stockChartSection.style.display = 'block';
    elements.stockSymbol.textContent = symbol.toUpperCase();

    const change = quote.c - quote.pc;
    const changePercent = ((change / quote.pc) * 100).toFixed(2);
    const isPositive = change >= 0;

    elements.stockInfo.innerHTML = `
        <div class="stock-price ${isPositive ? 'positive' : 'negative'}">
            <span class="price">$${quote.c.toFixed(2)}</span>
            <span class="change">${isPositive ? '+' : ''}${change.toFixed(2)} (${changePercent}%)</span>
        </div>
        <div class="stock-details">
            <span>Open: $${quote.o.toFixed(2)}</span>
            <span>High: $${quote.h.toFixed(2)}</span>
            <span>Low: $${quote.l.toFixed(2)}</span>
            <span>Previous Close: $${quote.pc.toFixed(2)}</span>
        </div>
    `;

    // Create simple chart
    if (stockChart) {
        stockChart.destroy();
    }

    const ctx = elements.stockChart.getContext('2d');
    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Previous Close', 'Open', 'Low', 'Current', 'High'],
            datasets: [{
                label: symbol.toUpperCase(),
                data: [quote.pc, quote.o, quote.l, quote.c, quote.h],
                borderColor: isPositive ? '#10b981' : '#ef4444',
                backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// ============================================================================
// DISPLAY RESULTS
// ============================================================================

function displayResults(articles) {
    // Apply filters
    const sentimentFilter = elements.sentimentFilter.value;
    const impactFilter = elements.impactFilter.value;

    let filteredArticles = articles;

    if (sentimentFilter !== 'all') {
        filteredArticles = filteredArticles.filter(a => a.sentiment === sentimentFilter);
    }

    if (impactFilter !== 'all') {
        filteredArticles = filteredArticles.filter(a => a.impact === impactFilter);
    }

    if (filteredArticles.length === 0) {
        elements.results.innerHTML = `<div class="no-results">${translations[currentLanguage].noResults}</div>`;
        return;
    }

    elements.results.innerHTML = filteredArticles.map(article => {
        const publishedDate = new Date(article.publishedAt);
        const timeAgo = getTimeAgo(publishedDate);
        const isBookmarked = false; // TODO: Check if bookmarked
        
        return `
            <div class="news-card ${article.impact}-impact" data-url="${escapeHtml(article.url)}">
                <div class="news-header">
                    <h3 class="news-title">${escapeHtml(article.title)}</h3>
                    <div class="badges">
                        <span class="sentiment-badge sentiment-${article.sentiment}">
                            ${getSentimentEmoji(article.sentiment)} ${article.sentiment}
                        </span>
                        <span class="impact-badge ${article.impact}">${article.impact}</span>
                    </div>
                </div>
                <div class="news-meta">
                    <span>📰 ${escapeHtml(article.source)}</span>
                    <span>🕒 ${timeAgo}</span>
                </div>
                <p class="news-description">${escapeHtml(article.description)}</p>
                <div class="news-actions">
                    <a href="${escapeHtml(article.url)}" class="news-link" target="_blank" rel="noopener noreferrer">
                        ${translations[currentLanguage].readMore} →
                    </a>
                    ${currentUser ? `
                        <button class="btn-bookmark" data-article='${JSON.stringify({
                            url: article.url,
                            title: article.title,
                            source: article.source,
                            publishedAt: article.publishedAt
                        })}'>
                            ${isBookmarked ? '🔖' : '📑'} ${translations[currentLanguage].bookmarkArticle}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Add bookmark event listeners
    if (currentUser) {
        document.querySelectorAll('.btn-bookmark').forEach(btn => {
            btn.addEventListener('click', function() {
                const articleData = JSON.parse(this.getAttribute('data-article'));
                bookmarkArticle(articleData);
            });
        });
    }
}

function getSentimentEmoji(sentiment) {
    const emojis = {
        positive: '😊',
        neutral: '😐',
        negative: '😔'
    };
    return emojis[sentiment] || '😐';
}

function updatePagination(pagination) {
    if (!pagination || pagination.total <= pagination.limit) {
        elements.pagination.style.display = 'none';
        return;
    }

    elements.pagination.style.display = 'flex';
    elements.pageInfo.textContent = `Page ${pagination.page}`;
    
    elements.prevPage.disabled = pagination.page === 1;
    elements.nextPage.disabled = !pagination.hasMore;
}

// ============================================================================
// SAVED SEARCHES & BOOKMARKS
// ============================================================================

async function saveSearch() {
    if (!currentUser || !currentQuery) return;

    try {
        const response = await fetch(`${API_BASE}/api/user/searches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ query: currentQuery })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Search saved successfully!', 'success');
        }
    } catch (error) {
        console.error('Save search error:', error);
        showNotification('Failed to save search', 'error');
    }
}

async function loadSavedSearches() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/api/user/searches`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            displaySavedSearches(data.searches);
        }
    } catch (error) {
        console.error('Load searches error:', error);
    }
}

function displaySavedSearches(searches) {
    if (searches.length === 0) {
        elements.savedSearchesList.innerHTML = '<p class="empty-message">No saved searches yet</p>';
        return;
    }

    elements.savedSearchesList.innerHTML = searches.map(search => `
        <div class="saved-item">
            <span class="saved-query" data-query="${escapeHtml(search.query)}">${escapeHtml(search.query)}</span>
            <button class="btn-delete" data-id="${search.id}">🗑️</button>
        </div>
    `).join('');

    // Add click handlers
    elements.savedSearchesList.querySelectorAll('.saved-query').forEach(item => {
        item.addEventListener('click', function() {
            elements.searchInput.value = this.getAttribute('data-query');
            closeSidebars();
            searchNews();
        });
    });

    elements.savedSearchesList.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteSavedSearch(this.getAttribute('data-id'));
        });
    });
}

async function deleteSavedSearch(id) {
    try {
        await fetch(`${API_BASE}/api/user/searches/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        loadSavedSearches();
    } catch (error) {
        console.error('Delete search error:', error);
    }
}

async function bookmarkArticle(article) {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/api/user/bookmarks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                articleUrl: article.url,
                articleTitle: article.title,
                articleSource: article.source,
                articlePublishedAt: article.publishedAt
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Article bookmarked!', 'success');
        } else if (data.error.includes('already')) {
            showNotification('Article already bookmarked', 'info');
        }
    } catch (error) {
        console.error('Bookmark error:', error);
        showNotification('Failed to bookmark article', 'error');
    }
}

async function loadBookmarks() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/api/user/bookmarks`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.success) {
            displayBookmarks(data.bookmarks);
        }
    } catch (error) {
        console.error('Load bookmarks error:', error);
    }
}

function displayBookmarks(bookmarks) {
    if (bookmarks.length === 0) {
        elements.bookmarksList.innerHTML = '<p class="empty-message">No bookmarks yet</p>';
        return;
    }

    elements.bookmarksList.innerHTML = bookmarks.map(bookmark => `
        <div class="saved-item bookmark-item">
            <div>
                <a href="${escapeHtml(bookmark.article_url)}" target="_blank" class="bookmark-title">
                    ${escapeHtml(bookmark.article_title)}
                </a>
                <small>${escapeHtml(bookmark.article_source || '')}</small>
            </div>
            <button class="btn-delete" data-id="${bookmark.id}">🗑️</button>
        </div>
    `).join('');

    elements.bookmarksList.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteBookmark(this.getAttribute('data-id'));
        });
    });
}

async function deleteBookmark(id) {
    try {
        await fetch(`${API_BASE}/api/user/bookmarks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        loadBookmarks();
    } catch (error) {
        console.error('Delete bookmark error:', error);
    }
}

// ============================================================================
// UI HELPERS
// ============================================================================

function showError(message) {
    elements.results.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    
    return 'Just now';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeAuthModal() {
    elements.authModal.style.display = 'none';
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
}

function closeSidebars() {
    elements.savedSearchesSidebar.classList.remove('open');
    elements.bookmarksSidebar.classList.remove('open');
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Search
elements.searchButton.addEventListener('click', () => searchNews());
elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchNews();
});
elements.searchInput.addEventListener('input', debounceSearch);

// Save search
elements.saveSearchBtn.addEventListener('click', saveSearch);

// Filters
elements.sentimentFilter.addEventListener('change', () => displayResults(allArticles));
elements.impactFilter.addEventListener('change', () => displayResults(allArticles));

// Pagination
elements.prevPage.addEventListener('click', () => {
    if (currentPage > 1) searchNews(currentPage - 1);
});
elements.nextPage.addEventListener('click', () => searchNews(currentPage + 1));

// Auth modal
elements.loginButton.addEventListener('click', () => {
    elements.authModal.style.display = 'block';
});

document.querySelector('.close').addEventListener('click', closeAuthModal);

elements.loginTab.addEventListener('click', () => {
    elements.loginForm.style.display = 'block';
    elements.registerForm.style.display = 'none';
    elements.loginTab.classList.add('active');
    elements.registerTab.classList.remove('active');
});

elements.registerTab.addEventListener('click', () => {
    elements.registerForm.style.display = 'block';
    elements.loginForm.style.display = 'none';
    elements.registerTab.classList.add('active');
    elements.loginTab.classList.remove('active');
});

elements.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    login(email, password);
});

elements.registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    register(username, email, password);
});

elements.logoutButton.addEventListener('click', logout);

// Sidebars
elements.savedSearchesBtn.addEventListener('click', () => {
    elements.savedSearchesSidebar.classList.add('open');
    loadSavedSearches();
});

elements.bookmarksBtn.addEventListener('click', () => {
    elements.bookmarksSidebar.classList.add('open');
    loadBookmarks();
});

elements.closeSidebar.addEventListener('click', closeSidebars);
elements.closeBookmarksSidebar.addEventListener('click', closeSidebars);

// Language switcher
elements.languageSelect.value = currentLanguage;
elements.languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    localStorage.setItem('language', currentLanguage);
    translatePage();
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target === elements.authModal) {
        closeAuthModal();
    }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    translatePage();
    checkAuthStatus();
    elements.searchInput.focus();
});
