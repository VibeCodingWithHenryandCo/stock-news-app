// Stock News Search Application

const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loading = document.getElementById('loading');
const results = document.getElementById('results');

// Handle search
async function searchNews() {
    const query = searchInput.value.trim();
    
    if (!query) {
        showError('Please enter a stock symbol or company name');
        return;
    }

    // Show loading state
    loading.style.display = 'block';
    results.innerHTML = '';

    try {
        const response = await fetch(`/api/news?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        loading.style.display = 'none';

        if (data.success && data.articles) {
            displayResults(data.articles);
        } else {
            showError(data.error || 'Failed to fetch news');
        }
    } catch (error) {
        loading.style.display = 'none';
        showError('Network error. Please try again.');
        console.error('Search error:', error);
    }
}

// Display search results
function displayResults(articles) {
    if (articles.length === 0) {
        results.innerHTML = '<div class="no-results">No news found. Try a different search term.</div>';
        return;
    }

    results.innerHTML = articles.map(article => {
        const publishedDate = new Date(article.publishedAt);
        const timeAgo = getTimeAgo(publishedDate);
        
        return `
            <div class="news-card ${article.impact}-impact">
                <div class="news-header">
                    <h3 class="news-title">${escapeHtml(article.title)}</h3>
                    <span class="impact-badge ${article.impact}">${article.impact} impact</span>
                </div>
                <div class="news-meta">
                    <span>📰 ${escapeHtml(article.source)}</span>
                    <span>🕒 ${timeAgo}</span>
                </div>
                <p class="news-description">${escapeHtml(article.description)}</p>
                <a href="${escapeHtml(article.url)}" class="news-link" target="_blank" rel="noopener noreferrer">
                    Read full article →
                </a>
            </div>
        `;
    }).join('');
}

// Show error message
function showError(message) {
    results.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
}

// Calculate time ago
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

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
searchButton.addEventListener('click', searchNews);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchNews();
    }
});

// Focus input on page load
searchInput.focus();
