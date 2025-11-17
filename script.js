// ============================================================================
// GLOBAL STATE AND CONFIGURATION
// ============================================================================

let sessions = [];
let currentSessionId = null;
let currentUser = null;
let firebaseReady = false;
let editingSessionId = null;
let isAdminLoggedIn = false;

// Admin email - CHANGE THIS to your email address!
const ADMIN_EMAIL = "oksuzian.grigorii@gmail.com";

// Helper function to check if current user is admin
function isAdmin() {
    return currentUser && currentUser.email === ADMIN_EMAIL;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Wait for Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebaseDB && window.firebaseAuth) {
                firebaseReady = true;
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    await waitForFirebase();
    initDarkMode();
    checkAdminSession();
    setupAuthStateListener();
    setupEventListeners();
    loadSessions();
});

// ============================================================================
// AUTHENTICATION SYSTEM
// ============================================================================

// Setup auth state listener
function setupAuthStateListener() {
    window.firebaseAuthState(window.firebaseAuth, (user) => {
        if (user) {
            currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0]
            };
            updateUIForLoggedInUser();
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    });
}

// Update UI when user is logged in
function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const userBtn = document.getElementById('userBtn');
    const userName = document.getElementById('userName');
    
    loginBtn.style.display = 'none';
    userBtn.style.display = 'flex';
    userName.textContent = currentUser.displayName;
    
    // Update admin button visibility
    updateAdminButton();
}

// Update UI when user is logged out
function updateUIForLoggedOutUser() {
    const loginBtn = document.getElementById('loginBtn');
    const userBtn = document.getElementById('userBtn');
    
    loginBtn.style.display = 'block';
    userBtn.style.display = 'none';
    
    // Hide admin button when logged out
    updateAdminButton();
}

// Show auth modal
function showAuthModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal active';
    modal.innerHTML = `
        <div class="auth-content">
            <h3>Welcome to Grish English</h3>
            
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="switchAuthTab('login')">Login</button>
                <button class="auth-tab" onclick="switchAuthTab('signup')">Sign Up</button>
            </div>
            
            <!-- Login Form -->
            <form id="loginForm" class="auth-form" onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="loginEmail" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="auth-submit">Login</button>
                <button type="button" class="auth-cancel" onclick="closeAuthModal()">Cancel</button>
                <div id="loginError" class="auth-error"></div>
            </form>
            
            <!-- Sign Up Form -->
            <form id="signupForm" class="auth-form" style="display: none;" onsubmit="handleSignup(event)">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="signupName" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="signupEmail" required>
                </div>
                <div class="form-group">
                    <label>Password (at least 6 characters)</label>
                    <input type="password" id="signupPassword" required minlength="6">
                </div>
                <button type="submit" class="auth-submit">Sign Up</button>
                <button type="button" class="auth-cancel" onclick="closeAuthModal()">Cancel</button>
                <div id="signupError" class="auth-error"></div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Close auth modal
function closeAuthModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) modal.remove();
}

// Switch between login and signup tabs
function switchAuthTab(tab) {
    const loginTab = document.querySelector('.auth-tab:first-child');
    const signupTab = document.querySelector('.auth-tab:last-child');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        await window.firebaseSignIn(window.firebaseAuth, email, password);
        closeAuthModal();
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = getAuthErrorMessage(error.code);
    }
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const errorDiv = document.getElementById('signupError');
    
    try {
        const userCredential = await window.firebaseCreateUser(window.firebaseAuth, email, password);
        await window.firebaseUpdateProfile(userCredential.user, { displayName: name });
        closeAuthModal();
    } catch (error) {
        console.error('Signup error:', error);
        errorDiv.textContent = getAuthErrorMessage(error.code);
    }
}

// Get user-friendly error messages
function getAuthErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/operation-not-allowed': 'Operation not allowed.',
        'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.'
    };
    return messages[errorCode] || 'An error occurred. Please try again.';
}

// Show user profile menu
function showUserMenu() {
    const existingMenu = document.querySelector('.profile-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const userBtn = document.getElementById('userBtn');
    const menu = document.createElement('div');
    menu.className = 'profile-menu active';
    menu.innerHTML = `
        <div class="profile-menu-item" onclick="showFavorites()">⭐ My Favorites</div>
        <div class="profile-menu-item" onclick="handleLogout()">🚪 Logout</div>
    `;
    
    userBtn.style.position = 'relative';
    userBtn.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!userBtn.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

// Handle logout
async function handleLogout() {
    try {
        await window.firebaseSignOut(window.firebaseAuth);
        const menu = document.querySelector('.profile-menu');
        if (menu) menu.remove();
        
        // Close any open session details
        const detailView = document.querySelector('.session-detail');
        if (detailView) {
            closeSession();
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
}

// ============================================================================
// DARK MODE
// ============================================================================

function initDarkMode() {
    const savedTheme = localStorage.getItem('eslTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateDarkModeIcon(savedTheme);
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('eslTheme', newTheme);
    updateDarkModeIcon(newTheme);
}

function updateDarkModeIcon(theme) {
    const button = document.getElementById('themeToggle');
    if (button) {
        button.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            clearBtn.style.display = 'block';
            searchSessions(query);
        } else {
            clearBtn.style.display = 'none';
            hideSearchResults();
        }
    });
    
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        hideSearchResults();
    });
}

function searchSessions(query) {
    if (!query || query.length < 2) {
        hideSearchResults();
        return;
    }
    
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    sessions.forEach(session => {
        if (session.notes) {
            (session.notes || []).forEach(note => {
                // Search in title
                if (note.title && note.title.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        sessionId: session.id,
                        sessionDate: session.date,
                        noteTitle: note.title,
                        matchedIn: 'title',
                        matchedText: note.title,
                        query: query
                    });
                }
                
                // Search in definition
                if (note.definition && note.definition.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        sessionId: session.id,
                        sessionDate: session.date,
                        noteTitle: note.title,
                        matchedIn: 'definition',
                        matchedText: note.definition,
                        query: query
                    });
                }
                
                // Search in examples
                (note.examples || []).forEach((example, index) => {
                    if (example.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            sessionId: session.id,
                            sessionDate: session.date,
                            noteTitle: note.title,
                            matchedIn: 'example',
                            matchedText: example,
                            query: query
                        });
                    }
                });
            });
        }
    });
    
    displaySearchResults(results);
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results">No results found</div>';
        container.classList.add('active');
        return;
    }
    
    container.innerHTML = results.map(result => {
        // Highlight the search term in the matched text
        const highlightedText = highlightSearchTerm(result.matchedText, result.query);
        
        // Get snippet with context (max 150 chars)
        const snippet = getTextSnippet(result.matchedText, result.query, 150);
        const highlightedSnippet = highlightSearchTerm(snippet, result.query);
        
        // Badge to show where it matched
        const badge = result.matchedIn === 'title' ? '📌 Word' : 
                     result.matchedIn === 'definition' ? '📖 Definition' : 
                     '💬 Example';
        
        return `
            <div class="search-result" onclick="openSessionFromSearch('${result.sessionId}')">
                <div class="search-result-header">
                    <span class="search-badge">${badge}</span>
                    <span class="search-word">${escapeHtml(result.noteTitle)}</span>
                </div>
                <div class="search-result-text">${highlightedSnippet}</div>
                <div class="search-result-footer">📅 ${formatDate(result.sessionDate)}</div>
            </div>
        `;
    }).join('');
    
    container.classList.add('active');
}

// Helper function to highlight search term in text
function highlightSearchTerm(text, query) {
    if (!text || !query) return escapeHtml(text);
    
    const escapedText = escapeHtml(text);
    const escapedQuery = escapeHtml(query);
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapedText.replace(regex, '<mark>$1</mark>');
}

// Helper function to get text snippet around the match
function getTextSnippet(text, query, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);
    
    if (matchIndex === -1) return text.substring(0, maxLength) + '...';
    
    // Calculate start position to center the match
    const halfLength = Math.floor(maxLength / 2);
    let start = Math.max(0, matchIndex - halfLength);
    let end = Math.min(text.length, start + maxLength);
    
    // Adjust start if we're at the end
    if (end - start < maxLength) {
        start = Math.max(0, end - maxLength);
    }
    
    let snippet = text.substring(start, end);
    
    // Add ellipsis
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
}

function hideSearchResults() {
    const container = document.getElementById('searchResults');
    container.classList.remove('active');
    container.innerHTML = '';
}

function openSessionFromSearch(sessionId) {
    hideSearchResults();
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').style.display = 'none';
    openSession(sessionId);
}

// ============================================================================
// FAVORITES SYSTEM
// ============================================================================

function getFavorites() {
    if (!currentUser) return [];
    const key = `eslFavorites_${currentUser.uid}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveFavorites(favorites) {
    if (!currentUser) return;
    const key = `eslFavorites_${currentUser.uid}`;
    localStorage.setItem(key, JSON.stringify(favorites));
}

function toggleFavorite(sessionId, noteTitle) {
    if (!currentUser) {
        alert('Please login to save favorites!');
        showAuthModal();
        return false;
    }
    
    const favorites = getFavorites();
    const favoriteId = `${sessionId}-${noteTitle}`;
    
    const index = favorites.findIndex(f => f.id === favoriteId);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        const session = sessions.find(s => s.id === sessionId);
        const note = (session.notes || []).find(n => n.title === noteTitle);
        
        favorites.push({
            id: favoriteId,
            sessionId: sessionId,
            sessionDate: session.date,
            note: note,
            addedAt: Date.now()
        });
    }
    
    saveFavorites(favorites);
    return index === -1; // Return true if added, false if removed
}

function isFavorite(sessionId, noteTitle) {
    if (!currentUser) return false;
    const favorites = getFavorites();
    return favorites.some(f => f.id === `${sessionId}-${noteTitle}`);
}

function toggleFavoriteUI(sessionId, noteTitle, button) {
    const isNowFavorite = toggleFavorite(sessionId, noteTitle);
    if (isNowFavorite !== false) {
        button.classList.toggle('active');
    }
}

function showFavorites() {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    const favorites = getFavorites();
    
    // Hide main page
    document.getElementById('sessionsContainer').style.display = 'none';
    document.querySelector('.search-section').style.display = 'none';
    
    // Remove any existing detail views
    document.querySelectorAll('.session-detail').forEach(el => el.remove());
    
    // Create favorites view
    const favoritesView = document.createElement('div');
    favoritesView.className = 'session-detail active';
    favoritesView.innerHTML = `
        <button class="back-btn" onclick="closeFavorites()">← Back to Sessions</button>
        
        <div class="session-header">
            <h2>⭐ My Favorites</h2>
        </div>
        
        <div class="content-sections">
            <div class="content-box">
                ${favorites.length === 0 ? `
                    <div class="empty-state">
                        <h2>No Favorites Yet</h2>
                        <p>Click the star icon on any vocabulary word to save it here!</p>
                    </div>
                ` : `
                    ${favorites.map(fav => `
                        <div class="note-item">
                            <div class="note-header">
                                <div class="note-title">${escapeHtml(fav.note.title)}</div>
                                <button class="favorite-btn active" onclick="removeFavoriteFromView('${fav.id}', this)">⭐</button>
                            </div>
                            ${fav.note.pronunciation ? `<div class="note-pronunciation">🔊 <a href="${fav.note.pronunciation}" target="_blank">Pronunciation</a></div>` : ''}
                            <div class="note-definition">${escapeHtml(fav.note.definition)}</div>
                            ${(fav.note.examples || []).map(ex => `<div class="note-example">${escapeHtml(ex)}</div>`).join('')}
                            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-secondary);">
                                <small style="color: var(--text-light);">From session: ${formatDate(fav.sessionDate)} • <a href="#" onclick="event.preventDefault(); openSession('${fav.sessionId}'); closeFavorites();" style="color: var(--accent-brown);">View session</a></small>
                            </div>
                        </div>
                    `).join('')}
                `}
            </div>
        </div>
    `;
    
    document.querySelector('.container').appendChild(favoritesView);
    
    // Close user menu if open
    const menu = document.querySelector('.profile-menu');
    if (menu) menu.remove();
}

function closeFavorites() {
    document.querySelectorAll('.session-detail').forEach(el => el.remove());
    document.getElementById('sessionsContainer').style.display = 'grid';
    document.querySelector('.search-section').style.display = 'block';
}

function removeFavoriteFromView(favoriteId, button) {
    const [sessionId, ...titleParts] = favoriteId.split('-');
    const noteTitle = titleParts.join('-');
    
    toggleFavorite(sessionId, noteTitle);
    
    // Remove from view
    const noteItem = button.closest('.note-item');
    noteItem.remove();
    
    // Check if there are any favorites left
    const favorites = getFavorites();
    if (favorites.length === 0) {
        document.querySelector('.content-box').innerHTML = `
            <div class="empty-state">
                <h2>No Favorites Yet</h2>
                <p>Click the star icon on any vocabulary word to save it here!</p>
            </div>
        `;
    }
}

// ============================================================================
// ADMIN SESSION MANAGEMENT
// ============================================================================

function checkAdminSession() {
    // Admin status is now based on Firebase auth, not localStorage
    return isAdmin();
}

function logoutAdmin() {
    // Just close admin panel, user stays logged into Firebase
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.remove();
    alert('Admin panel closed. You are still logged into your account.');
}

function updateAdminButton() {
    const adminBtn = document.getElementById('adminBtn');
    if (!adminBtn) return;
    
    if (isAdmin()) {
        adminBtn.textContent = 'Admin ✓';
        adminBtn.style.opacity = '0.9';
        adminBtn.style.display = 'block';
    } else {
        // Hide admin button for non-admin users
        adminBtn.style.display = 'none';
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    const adminBtn = document.getElementById('adminBtn');
    const loginBtn = document.getElementById('loginBtn');
    const userBtn = document.getElementById('userBtn');
    const themeToggle = document.getElementById('themeToggle');
    
    updateAdminButton();
    
    adminBtn.addEventListener('click', () => {
        if (isAdmin()) {
            openAdmin();
        } else {
            alert('You must be logged in as admin to access this feature.\n\nIf you are the admin, please log in with your admin email address.');
            showAuthModal();
        }
    });
    
    loginBtn.addEventListener('click', showAuthModal);
    userBtn.addEventListener('click', showUserMenu);
    themeToggle.addEventListener('click', toggleDarkMode);
    
    setupSearch();
}

// ============================================================================
// SESSION LOADING AND DISPLAY
// ============================================================================

async function loadSessions() {
    try {
        const sessionsRef = window.firebaseRef(window.firebaseDB, 'sessions');
        
        window.firebaseOnValue(sessionsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                sessions = Object.values(data);
            } else {
                sessions = [];
            }
            
            sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
            displaySessions();
        });
    } catch (error) {
        console.error('Error loading sessions:', error);
        displaySessions();
    }
}

async function saveSessions() {
    try {
        const sessionsRef = window.firebaseRef(window.firebaseDB, 'sessions');
        const sessionsObj = {};
        sessions.forEach(session => {
            sessionsObj[session.id] = session;
        });
        await window.firebaseSet(sessionsRef, sessionsObj);
        return true;
    } catch (error) {
        console.error('Error saving sessions:', error);
        alert('Error saving to database. Please try again.');
        return false;
    }
}

async function deleteSessionFromFirebase(sessionId) {
    try {
        const sessionRef = window.firebaseRef(window.firebaseDB, `sessions/${sessionId}`);
        await window.firebaseRemove(sessionRef);
        return true;
    } catch (error) {
        console.error('Error deleting session:', error);
        return false;
    }
}

function displaySessions() {
    const container = document.getElementById('sessionsContainer');
    
    document.querySelectorAll('.session-detail').forEach(el => el.remove());
    
    if (sessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>No Sessions Yet</h2>
                <p>Click the Admin button to add your first session!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sessions.map(session => `
        <div class="session-box" data-session-id="${session.id}">
            <h2>${formatDate(session.date)}</h2>
            <p>${session.notes?.length || 0} notes • ${session.exercises?.length || 0} exercises • ${session.links?.length || 0} links</p>
        </div>
    `).join('');
    
    document.querySelectorAll('.session-box').forEach(box => {
        box.addEventListener('click', function() {
            const sessionId = this.getAttribute('data-session-id');
            openSession(sessionId);
        });
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ============================================================================
// SESSION DETAIL VIEW
// ============================================================================

function openSession(sessionId) {
    console.log('Opening session:', sessionId);
    currentSessionId = sessionId;
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        console.error('Session not found:', sessionId);
        return;
    }
    
    console.log('Session data:', session);
    
    document.querySelectorAll('.session-detail').forEach(el => el.remove());
    
    const container = document.getElementById('sessionsContainer');
    container.style.display = 'none';
    document.querySelector('.search-section').style.display = 'none';
    
    try {
        const detailView = createSessionDetailView(session);
        document.querySelector('.container').appendChild(detailView);
        console.log('Detail view created successfully');
    } catch (error) {
        console.error('Error creating detail view:', error);
        container.style.display = 'grid';
        document.querySelector('.search-section').style.display = 'block';
    }
}

function createSessionDetailView(session) {
    const detail = document.createElement('div');
    detail.className = 'session-detail active';
    detail.innerHTML = `
        <button class="back-btn" onclick="closeSession()">← Back to Sessions</button>
        
        <div class="session-header">
            <div>
                <h2>${formatDate(session.date)}</h2>
            </div>
            ${currentUser ? `<a href="#" class="favorites-link" onclick="event.preventDefault(); showFavorites();">⭐ My Favorites</a>` : ''}
        </div>
        
        <div class="tab-navigation">
            <button class="tab-btn active" onclick="switchTab('notes')" id="tab-notes">
                <span class="tab-btn-icon">📝</span>
                Notes
            </button>
            <button class="tab-btn" onclick="switchTab('exercises')" id="tab-exercises">
                <span class="tab-btn-icon">✍️</span>
                Exercises
            </button>
            <button class="tab-btn" onclick="switchTab('links')" id="tab-links">
                <span class="tab-btn-icon">🔗</span>
                Links
            </button>
        </div>
        
        <div id="content-notes" class="tab-content active">
            <div class="content-sections">
                <div class="content-box">
                    <h3>Vocabulary & Expressions</h3>
                    <div class="content-box-content">
                        ${(session.notes || []).length > 0 ? (session.notes || []).map((note, index) => `
                            <div class="note-item">
                                <div class="note-header">
                                    <div class="note-title">${escapeHtml(note.title)}</div>
                                    ${currentUser ? `<button class="favorite-btn ${isFavorite(session.id, note.title) ? 'active' : ''}" onclick="toggleFavoriteUI('${session.id}', '${escapeHtml(note.title)}', this)">⭐</button>` : ''}
                                </div>
                                ${note.pronunciation ? `<div class="note-pronunciation">🔊 <a href="${note.pronunciation}" target="_blank">Pronunciation</a></div>` : ''}
                                <div class="note-definition">${escapeHtml(note.definition)}</div>
                                ${(note.examples || []).map(ex => `<div class="note-example">${escapeHtml(ex)}</div>`).join('')}
                            </div>
                        `).join('') : '<p>No notes available for this session.</p>'}
                    </div>
                </div>
                
                ${renderCommentsSection(session.id, 'notes')}
            </div>
        </div>
        
        <div id="content-exercises" class="tab-content">
            <div class="content-sections">
                <div class="content-box">
                    <h3>Practice Exercises</h3>
                    <div class="content-box-content">
                        ${(session.exercises || []).length > 0 ? (session.exercises || []).map((exercise, index) => 
                            renderExercise(exercise, index)
                        ).join('') : '<p>No exercises available for this session.</p>'}
                    </div>
                </div>
                
                ${renderCommentsSection(session.id, 'exercises')}
            </div>
        </div>
        
        <div id="content-links" class="tab-content">
            <div class="content-sections">
                <div class="content-box">
                    <h3>Useful Resources</h3>
                    <div class="content-box-content">
                        ${(session.links || []).length > 0 ? (session.links || []).map(link => `
                            <div class="link-item">
                                <a href="${link.url}" target="_blank">${escapeHtml(link.title)}</a>
                                ${link.description ? `<p>${escapeHtml(link.description)}</p>` : ''}
                            </div>
                        `).join('') : '<p>No links available for this session.</p>'}
                    </div>
                </div>
                
                ${renderCommentsSection(session.id, 'links')}
            </div>
        </div>
    `;
    
    return detail;
}

function renderExercise(exercise, index) {
    let html = '<div class="exercise-item">';
    
    if (exercise.type === 'fill-blank') {
        html += `
            <div class="exercise-question">${escapeHtml(exercise.question)}</div>
            <input type="text" class="exercise-input" placeholder="Your answer..." data-answer="${escapeHtml(exercise.answer)}">
            <button class="check-btn" onclick="checkFillBlank(${index})">Check Answer</button>
            <div class="exercise-feedback"></div>
        `;
    } else if (exercise.type === 'multiple-choice') {
        html += `
            <div class="exercise-question">${escapeHtml(exercise.question)}</div>
            <div class="exercise-options">
                ${exercise.options.map((option, optIndex) => `
                    <div class="exercise-option" onclick="selectOption(${index}, ${optIndex})">
                        ${escapeHtml(option)}
                    </div>
                `).join('')}
            </div>
            <button class="check-btn" onclick="checkMultipleChoice(${index}, ${exercise.correctIndex})">Check Answer</button>
            <div class="exercise-feedback"></div>
        `;
    } else if (exercise.type === 'text') {
        html += `
            <div class="exercise-question">${escapeHtml(exercise.question)}</div>
            <div class="note-definition">${escapeHtml(exercise.instructions)}</div>
        `;
    }
    
    // Add links to exercises if they exist
    if (exercise.links && exercise.links.length > 0) {
        html += `
            <div class="exercise-links">
                <h5>📎 Related Links:</h5>
                ${(exercise.links || []).map(link => `
                    <a href="${link.url}" target="_blank" class="exercise-link">
                        ${escapeHtml(link.title)}${link.description ? ` - ${escapeHtml(link.description)}` : ''}
                    </a>
                `).join('')}
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`content-${tab}`).classList.add('active');
}

function checkFillBlank(index) {
    const exerciseItem = document.querySelectorAll('.exercise-item')[index];
    const input = exerciseItem.querySelector('.exercise-input');
    const feedback = exerciseItem.querySelector('.exercise-feedback');
    const correctAnswer = input.dataset.answer.toLowerCase().trim();
    const userAnswer = input.value.toLowerCase().trim();
    
    if (userAnswer === correctAnswer) {
        feedback.textContent = '✓ Correct!';
        feedback.className = 'exercise-feedback correct';
        input.style.borderColor = '#4caf50';
    } else {
        feedback.textContent = `✗ Incorrect. The answer is: ${input.dataset.answer}`;
        feedback.className = 'exercise-feedback incorrect';
        input.style.borderColor = '#e57373';
    }
}

function selectOption(exerciseIndex, optionIndex) {
    const exerciseItem = document.querySelectorAll('.exercise-item')[exerciseIndex];
    const options = exerciseItem.querySelectorAll('.exercise-option');
    
    options.forEach(opt => opt.classList.remove('selected'));
    options[optionIndex].classList.add('selected');
}

function checkMultipleChoice(exerciseIndex, correctIndex) {
    const exerciseItem = document.querySelectorAll('.exercise-item')[exerciseIndex];
    const options = exerciseItem.querySelectorAll('.exercise-option');
    const feedback = exerciseItem.querySelector('.exercise-feedback');
    
    let selectedIndex = -1;
    options.forEach((opt, idx) => {
        if (opt.classList.contains('selected')) {
            selectedIndex = idx;
        }
    });
    
    if (selectedIndex === -1) {
        alert('Please select an answer first.');
        return;
    }
    
    options.forEach((opt, idx) => {
        opt.classList.remove('selected');
        if (idx === correctIndex) {
            opt.classList.add('correct');
        } else if (idx === selectedIndex && idx !== correctIndex) {
            opt.classList.add('incorrect');
        }
    });
    
    if (selectedIndex === correctIndex) {
        feedback.textContent = '✓ Correct!';
        feedback.className = 'exercise-feedback correct';
    } else {
        feedback.textContent = '✗ Incorrect. Try again!';
        feedback.className = 'exercise-feedback incorrect';
    }
}

function closeSession() {
    console.log('Closing session');
    const detailView = document.querySelector('.session-detail');
    if (detailView) {
        detailView.remove();
    }
    const container = document.getElementById('sessionsContainer');
    if (container) {
        container.style.display = 'grid';
    }
    const searchSection = document.querySelector('.search-section');
    if (searchSection) {
        searchSection.style.display = 'block';
    }
    currentSessionId = null;
}

// ============================================================================
// COMMENTS SYSTEM WITH USER PROFILES
// ============================================================================

function renderCommentsSection(sessionId, section) {
    const comments = getComments(sessionId, section);
    
    return `
        <div class="comments-container">
            <div class="comment-form">
                <h4>💬 Comments</h4>
                ${currentUser ? `
                    <textarea id="comment-${sessionId}-${section}" class="comment-input" placeholder="Share your thoughts..." rows="3"></textarea>
                    <button class="comment-submit" onclick="submitComment('${sessionId}', '${section}')">Post Comment</button>
                ` : `
                    <p style="color: var(--text-muted); text-align: center; padding: 20px;">
                        <a href="#" onclick="event.preventDefault(); showAuthModal();" style="color: var(--accent-brown); text-decoration: none;">Login</a> to post comments
                    </p>
                `}
            </div>
            
            ${comments.length > 0 ? `
                <div class="comments-list">
                    ${renderComments(comments)}
                </div>
            ` : ''}
        </div>
    `;
}

function renderComments(comments) {
    return comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <span class="comment-author">👤 ${escapeHtml(comment.author)}</span>
                <span class="comment-date">${new Date(comment.timestamp).toLocaleString()}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
        </div>
    `).join('');
}

async function getComments(sessionId, section) {
    try {
        const commentsRef = window.firebaseRef(window.firebaseDB, `comments/${sessionId}/${section}`);
        const snapshot = await window.firebaseGet(commentsRef);
        
        if (snapshot.exists()) {
            const commentsObj = snapshot.val();
            return Object.values(commentsObj).sort((a, b) => b.timestamp - a.timestamp);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
    return [];
}

async function submitComment(sessionId, section) {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    const commentInput = document.getElementById(`comment-${sessionId}-${section}`);
    const text = commentInput.value.trim();
    
    if (!text) {
        alert('Please enter a comment.');
        return;
    }
    
    try {
        const commentsRef = window.firebaseRef(window.firebaseDB, `comments/${sessionId}/${section}`);
        const newCommentRef = window.firebasePush(commentsRef);
        
        await window.firebaseSet(newCommentRef, {
            author: currentUser.displayName,
            authorId: currentUser.uid,
            text: text,
            timestamp: Date.now()
        });
        
        commentInput.value = '';
        
        // Reload comments
        const comments = await getComments(sessionId, section);
        const commentsList = document.querySelector(`#content-${section} .comments-list`);
        if (commentsList) {
            commentsList.innerHTML = renderComments(comments);
        } else {
            // Create comments list if it doesn't exist
            const commentsContainer = document.querySelector(`#content-${section} .comments-container`);
            const newList = document.createElement('div');
            newList.className = 'comments-list';
            newList.innerHTML = renderComments(comments);
            commentsContainer.appendChild(newList);
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Error posting comment. Please try again.');
    }
}

// ============================================================================
// ADMIN PANEL
// ============================================================================

// Password modal functions removed - admin access now based on Firebase email auth

function openAdmin() {
    // Double-check admin status before opening
    if (!isAdmin()) {
        alert('Admin access denied. Please log in with your admin email.');
        return;
    }
    const adminPanel = createAdminPanel();
    document.body.appendChild(adminPanel);
}

function createAdminPanel() {
    const panel = document.createElement('div');
    panel.className = 'admin-panel active';
    panel.id = 'adminPanel';
    
    panel.innerHTML = `
        <div class="admin-content">
            <div class="admin-header">
                <h2>Admin Panel</h2>
                <div style="display: flex; gap: 12px;">
                    <button class="logout-btn" onclick="logoutAdmin(); closeAdmin(); updateAdminButton();">Logout</button>
                    <button class="close-admin-btn" onclick="closeAdmin()">Close</button>
                </div>
            </div>
            
            <div style="background: #fffcf0; border: 2px solid #d4af37; border-radius: 12px; padding: 16px; margin-bottom: 30px;">
                <h4 style="color: #1a1a1a; margin-bottom: 8px;">✨ Firebase Connected!</h4>
                <p style="color: #666; margin: 0;">Sessions are saved instantly to the cloud. Students see updates in real-time!</p>
            </div>
            
            <h3 style="color: var(--text-primary); margin-top: 30px; margin-bottom: 20px;">Add New Session</h3>
            
            <form class="admin-form" onsubmit="saveNewSession(event)">
                <div class="form-group">
                    <label>Date (Saturday)</label>
                    <input type="date" id="sessionDate" required>
                </div>
                
                <div class="form-group">
                    <label>Notes (Paste all notes at once)</label>
                    <div class="parse-info">
                        <strong>Use ==== to separate notes!</strong><br><br>
                        <strong>Example:</strong><br>
                        <code style="display: block; white-space: pre; font-size: 0.85rem; line-height: 1.6;">END UP
to finally be or do something after a process
We ended up at the wrong place.
How did you end up here?
====
TAKE A CHILL PILL
(slang) relax, calm down
You need to take a chill pill!
====</code>
                        <br>
                        <strong>Format:</strong><br>
                        • First line = word/phrase (title)<br>
                        • Second line = definition<br>
                        • Rest = examples<br>
                        • <strong>Use ==== between different notes</strong>
                    </div>
                    <textarea id="notesText" placeholder="END UP
to finally be or do something
Example 1
Example 2
====
NEXT WORD
definition
example
====" style="min-height: 300px;"></textarea>
                    <p class="helper-text"><strong>Remember: ==== separates different notes!</strong></p>
                </div>
                
                <div class="form-group">
                    <label>Exercises</label>
                    <div id="exercisesContainer"></div>
                    <button type="button" class="add-item-btn" onclick="addExerciseFields()">+ Add Exercise</button>
                </div>
                
                <div class="form-group">
                    <label>Links</label>
                    <div id="linksContainer"></div>
                    <button type="button" class="add-item-btn" onclick="addLinkFields()">+ Add Link</button>
                </div>
                
                <button type="submit" class="save-session-btn">Save Session to Cloud</button>
            </form>
            
            <div class="sessions-list">
                <h3 style="color: var(--text-primary); margin-bottom: 20px;">Existing Sessions</h3>
                ${renderSessionsList()}
            </div>
        </div>
    `;
    
    return panel;
}

function renderSessionsList() {
    if (sessions.length === 0) {
        return '<p style="color: #999;">No sessions yet.</p>';
    }
    
    return sessions.map(session => `
        <div class="session-list-item">
            <div>
                <h4>${formatDate(session.date)}</h4>
                <p style="color: var(--text-muted);">${session.notes?.length || 0} notes • ${session.exercises?.length || 0} exercises • ${session.links?.length || 0} links</p>
            </div>
            <div style="display: flex; gap: 12px;">
                <button class="edit-session-btn" onclick="editSession('${session.id}')">Edit</button>
                <button class="delete-session-btn" onclick="deleteSession('${session.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function closeAdmin() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.remove();
}

// ============================================================================
// EDIT SESSION
// ============================================================================

function editSession(sessionId) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    editingSessionId = sessionId;
    
    document.getElementById('sessionDate').value = session.date;
    
    // Convert notes back to text format
    const notesText = (session.notes || []).map(note => {
        let text = note.title;
        if (note.pronunciation) {
            text += '\n🔊 Pronunciation: ' + note.pronunciation;
        }
        if (note.definition) {
            text += '\n' + note.definition;
        }
        if (note.examples && note.examples.length > 0) {
            text += '\n' + note.examples.join('\n');
        }
        return text;
    }).join('\n====\n');
    
    document.getElementById('notesText').value = notesText;
    
    // Populate exercises
    const exercisesContainer = document.getElementById('exercisesContainer');
    exercisesContainer.innerHTML = '';
    if (session.exercises && session.exercises.length > 0) {
        session.exercises.forEach(exercise => {
            addExerciseFields();
            const lastExercise = exercisesContainer.lastElementChild;
            lastExercise.querySelector('[data-field="type"]').value = exercise.type;
            updateExerciseFields(lastExercise.id);
            
            setTimeout(() => {
                if (exercise.type === 'fill-blank') {
                    lastExercise.querySelector('[data-field="question"]').value = exercise.question || '';
                    lastExercise.querySelector('[data-field="answer"]').value = exercise.answer || '';
                } else if (exercise.type === 'multiple-choice') {
                    lastExercise.querySelector('[data-field="question"]').value = exercise.question || '';
                    const optionsText = exercise.options.map((opt, idx) => 
                        idx === exercise.correctIndex ? '*' + opt : opt
                    ).join('\n');
                    lastExercise.querySelector('[data-field="options"]').value = optionsText;
                } else if (exercise.type === 'text') {
                    lastExercise.querySelector('[data-field="question"]').value = exercise.question || '';
                    lastExercise.querySelector('[data-field="instructions"]').value = exercise.instructions || '';
                }
                
                // Populate exercise links
                if (exercise.links && exercise.links.length > 0) {
                    const linksContainer = lastExercise.querySelector('.exercise-links-container');
                    if (linksContainer) {
                        exercise.links.forEach(link => {
                            addExerciseLinkField(lastExercise.id);
                            const linkFields = linksContainer.querySelectorAll('.exercise-link-item');
                            const lastLinkField = linkFields[linkFields.length - 1];
                            lastLinkField.querySelector('[data-field="link-title"]').value = link.title || '';
                            lastLinkField.querySelector('[data-field="link-url"]').value = link.url || '';
                            lastLinkField.querySelector('[data-field="link-desc"]').value = link.description || '';
                        });
                    }
                }
            }, 100);
        });
    }
    
    // Populate links
    const linksContainer = document.getElementById('linksContainer');
    linksContainer.innerHTML = '';
    if (session.links && session.links.length > 0) {
        session.links.forEach(link => {
            addLinkFields();
            const lastLink = linksContainer.lastElementChild;
            setTimeout(() => {
                lastLink.querySelector('[data-field="title"]').value = link.title || '';
                lastLink.querySelector('[data-field="url"]').value = link.url || '';
                lastLink.querySelector('[data-field="description"]').value = link.description || '';
            }, 100);
        });
    }
    
    document.querySelector('.save-session-btn').textContent = 'Update Session';
    document.querySelector('.admin-form').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================================
// ADD EXERCISE AND LINK FIELDS
// ============================================================================

let exerciseCounter = 0;
function addExerciseFields() {
    const container = document.getElementById('exercisesContainer');
    const exerciseId = `exercise-${exerciseCounter++}`;
    
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'item-preview';
    exerciseDiv.id = exerciseId;
    exerciseDiv.innerHTML = `
        <select class="comment-input" style="margin-bottom: 10px;" data-field="type" onchange="updateExerciseFields('${exerciseId}')">
            <option value="">Select exercise type...</option>
            <option value="fill-blank">Fill in the Blank</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="text">Text Instructions</option>
        </select>
        <div class="exercise-specific-fields"></div>
        <div class="exercise-links-container"></div>
        <button type="button" class="add-item-btn" onclick="addExerciseLinkField('${exerciseId}')" style="margin-top: 10px;">+ Add Link to Exercise</button>
        <button type="button" class="remove-item-btn" onclick="document.getElementById('${exerciseId}').remove()">Remove Exercise</button>
    `;
    
    container.appendChild(exerciseDiv);
}

function updateExerciseFields(exerciseId) {
    const exerciseDiv = document.getElementById(exerciseId);
    const typeSelect = exerciseDiv.querySelector('[data-field="type"]');
    const specificFields = exerciseDiv.querySelector('.exercise-specific-fields');
    
    const type = typeSelect.value;
    
    if (type === 'fill-blank') {
        specificFields.innerHTML = `
            <input type="text" placeholder="Question (e.g., She speaks very ___)" class="comment-input" style="margin-bottom: 10px;" data-field="question" required>
            <input type="text" placeholder="Answer" class="comment-input" style="margin-bottom: 10px;" data-field="answer" required>
        `;
    } else if (type === 'multiple-choice') {
        specificFields.innerHTML = `
            <input type="text" placeholder="Question" class="comment-input" style="margin-bottom: 10px;" data-field="question" required>
            <textarea placeholder="Options (one per line, mark correct answer with *)" class="comment-input" style="margin-bottom: 10px;" data-field="options" required></textarea>
            <small style="color: #8b7355;">Example: Option 1
*Correct Option
Option 3</small>
        `;
    } else if (type === 'text') {
        specificFields.innerHTML = `
            <input type="text" placeholder="Question/Title" class="comment-input" style="margin-bottom: 10px;" data-field="question" required>
            <textarea placeholder="Instructions" class="comment-input" style="margin-bottom: 10px;" data-field="instructions" required></textarea>
        `;
    } else {
        specificFields.innerHTML = '';
    }
}

let exerciseLinkCounter = 0;
function addExerciseLinkField(exerciseId) {
    const exerciseDiv = document.getElementById(exerciseId);
    const linksContainer = exerciseDiv.querySelector('.exercise-links-container');
    const linkId = `exercise-link-${exerciseLinkCounter++}`;
    
    const linkDiv = document.createElement('div');
    linkDiv.className = 'exercise-link-item';
    linkDiv.id = linkId;
    linkDiv.style.cssText = 'background: var(--bg-tertiary); padding: 12px; margin-top: 10px; border-radius: 8px; border-left: 3px solid var(--border-gold);';
    linkDiv.innerHTML = `
        <p style="color: var(--text-primary); font-weight: 600; margin-bottom: 8px;">📎 Exercise Link:</p>
        <input type="text" placeholder="Link Title" class="comment-input" style="margin-bottom: 8px;" data-field="link-title">
        <input type="url" placeholder="URL" class="comment-input" style="margin-bottom: 8px;" data-field="link-url">
        <input type="text" placeholder="Description (optional)" class="comment-input" style="margin-bottom: 8px;" data-field="link-desc">
        <button type="button" class="remove-item-btn" onclick="document.getElementById('${linkId}').remove()">Remove Link</button>
    `;
    
    linksContainer.appendChild(linkDiv);
}

let linkCounter = 0;
function addLinkFields() {
    const container = document.getElementById('linksContainer');
    const linkId = `link-${linkCounter++}`;
    
    const linkDiv = document.createElement('div');
    linkDiv.className = 'item-preview';
    linkDiv.id = linkId;
    linkDiv.innerHTML = `
        <input type="text" placeholder="Title" class="comment-input" style="margin-bottom: 10px;" data-field="title">
        <input type="url" placeholder="URL" class="comment-input" style="margin-bottom: 10px;" data-field="url">
        <input type="text" placeholder="Description" class="comment-input" style="margin-bottom: 10px;" data-field="description">
        <button type="button" class="remove-item-btn" onclick="document.getElementById('${linkId}').remove()">Remove Link</button>
    `;
    
    container.appendChild(linkDiv);
}

// ============================================================================
// SAVE SESSION
// ============================================================================

async function saveNewSession(event) {
    event.preventDefault();
    
    const date = document.getElementById('sessionDate').value;
    
    // Parse notes from bulk text
    const notesText = document.getElementById('notesText').value;
    const notes = parseNotes(notesText);
    
    console.log('Parsed notes:', notes);
    
    // Collect exercises
    const exercises = [];
    document.querySelectorAll('#exercisesContainer .item-preview').forEach(exerciseDiv => {
        const type = exerciseDiv.querySelector('[data-field="type"]').value;
        
        if (!type) return;
        
        const exercise = { type };
        
        if (type === 'fill-blank') {
            exercise.question = exerciseDiv.querySelector('[data-field="question"]').value.trim();
            exercise.answer = exerciseDiv.querySelector('[data-field="answer"]').value.trim();
        } else if (type === 'multiple-choice') {
            exercise.question = exerciseDiv.querySelector('[data-field="question"]').value.trim();
            const optionsText = exerciseDiv.querySelector('[data-field="options"]').value;
            const optionLines = optionsText.split('\n').map(l => l.trim()).filter(l => l);
            
            exercise.options = [];
            exercise.correctIndex = -1;
            
            optionLines.forEach((line, idx) => {
                if (line.startsWith('*')) {
                    exercise.correctIndex = exercise.options.length;
                    exercise.options.push(line.substring(1).trim());
                } else {
                    exercise.options.push(line);
                }
            });
        } else if (type === 'text') {
            exercise.question = exerciseDiv.querySelector('[data-field="question"]').value.trim();
            exercise.instructions = exerciseDiv.querySelector('[data-field="instructions"]').value.trim();
        }
        
        // Collect exercise links
        const exerciseLinks = [];
        exerciseDiv.querySelectorAll('.exercise-link-item').forEach(linkDiv => {
            const title = linkDiv.querySelector('[data-field="link-title"]').value.trim();
            const url = linkDiv.querySelector('[data-field="link-url"]').value.trim();
            const description = linkDiv.querySelector('[data-field="link-desc"]').value.trim();
            
            if (title && url) {
                exerciseLinks.push({ title, url, description });
            }
        });
        
        if (exerciseLinks.length > 0) {
            exercise.links = exerciseLinks;
        }
        
        if (exercise.question) {
            exercises.push(exercise);
        }
    });
    
    // Collect links
    const links = [];
    document.querySelectorAll('#linksContainer .item-preview').forEach(linkDiv => {
        const title = linkDiv.querySelector('[data-field="title"]').value.trim();
        const url = linkDiv.querySelector('[data-field="url"]').value.trim();
        const description = linkDiv.querySelector('[data-field="description"]').value.trim();
        
        if (title && url) {
            links.push({ title, url, description });
        }
    });
    
    if (editingSessionId) {
        // Update existing session
        const sessionIndex = sessions.findIndex(s => s.id === editingSessionId);
        if (sessionIndex !== -1) {
            sessions[sessionIndex] = {
                id: editingSessionId,
                date: date,
                notes: notes,
                exercises: exercises,
                links: links
            };
        }
        editingSessionId = null;
    } else {
        // Create new session
        const session = {
            id: generateId(),
            date: date,
            notes: notes,
            exercises: exercises,
            links: links
        };
        sessions.push(session);
    }
    
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Save to Firebase
    const saved = await saveSessions();
    
    if (saved) {
        // Reset form
        document.querySelector('.admin-form').reset();
        document.getElementById('exercisesContainer').innerHTML = '';
        document.getElementById('linksContainer').innerHTML = '';
        document.querySelector('.save-session-btn').textContent = 'Save Session to Cloud';
        
        showSuccessMessage();
    }
}

// ============================================================================
// NOTE PARSING
// ============================================================================

function parseNotes(notesText) {
    if (!notesText || !notesText.trim()) return [];
    
    const notes = [];
    
    // Split by ==== to separate different notes
    const noteBlocks = notesText.split('====').map(block => block.trim()).filter(block => block);
    
    console.log('Parsing notes, found blocks:', noteBlocks.length);
    
    noteBlocks.forEach((block, blockIndex) => {
        console.log(`Processing block ${blockIndex}:`, block);
        
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length === 0) return;
        
        const note = {
            title: '',
            pronunciation: '',
            definition: '',
            examples: []
        };
        
        // First line is always the title
        note.title = lines[0];
        
        // Process remaining lines
        let definitionSet = false;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for pronunciation link
            if (line.includes('🔊') || line.includes('🗣') || line.includes('🔤') || 
                line.toLowerCase().includes('pronunciation:')) {
                const match = line.match(/https?:\/\/[^\s]+/);
                if (match) {
                    note.pronunciation = match[0];
                }
                continue;
            }
            
            // If this is the first content line after title, it's the definition
            if (!definitionSet) {
                note.definition = line;
                definitionSet = true;
            }
            // Everything else is examples
            else {
                note.examples.push(line);
            }
        }
        
        console.log('Adding note:', note);
        notes.push(note);
    });
    
    console.log('Total notes parsed:', notes.length);
    return notes;
}

// ============================================================================
// DELETE SESSION
// ============================================================================

async function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    const deleted = await deleteSessionFromFirebase(sessionId);
    
    if (deleted) {
        sessions = sessions.filter(s => s.id !== sessionId);
        closeAdmin();
        openAdmin();
    } else {
        alert('Error deleting session. Please try again.');
    }
}

// ============================================================================
// SUCCESS MESSAGE
// ============================================================================

function showSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bg-secondary);
        border: 3px solid var(--border-gold);
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        z-index: 3000;
        box-shadow: 0 8px 32px var(--shadow-medium);
        text-align: center;
    `;
    
    message.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 16px;">✅</div>
        <h3 style="color: var(--text-primary); margin-bottom: 12px; font-size: 1.5rem;">Session Saved!</h3>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Your session is now live and visible to all students instantly!</p>
        <button onclick="
            this.parentElement.parentElement.remove();
            document.getElementById('adminPanel')?.remove();
            document.querySelectorAll('.session-detail').forEach(el => el.remove());
            const backdrop = document.querySelector('.password-modal');
            if (backdrop) backdrop.remove();
            const container = document.getElementById('sessionsContainer');
            if (container) {
                container.style.display = 'grid';
            }
            const searchSection = document.querySelector('.search-section');
            if (searchSection) {
                searchSection.style.display = 'block';
            }
        " style="background: var(--accent-dark); color: var(--accent-light); border: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
            Done
        </button>
    `;
    
    document.body.appendChild(message);
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 2999;
    `;
    backdrop.onclick = () => {
        backdrop.remove();
        message.remove();
        document.getElementById('adminPanel')?.remove();
        document.querySelectorAll('.session-detail').forEach(el => el.remove());
        const container = document.getElementById('sessionsContainer');
        if (container) {
            container.style.display = 'grid';
        }
        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
            searchSection.style.display = 'block';
        }
    };
    document.body.insertBefore(backdrop, message);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
