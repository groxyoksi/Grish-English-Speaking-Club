// Data structure and state management
let sessions = [];
let currentSessionId = null;
let firebaseReady = false;

// Admin password (change this to your own password)
const ADMIN_PASSWORD = "esl2025"; // Change this password!

// Wait for Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebaseDB) {
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
    setupEventListeners();
    loadSessions();
});

// Load sessions from Firebase
async function loadSessions() {
    try {
        const sessionsRef = window.firebaseRef(window.firebaseDB, 'sessions');
        
        // Listen for real-time updates
        window.firebaseOnValue(sessionsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                sessions = Object.values(data);
            } else {
                sessions = [];
            }
            
            // Sort sessions by date (newest first)
            sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
            displaySessions();
        });
    } catch (error) {
        console.error('Error loading sessions:', error);
        displaySessions(); // Show empty state
    }
}

// Save all sessions to Firebase
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

// Delete a session from Firebase
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

// Setup event listeners
function setupEventListeners() {
    document.getElementById('adminBtn').addEventListener('click', () => {
        showPasswordModal();
    });
}

// Display all sessions on the main page
function displaySessions() {
    const container = document.getElementById('sessionsContainer');
    
    // Clear any existing session detail view
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
    
    // Add click listeners to session boxes
    document.querySelectorAll('.session-box').forEach(box => {
        box.addEventListener('click', function() {
            const sessionId = this.getAttribute('data-session-id');
            openSession(sessionId);
        });
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Open a specific session
function openSession(sessionId) {
    console.log('Opening session:', sessionId);
    currentSessionId = sessionId;
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        console.error('Session not found:', sessionId);
        return;
    }
    
    console.log('Session data:', session);
    
    // Remove any existing detail views first
    document.querySelectorAll('.session-detail').forEach(el => el.remove());
    
    // Hide main page
    const container = document.getElementById('sessionsContainer');
    container.style.display = 'none';
    
    // Create session detail view
    try {
        const detailView = createSessionDetailView(session);
        document.querySelector('.container').appendChild(detailView);
        console.log('Detail view created successfully');
    } catch (error) {
        console.error('Error creating detail view:', error);
        // Show main page again if there's an error
        container.style.display = 'grid';
    }
}

// Create session detail view
function createSessionDetailView(session) {
    const detail = document.createElement('div');
    detail.className = 'session-detail active';
    detail.innerHTML = `
        <button class="back-btn" onclick="closeSession()">← Back to Sessions</button>
        
        <div class="session-header">
            <h2>${formatDate(session.date)}</h2>
        </div>
        
        <div class="tab-navigation">
            <button class="tab-btn active" onclick="switchTab('notes')" id="tab-notes">
                <span class="tab-btn-icon">📝</span>
                Notes
            </button>
            <button class="tab-btn" onclick="switchTab('exercises')" id="tab-exercises">
                <span class="tab-btn-icon">✏️</span>
                Exercises
            </button>
            <button class="tab-btn" onclick="switchTab('links')" id="tab-links">
                <span class="tab-btn-icon">🔗</span>
                Links
            </button>
        </div>
        
        <div class="content-sections">
            <div class="tab-content active" id="content-notes">
                <div class="content-box">
                    <h3>📝 Notes</h3>
                    <div class="content-box-content">
                        ${renderNotes(session.notes || [])}
                    </div>
                    ${renderCommentsSection(session.id, 'notes')}
                </div>
            </div>
            
            <div class="tab-content" id="content-exercises">
                <div class="content-box">
                    <h3>✏️ Exercises</h3>
                    <div class="content-box-content">
                        ${renderExercises(session.exercises || [])}
                    </div>
                    ${renderCommentsSection(session.id, 'exercises')}
                </div>
            </div>
            
            <div class="tab-content" id="content-links">
                <div class="content-box">
                    <h3>🔗 Links</h3>
                    <div class="content-box-content">
                        ${renderLinks(session.links || [])}
                    </div>
                    ${renderCommentsSection(session.id, 'links')}
                </div>
            </div>
        </div>
    `;
    
    // Setup exercise interactions after rendering
    setTimeout(() => setupExerciseInteractions(session.id), 0);
    
    return detail;
}

// Switch between tabs
function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`content-${tabName}`).classList.add('active');
}

// Render notes
function renderNotes(notes) {
    if (notes.length === 0) {
        return '<p style="color: #999;">No notes for this session yet.</p>';
    }
    
    return notes.map(note => {
        let html = '<div class="note-item">';
        
        if (note.title) {
            html += `<div class="note-title">${escapeHtml(note.title)}</div>`;
        }
        
        if (note.pronunciation) {
            html += `<div class="note-pronunciation">🔊 Pronunciation: <a href="${escapeHtml(note.pronunciation)}" target="_blank">Listen</a></div>`;
        }
        
        if (note.definition) {
            html += `<div class="note-definition">${escapeHtml(note.definition)}</div>`;
        }
        
        if (note.examples && note.examples.length > 0) {
            note.examples.forEach(example => {
                html += `<div class="note-example">${escapeHtml(example)}</div>`;
            });
        }
        
        html += '</div>';
        return html;
    }).join('');
}

// Render exercises
function renderExercises(exercises) {
    if (exercises.length === 0) {
        return '<p style="color: #999;">No exercises for this session yet.</p>';
    }
    
    return exercises.map((exercise, index) => {
        let html = `<div class="exercise-item" data-exercise-index="${index}">`;
        html += `<div class="exercise-question">${escapeHtml(exercise.question)}</div>`;
        
        if (exercise.type === 'fill-blank') {
            html += `<input type="text" class="exercise-input" data-answer="${escapeHtml(exercise.answer)}" placeholder="Type your answer...">`;
            html += `<button class="check-btn" onclick="checkFillBlank(${index})">Check Answer</button>`;
            html += `<div class="exercise-feedback"></div>`;
        } else if (exercise.type === 'multiple-choice') {
            html += '<div class="exercise-options">';
            exercise.options.forEach((option, optIndex) => {
                html += `<div class="exercise-option" data-option-index="${optIndex}" onclick="selectOption(${index}, ${optIndex})">${escapeHtml(option)}</div>`;
            });
            html += '</div>';
            html += `<button class="check-btn" onclick="checkMultipleChoice(${index}, ${exercise.correctIndex})">Check Answer</button>`;
            html += `<div class="exercise-feedback"></div>`;
        } else if (exercise.type === 'text') {
            html += `<div style="color: #555;">${escapeHtml(exercise.instructions)}</div>`;
        }
        
        html += '</div>';
        return html;
    }).join('');
}

// Render links
function renderLinks(links) {
    if (links.length === 0) {
        return '<p style="color: #999;">No links for this session yet.</p>';
    }
    
    return links.map(link => `
        <div class="link-item">
            <a href="${escapeHtml(link.url)}" target="_blank">${escapeHtml(link.title)}</a>
            <div class="link-description">${escapeHtml(link.description)}</div>
        </div>
    `).join('');
}

// Render comments section
function renderCommentsSection(sessionId, section) {
    const comments = getComments(sessionId, section);
    
    return `
        <div class="comments-section">
            <h4>💬 Comments</h4>
            <div class="comment-form">
                <input type="text" class="comment-input" placeholder="Your name" id="name-${sessionId}-${section}">
                <textarea class="comment-input comment-textarea" placeholder="Write your comment..." id="comment-${sessionId}-${section}"></textarea>
                <button class="submit-comment-btn" onclick="submitComment('${sessionId}', '${section}')">Post Comment</button>
            </div>
            <div class="comments-list" id="comments-${sessionId}-${section}">
                ${renderComments(comments)}
            </div>
        </div>
    `;
}

// Render comments
function renderComments(comments) {
    if (comments.length === 0) {
        return '<p style="color: #999;">No comments yet. Be the first to comment!</p>';
    }
    
    return comments.map(comment => `
        <div class="comment">
            <div class="comment-author">${escapeHtml(comment.author)}</div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            <div class="comment-date">${new Date(comment.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
}

// Get comments for a specific session and section
function getComments(sessionId, section) {
    const allComments = JSON.parse(localStorage.getItem('eslComments') || '{}');
    const key = `${sessionId}-${section}`;
    return allComments[key] || [];
}

// Submit a comment
function submitComment(sessionId, section) {
    const nameInput = document.getElementById(`name-${sessionId}-${section}`);
    const commentInput = document.getElementById(`comment-${sessionId}-${section}`);
    
    const name = nameInput.value.trim();
    const text = commentInput.value.trim();
    
    if (!name || !text) {
        alert('Please enter both your name and comment.');
        return;
    }
    
    const allComments = JSON.parse(localStorage.getItem('eslComments') || '{}');
    const key = `${sessionId}-${section}`;
    
    if (!allComments[key]) {
        allComments[key] = [];
    }
    
    allComments[key].push({
        author: name,
        text: text,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('eslComments', JSON.stringify(allComments));
    
    // Clear inputs
    nameInput.value = '';
    commentInput.value = '';
    
    // Refresh comments display
    document.getElementById(`comments-${sessionId}-${section}`).innerHTML = renderComments(allComments[key]);
}

// Setup exercise interactions
function setupExerciseInteractions(sessionId) {
    // Already handled by onclick attributes
}

// Check fill-in-blank answer
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

// Select multiple choice option
function selectOption(exerciseIndex, optionIndex) {
    const exerciseItem = document.querySelectorAll('.exercise-item')[exerciseIndex];
    const options = exerciseItem.querySelectorAll('.exercise-option');
    
    options.forEach(opt => opt.classList.remove('selected'));
    options[optionIndex].classList.add('selected');
}

// Check multiple choice answer
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

// Close session and return to main view
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
    currentSessionId = null;
}

// Show password modal
function showPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'password-modal active';
    modal.innerHTML = `
        <div class="password-content">
            <h3>🔒 Admin Access</h3>
            <input type="password" id="adminPassword" placeholder="Enter password" />
            <div class="password-btn-container">
                <button class="password-submit" onclick="checkPassword()">Enter</button>
                <button class="password-cancel" onclick="closePasswordModal()">Cancel</button>
            </div>
            <div id="passwordError" class="password-error"></div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Allow Enter key to submit
    document.getElementById('adminPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });
    
    // Focus password input
    setTimeout(() => document.getElementById('adminPassword').focus(), 100);
}

// Close password modal
function closePasswordModal() {
    const modal = document.querySelector('.password-modal');
    if (modal) modal.remove();
}

// Check password
function checkPassword() {
    const input = document.getElementById('adminPassword');
    const error = document.getElementById('passwordError');
    
    if (input.value === ADMIN_PASSWORD) {
        closePasswordModal();
        openAdmin();
    } else {
        error.textContent = 'Incorrect password. Please try again.';
        input.value = '';
        input.focus();
    }
}

// Open admin panel
function openAdmin() {
    const adminPanel = createAdminPanel();
    document.body.appendChild(adminPanel);
}

// Create admin panel
function createAdminPanel() {
    const panel = document.createElement('div');
    panel.className = 'admin-panel active';
    panel.id = 'adminPanel';
    
    panel.innerHTML = `
        <div class="admin-content">
            <div class="admin-header">
                <h2>Admin Panel</h2>
                <button class="close-admin-btn" onclick="closeAdmin()">Close</button>
            </div>
            
            <div style="background: #fffcf0; border: 2px solid #d4af37; border-radius: 12px; padding: 16px; margin-bottom: 30px;">
                <h4 style="color: #1a1a1a; margin-bottom: 8px;">✨ Firebase Connected!</h4>
                <p style="color: #666; margin: 0;">Sessions are saved instantly to the cloud. Students see updates in real-time!</p>
            </div>
            
            <h3 style="color: #1a1a1a; margin-top: 30px; margin-bottom: 20px;">Add New Session</h3>
            
            <form class="admin-form" onsubmit="saveNewSession(event)">
                <div class="form-group">
                    <label>Date (Saturday)</label>
                    <input type="date" id="sessionDate" required>
                </div>
                
                <div class="form-group">
                    <label>Notes (Paste all notes at once)</label>
                    <div class="parse-info">
                        Paste your notes in this format:<br>
                        <code>WORD /pronunciation/<br>
                        🔊 Pronunciation: https://link.com<br>
                        ====<br>
                        definition<br>
                        ====<br>
                        Example 1<br>
                        Example 2</code>
                        <br><br>
                        Separate each note with a blank line.
                    </div>
                    <textarea id="notesText" placeholder="Paste all your notes here..." style="min-height: 300px;"></textarea>
                    <p class="helper-text">The parser will automatically extract title, pronunciation, definition, and examples</p>
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
                <h3 style="color: #1a1a1a; margin-bottom: 20px;">Existing Sessions</h3>
                ${renderSessionsList()}
            </div>
        </div>
    `;
    
    return panel;
}

// Render list of existing sessions in admin
function renderSessionsList() {
    if (sessions.length === 0) {
        return '<p style="color: #999;">No sessions yet.</p>';
    }
    
    return sessions.map(session => `
        <div class="session-list-item">
            <div>
                <h4>${formatDate(session.date)}</h4>
                <p style="color: #666;">${session.notes?.length || 0} notes • ${session.exercises?.length || 0} exercises • ${session.links?.length || 0} links</p>
            </div>
            <button class="delete-session-btn" onclick="deleteSession('${session.id}')">Delete</button>
        </div>
    `).join('');
}

// Parse bulk notes text into structured notes array
function parseNotes(notesText) {
    if (!notesText || !notesText.trim()) return [];
    
    const notes = [];
    // Split by double line breaks to separate notes
    const noteBlocks = notesText.split(/\n\s*\n/).filter(block => block.trim());
    
    noteBlocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length === 0) return;
        
        const note = {
            title: '',
            pronunciation: '',
            definition: '',
            examples: []
        };
        
        let currentSection = 'title';
        let definitionStarted = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if it's the title line
            if (i === 0) {
                note.title = line;
                continue;
            }
            
            // Check for pronunciation link
            if (line.includes('🔊 Pronunciation:') || line.includes('Pronunciation:')) {
                const match = line.match(/https?:\/\/[^\s]+/);
                if (match) {
                    note.pronunciation = match[0];
                }
                continue;
            }
            
            // Check for separator
            if (line === '====' || line === '====') {
                if (!definitionStarted) {
                    currentSection = 'definition';
                    definitionStarted = true;
                } else {
                    currentSection = 'examples';
                }
                continue;
            }
            
            // Add content to appropriate section
            if (currentSection === 'definition') {
                note.definition += (note.definition ? ' ' : '') + line;
            } else if (currentSection === 'examples' || (definitionStarted && currentSection !== 'definition')) {
                note.examples.push(line);
            } else if (currentSection === 'title' && i > 0) {
                // If no separator found, treat remaining as examples
                note.examples.push(line);
            }
        }
        
        if (note.title) {
            notes.push(note);
        }
    });
    
    return notes;
}

// Add exercise fields
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
        <button type="button" class="remove-item-btn" onclick="document.getElementById('${exerciseId}').remove()">Remove Exercise</button>
    `;
    
    container.appendChild(exerciseDiv);
}

// Update exercise fields based on type
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

// Add link fields
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

// Save new session
async function saveNewSession(event) {
    event.preventDefault();
    
    const date = document.getElementById('sessionDate').value;
    
    // Parse notes from bulk text
    const notesText = document.getElementById('notesText').value;
    const notes = parseNotes(notesText);
    
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
    
    // Create new session
    const session = {
        id: generateId(),
        date: date,
        notes: notes,
        exercises: exercises,
        links: links
    };
    
    sessions.push(session);
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Save to Firebase
    const saved = await saveSessions();
    
    if (saved) {
        showSuccessMessage();
    }
}

// Show success message
function showSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 3px solid #d4af37;
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        z-index: 3000;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        text-align: center;
    `;
    
    message.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 16px;">✅</div>
        <h3 style="color: #1a1a1a; margin-bottom: 12px; font-size: 1.5rem;">Session Saved!</h3>
        <p style="color: #666; margin-bottom: 24px;">Your session is now live and visible to all students instantly!</p>
        <button onclick="this.parentElement.parentElement.remove(); closeAdmin(); displaySessions();" style="background: #1a1a1a; color: #f4e157; border: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
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
        closeAdmin();
        displaySessions();
    };
    document.body.insertBefore(backdrop, message);
}

// Delete session
async function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    const deleted = await deleteSessionFromFirebase(sessionId);
    
    if (deleted) {
        sessions = sessions.filter(s => s.id !== sessionId);
        
        // Refresh admin panel
        closeAdmin();
        openAdmin();
    } else {
        alert('Error deleting session. Please try again.');
    }
}

// Close admin panel
function closeAdmin() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.remove();
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
