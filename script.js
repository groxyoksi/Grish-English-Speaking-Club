// Data structure and state management
let sessions = [];
let currentSessionId = null;

// Admin password (change this to your own password)
const ADMIN_PASSWORD = "gagagrigri25"; // Change this password!

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    displaySessions();
});

// Load data from localStorage or initialize empty
function loadData() {
    const storedSessions = localStorage.getItem('eslSessions');
    const storedComments = localStorage.getItem('eslComments');
    
    if (storedSessions) {
        sessions = JSON.parse(storedSessions);
    }
    
    // Sort sessions by date (newest first)
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Save sessions to localStorage
function saveData() {
    localStorage.setItem('eslSessions', JSON.stringify(sessions));
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
    currentSessionId = sessionId;
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) return;
    
    // Hide main page
    document.getElementById('sessionsContainer').style.display = 'none';
    
    // Create session detail view
    const detailView = createSessionDetailView(session);
    document.querySelector('.container main').appendChild(detailView);
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
        
        <div class="content-sections">
            <div class="content-box">
                <h3>📝 Notes</h3>
                <div class="content-box-content">
                    ${renderNotes(session.notes || [])}
                </div>
                ${renderCommentsSection(session.id, 'notes')}
            </div>
            
            <div class="content-box">
                <h3>✏️ Exercises</h3>
                <div class="content-box-content">
                    ${renderExercises(session.exercises || [])}
                </div>
                ${renderCommentsSection(session.id, 'exercises')}
            </div>
            
            <div class="content-box">
                <h3>🔗 Links</h3>
                <div class="content-box-content">
                    ${renderLinks(session.links || [])}
                </div>
                ${renderCommentsSection(session.id, 'links')}
            </div>
        </div>
    `;
    
    // Setup exercise interactions after rendering
    setTimeout(() => setupExerciseInteractions(session.id), 0);
    
    return detail;
}

// Render notes
function renderNotes(notes) {
    if (notes.length === 0) {
        return '<p style="color: #777;">No notes for this session yet.</p>';
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
                html += `<div class="note-example">• ${escapeHtml(example)}</div>`;
            });
        }
        
        html += '</div>';
        return html;
    }).join('');
}

// Render exercises
function renderExercises(exercises) {
    if (exercises.length === 0) {
        return '<p style="color: #777;">No exercises for this session yet.</p>';
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
            html += `<div style="color: #ccc;">${escapeHtml(exercise.instructions)}</div>`;
        }
        
        html += '</div>';
        return html;
    }).join('');
}

// Render links
function renderLinks(links) {
    if (links.length === 0) {
        return '<p style="color: #777;">No links for this session yet.</p>';
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
        return '<p style="color: #777;">No comments yet. Be the first to comment!</p>';
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
        input.style.borderColor = '#00ff00';
    } else {
        feedback.textContent = `✗ Incorrect. The answer is: ${input.dataset.answer}`;
        feedback.className = 'exercise-feedback incorrect';
        input.style.borderColor = '#ff6666';
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
    document.querySelector('.session-detail').remove();
    document.getElementById('sessionsContainer').style.display = 'grid';
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
            
            <div class="admin-actions">
                <button class="export-btn" onclick="exportData()">Export Data (JSON)</button>
                <button class="import-btn" onclick="document.getElementById('importFile').click()">Import Data</button>
                <input type="file" id="importFile" style="display: none" accept=".json" onchange="importData(event)">
            </div>
            
            <h3 style="color: #ffed00; margin-top: 30px; margin-bottom: 20px;">Add New Session</h3>
            
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
                
                <button type="submit" class="save-session-btn">Save Session</button>
            </form>
            
            <div class="sessions-list">
                <h3 style="color: #ffed00; margin-bottom: 20px;">Existing Sessions</h3>
                ${renderSessionsList()}
            </div>
        </div>
    `;
    
    return panel;
}

// Render list of existing sessions in admin
function renderSessionsList() {
    if (sessions.length === 0) {
        return '<p style="color: #777;">No sessions yet.</p>';
    }
    
    return sessions.map(session => `
        <div class="session-list-item">
            <div>
                <h4>${formatDate(session.date)}</h4>
                <p style="color: #ccc;">${session.notes?.length || 0} notes • ${session.exercises?.length || 0} exercises • ${session.links?.length || 0} links</p>
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
            <small style="color: #ffed00;">Example: Option 1
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
function saveNewSession(event) {
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
    saveData();
    
    alert('Session saved successfully!');
    closeAdmin();
    displaySessions();
}

// Delete session
function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    sessions = sessions.filter(s => s.id !== sessionId);
    saveData();
    
    // Refresh admin panel
    closeAdmin();
    openAdmin();
}

// Close admin panel
function closeAdmin() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.remove();
}

// Export data as JSON
function exportData() {
    const dataStr = JSON.stringify({ sessions, comments: JSON.parse(localStorage.getItem('eslComments') || '{}') }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `esl-club-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Import data from JSON
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.sessions) {
                sessions = data.sessions;
                saveData();
            }
            
            if (data.comments) {
                localStorage.setItem('eslComments', JSON.stringify(data.comments));
            }
            
            alert('Data imported successfully!');
            closeAdmin();
            displaySessions();
        } catch (error) {
            alert('Error importing data. Please check the file format.');
            console.error(error);
        }
    };
    reader.readAsText(file);
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
