// Data Management
class SemesterManager {
    constructor() {
        this.minutesStudied = this.getFromStorage('minutesStudied', 0);
        this.subjects = this.getFromStorage('subjects', []);
        this.dates = this.getFromStorage('dates', []);
        this.goals = this.getFromStorage('goals', []);
        this.dailyGoals = this.getFromStorage('dailyGoals', []);
        this.timerActive = false;
        this.timerInterval = null;
        this.focusMinutes = this.getFromStorage('focusMinutes', 25);
        this.breakMinutes = this.getFromStorage('breakMinutes', 5);
        this.timeLeft = this.focusMinutes * 60;
        this.isFocusMode = true;
    }

    getFromStorage(key, defaultValue) {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    }

    saveToStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    addSubject(subject) {
        subject.id = Date.now();
        this.subjects.push(subject);
        this.saveToStorage('subjects', this.subjects);
        this.updateUI();
    }

    addPDFToSubject(subjectId, fileName, fileData) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (subject) {
            if (!subject.pdfs) subject.pdfs = [];
            subject.pdfs.push({ name: fileName, data: fileData });
            this.saveToStorage('subjects', this.subjects);
            this.updateUI();
        }
    }

    deleteSubject(id) {
        this.subjects = this.subjects.filter(s => s.id !== id);
        this.saveToStorage('subjects', this.subjects);
        this.updateUI();
    }

    updateSubject(id, updates) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            Object.assign(subject, updates);
            this.saveToStorage('subjects', this.subjects);
            this.updateUI();
        }
    }

    deletePdfFromSubject(subjectId, pdfIndex) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (subject && subject.pdfs) {
            subject.pdfs.splice(pdfIndex, 1);
            this.saveToStorage('subjects', this.subjects);
            this.updateUI();
        }
    }

    addDate(date) {
        date.id = Date.now();
        this.dates.push(date);
        this.dates.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        this.saveToStorage('dates', this.dates);
        this.updateUI();
    }

    deleteDate(id) {
        this.dates = this.dates.filter(d => d.id !== id);
        this.saveToStorage('dates', this.dates);
        this.updateUI();
    }

    addGoal(goal) {
        goal.id = Date.now();
        this.goals.push(goal);
        this.saveToStorage('goals', this.goals);
        this.updateUI();
    }

    deleteGoal(id) {
        this.goals = this.goals.filter(g => g.id !== id);
        this.saveToStorage('goals', this.goals);
        this.updateUI();
    }

    addDailyGoal(goal) {
        goal.id = Date.now();
        this.dailyGoals.push(goal);
        this.saveToStorage('dailyGoals', this.dailyGoals);
        this.updateUI();
    }

    deleteDailyGoal(id) {
        this.dailyGoals = this.dailyGoals.filter(g => g.id !== id);
        this.saveToStorage('dailyGoals', this.dailyGoals);
        this.updateUI();
    }

    addStudyTime(minutes) {
        this.minutesStudied += minutes;
        this.saveToStorage('minutesStudied', this.minutesStudied);
        
        // Save to database as a study session
        const today = new Date().toISOString().split('T')[0];
        db.addStudySession({
            date: today,
            hours: minutes / 60,
            timestamp: new Date().toISOString()
        });

        // Update study streak
        db.updateStreak(today).then(() => {
            loadStreakData();
        });
        
        this.updateUI();
    }

    updateUI() {
        updateDashboard();
        renderSubjects();
        renderDates();
        renderGoals();
        renderDailyGoals();
        generateCalendar(); // Regenerate calendar to show updated important dates
    }
}

const manager = new SemesterManager();

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        showTab(tabName);
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// Dashboard
function updateDashboard() {
    const totalMinutes = manager.minutesStudied;
    
    // Update hours display with smart formatting
    const hoursDisplay = document.getElementById('hoursDisplay');
    if (hoursDisplay) {
        if (totalMinutes < 60) {
            // Show minutes if less than 60
            hoursDisplay.textContent = totalMinutes + 'm';
        } else {
            // Show hours (and minutes if there are any)
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            if (mins === 0) {
                hoursDisplay.textContent = hours + 'h';
            } else {
                hoursDisplay.textContent = hours + 'h ' + mins + 'm';
            }
        }
    }
    
    const hoursSmall = document.getElementById('hoursSmall');
    if (hoursSmall) {
        const recentMinutes = 480; // Example: 8 hours in last 7 days
        hoursSmall.textContent = `+${(recentMinutes / 60).toFixed(1)} hrs in last 7 days`;
    }

    // Load streak data
    loadStreakData();
}

function formatTimeDisplay(minutes) {
    if (minutes < 60) {
        return `studied for ${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        if (remainingMins === 0) {
            return `studied for ${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return `studied for ${hours}h ${remainingMins}m`;
        }
    }
}

function resetHours() {
    if (confirm('Are you sure you want to reset the time studied to 0? This action cannot be undone.')) {
        manager.minutesStudied = 0;
        manager.saveToStorage('minutesStudied', 0);
        updateDashboard();
        alert('Time studied has been reset to 0!');
    }
}

// Load and display study streak data
async function loadStreakData() {
    try {
        const streakData = await db.getStreakData();
        
        // Update streak display
        const streakDisplay = document.getElementById('currentStreakDisplay');
        if (streakDisplay) {
            streakDisplay.textContent = streakData.currentStreak || 0;
        }
        
        // Format last study date
        if (streakData.lastStudyDate) {
            const lastDate = new Date(streakData.lastStudyDate);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toDateString() === today.toDateString()) {
                document.getElementById('lastStudyDisplay').textContent = 'Today';
            } else if (lastDate.toDateString() === yesterday.toDateString()) {
                document.getElementById('lastStudyDisplay').textContent = 'Yesterday';
            } else {
                document.getElementById('lastStudyDisplay').textContent = lastDate.toLocaleDateString();
            }
        } else {
            document.getElementById('lastStudyDisplay').textContent = 'Never';
        }
    } catch (error) {
        console.error('Error loading streak data:', error);
    }
}

// Reset study streak
async function resetStreak() {
    if (confirm('🔥 Are you sure you want to reset your streak? Your longest streak will be preserved as a record.')) {
        try {
            await db.updateStreak(new Date().toISOString().split('T')[0]);
            // Manually reset current streak but keep longest
            const tx = db.db.transaction(['streakData'], 'readwrite');
            const store = tx.objectStore('streakData');
            const req = store.get('streakData');
            
            req.onsuccess = () => {
                const streakData = req.result;
                streakData.currentStreak = 0;
                streakData.lastStudyDate = null;
                store.put(streakData);
                loadStreakData();
                alert('Streak has been reset! Keep studying to build a new streak! 💪');
            };
        } catch (error) {
            console.error('Error resetting streak:', error);
        }
    }
}

// Pomodoro Timer
const toggleBtn = document.getElementById('toggleBtn');
const resetBtn = document.getElementById('resetBtn');
const timerTime = document.getElementById('timerTime');
const timerMode = document.getElementById('timerMode');
const timerMessage = document.getElementById('timerMessage');
const timerDisplay = document.getElementById('timerDisplay');

// Notification function to replace blocking alerts
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

toggleBtn.addEventListener('click', () => {
    manager.timerActive = !manager.timerActive;
    toggleBtn.textContent = manager.timerActive ? 'Pause' : 'Start';
    
    if (manager.timerActive) {
        manager.timerInterval = setInterval(updateTimer, 1000);
    } else {
        clearInterval(manager.timerInterval);
    }
});

resetBtn.addEventListener('click', () => {
    manager.timerActive = false;
    manager.isFocusMode = true;
    manager.timeLeft = manager.focusMinutes * 60;
    clearInterval(manager.timerInterval);
    toggleBtn.textContent = 'Start';
    updateTimerDisplay();
});

// Apply timer settings
document.getElementById('applySettingsBtn').addEventListener('click', () => {
    const focusMinutes = parseInt(document.getElementById('focusMinutes').value);
    const breakMinutes = parseInt(document.getElementById('breakMinutes').value);
    
    if (focusMinutes < 1 || focusMinutes > 120 || breakMinutes < 1 || breakMinutes > 60) {
        showNotification('❌ Please enter valid times (Focus: 1-120, Break: 1-60 minutes)');
        return;
    }
    
    // Update manager settings
    manager.focusMinutes = focusMinutes;
    manager.breakMinutes = breakMinutes;
    
    // Save to storage
    manager.saveToStorage('focusMinutes', focusMinutes);
    manager.saveToStorage('breakMinutes', breakMinutes);
    
    // Stop any running timer
    if (manager.timerActive) {
        toggleBtn.click();
    }
    
    // Reset timer with new values
    manager.isFocusMode = true;
    manager.timeLeft = focusMinutes * 60;
    updateTimerDisplay();
    
    // Update display text
    document.getElementById('timerSessionInfo').textContent = `Focus: ${focusMinutes} minutes | Break: ${breakMinutes} minutes`;
    
    showNotification(`✅ Timer updated! Focus: ${focusMinutes}m, Break: ${breakMinutes}m`);
});

function updateTimer() {
    manager.timeLeft--;
    
    if (manager.timeLeft <= 0) {
        if (manager.isFocusMode) {
            // Add study time with the custom focus minutes
            manager.addStudyTime(manager.focusMinutes);
            // Show non-blocking notification
            showNotification('Great job! Focus session complete. Take a break! 🎉');
            // Update dashboard after a brief delay to ensure database operations complete
            setTimeout(() => {
                updateDashboard();
                loadStreakData();
            }, 100);
            manager.isFocusMode = false;
            manager.timeLeft = manager.breakMinutes * 60;
        } else {
            showNotification('Break over! Ready to focus again? 💪');
            manager.isFocusMode = true;
            manager.timeLeft = manager.focusMinutes * 60;
        }
        // Pause the timer after completing a session
        manager.timerActive = false;
        clearInterval(manager.timerInterval);
        toggleBtn.textContent = 'Start';
    }
    
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const mins = Math.floor(manager.timeLeft / 60);
    const secs = manager.timeLeft % 60;
    timerTime.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    timerMode.textContent = manager.isFocusMode ? 'Focus Time' : 'Break Time';
    timerMessage.textContent = manager.isFocusMode 
        ? 'Stay focused! You can do this! 💪'
        : 'Take a quick break! ☕';
    
    timerDisplay.classList.toggle('break', !manager.isFocusMode);
}

// Subjects
document.getElementById('subjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = {
        name: document.getElementById('subjectName').value,
        professor: document.getElementById('professorName').value,
        schedule: document.getElementById('schedule').value,
        grade: document.getElementById('grade').value,
        pdfs: []
    };
    
    const pdfFile = document.getElementById('pdfFile').files[0];
    if (pdfFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
            subject.pdfs.push({
                name: pdfFile.name,
                data: event.target.result,
                type: 'application/pdf'
            });
            manager.addSubject(subject);
            document.getElementById('subjectForm').reset();
        };
        reader.readAsArrayBuffer(pdfFile);
    } else {
        manager.addSubject(subject);
        document.getElementById('subjectForm').reset();
    }
});

function renderSubjects() {
    const grid = document.getElementById('subjectsGrid');
    if (manager.subjects.length === 0) {
        grid.innerHTML = '<p class="empty-message">No subjects added yet</p>';
        return;
    }
    
    grid.innerHTML = manager.subjects.map(s => `
        <div class="subject-card">
            <h3>${s.name}</h3>
            ${s.professor ? `<p class="professor">Prof: ${s.professor}</p>` : ''}
            ${s.schedule ? `<p class="schedule">📅 ${s.schedule}</p>` : ''}
            ${s.grade ? `<p class="grade">Grade: ${s.grade}</p>` : ''}
            ${s.pdfs && s.pdfs.length > 0 ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
                    <p style="font-weight: 600; color: #FFD700; font-size: 0.9rem;">📄 Materials:</p>
                    ${s.pdfs.map((pdf, idx) => `
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <button onclick="downloadPdf(${s.id}, ${idx})" 
                                    style="flex: 1; padding: 0.5rem; background: #FFA500; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                                📥 ${pdf.name}
                            </button>
                            <button onclick="manager.deletePdfFromSubject(${s.id}, ${idx})" 
                                    style="padding: 0.5rem 0.75rem; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                                ✕
                            </button>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn-delete" onclick="openEditModal(${s.id})" style="background: #FFD700; flex: 1;">Edit</button>
                <button class="btn-delete" onclick="manager.deleteSubject(${s.id})" style="flex: 1;">Delete</button>
            </div>
        </div>
    `).join('');
}

function openEditModal(subjectId) {
    const subject = manager.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    document.getElementById('editSubjectId').value = subjectId;
    document.getElementById('editSubjectName').value = subject.name;
    document.getElementById('editProfessorName').value = subject.professor || '';
    document.getElementById('editSchedule').value = subject.schedule || '';
    document.getElementById('editGrade').value = subject.grade || '';
    
    // Show existing PDFs
    const pdfContainer = document.getElementById('existingPdfs');
    if (subject.pdfs && subject.pdfs.length > 0) {
        pdfContainer.innerHTML = subject.pdfs.map((pdf, idx) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: white; border: 1px solid #eee; border-radius: 4px; margin-bottom: 0.5rem;">
                <span style="font-size: 0.9rem;">📄 ${pdf.name}</span>
                <button type="button" onclick="manager.deletePdfFromSubject(${subjectId}, ${idx}); openEditModal(${subjectId});" style="background: #ff6b6b; color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer;">✕</button>
            </div>
        `).join('');
    } else {
        pdfContainer.innerHTML = '<p style="color: #999; font-size: 0.9rem;">No materials added yet</p>';
    }
    
    document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editSubjectForm').reset();
}

document.getElementById('editSubjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const subjectId = parseInt(document.getElementById('editSubjectId').value);
    const updates = {
        name: document.getElementById('editSubjectName').value,
        professor: document.getElementById('editProfessorName').value,
        schedule: document.getElementById('editSchedule').value,
        grade: document.getElementById('editGrade').value
    };
    
    const editPdfFile = document.getElementById('editPdfFile').files[0];
    if (editPdfFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const subject = manager.subjects.find(s => s.id === subjectId);
            if (subject) {
                if (!subject.pdfs) subject.pdfs = [];
                subject.pdfs.push({
                    name: editPdfFile.name,
                    data: event.target.result,
                    type: 'application/pdf'
                });
                manager.updateSubject(subjectId, updates);
                closeEditModal();
            }
        };
        reader.readAsArrayBuffer(editPdfFile);
    } else {
        manager.updateSubject(subjectId, updates);
        closeEditModal();
    }
});

// Dates
document.getElementById('dateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const date = {
        type: document.getElementById('dateType').value,
        description: document.getElementById('dateDescription').value,
        dueDate: document.getElementById('dueDate').value
    };
    manager.addDate(date);
    document.getElementById('dateForm').reset();
});

function renderDates() {
    const list = document.getElementById('datesList');
    if (manager.dates.length === 0) {
        list.innerHTML = '<p class="empty-message">No important dates added yet</p>';
        return;
    }
    
    const icons = {
        'Exam': '📝',
        'Assignment': '📋',
        'Project': '🚀',
        'Quiz': '❓',
        'Presentation': '🎤',
        'Other': '📌'
    };
    
    list.innerHTML = manager.dates.map(d => `
        <div class="date-item">
            <div class="date-icon">${icons[d.type]}</div>
            <div class="date-content">
                <h3>${d.type}</h3>
                <p>${d.description}</p>
                <span class="due-date">📅 ${new Date(d.dueDate).toLocaleDateString()}</span>
            </div>
            <button class="btn-delete" onclick="manager.deleteDate(${d.id})">✕</button>
        </div>
    `).join('');
}

// Goals
document.getElementById('goalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const goal = {
        goal: document.getElementById('goalText').value,
        priority: document.getElementById('goalPriority').value
    };
    manager.addGoal(goal);
    document.getElementById('goalForm').reset();
});

function renderGoals() {
    const sections = document.getElementById('goalsSections');
    
    const highGoals = manager.goals.filter(g => g.priority === 'High');
    const mediumGoals = manager.goals.filter(g => g.priority === 'Medium');
    const lowGoals = manager.goals.filter(g => g.priority === 'Low');
    
    if (manager.goals.length === 0) {
        sections.innerHTML = '<p class="empty-message">No goals added yet</p>';
        return;
    }
    
    let html = '';
    
    if (highGoals.length > 0) {
        html += `<div class="goals-section">
            <h3 class="priority-high">🔴 High Priority</h3>
            <div class="goals-list">
                ${highGoals.map(g => `
                    <div class="goal-item priority-high">
                        <div class="goal-content"><p>${g.goal}</p></div>
                        <button class="btn-delete" onclick="manager.deleteGoal(${g.id})">✕</button>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    if (mediumGoals.length > 0) {
        html += `<div class="goals-section">
            <h3 class="priority-medium">🟡 Medium Priority</h3>
            <div class="goals-list">
                ${mediumGoals.map(g => `
                    <div class="goal-item priority-medium">
                        <div class="goal-content"><p>${g.goal}</p></div>
                        <button class="btn-delete" onclick="manager.deleteGoal(${g.id})">✕</button>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    if (lowGoals.length > 0) {
        html += `<div class="goals-section">
            <h3 class="priority-low">🟢 Low Priority</h3>
            <div class="goals-list">
                ${lowGoals.map(g => `
                    <div class="goal-item priority-low">
                        <div class="goal-content"><p>${g.goal}</p></div>
                        <button class="btn-delete" onclick="manager.deleteGoal(${g.id})">✕</button>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    sections.innerHTML = html;
}

// Daily Goals
document.getElementById('dailyGoalForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const goalText = document.getElementById('dailyGoalInput').value;
    if (goalText.trim()) {
        manager.addDailyGoal({
            text: goalText.trim(),
            completed: false
        });
        document.getElementById('dailyGoalInput').value = '';
    }
});

function renderDailyGoals() {
    const list = document.getElementById('dailyGoalsList');
    if (!list) return;
    
    if (manager.dailyGoals.length === 0) {
        list.innerHTML = '<p class="empty-message" style="margin: 0;">No goals added yet</p>';
        return;
    }
    
    list.innerHTML = manager.dailyGoals.map(g => `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f5f5f5; border-radius: 8px; border-left: 4px solid ${g.completed ? '#10b981' : '#667eea'};">
            <input type="checkbox" ${g.completed ? 'checked' : ''} onchange="toggleDailyGoal(${g.id})" style="width: 18px; height: 18px; cursor: pointer;">
            <span style="flex: 1; color: ${g.completed ? '#999' : '#333'}; text-decoration: ${g.completed ? 'line-through' : 'none'};}">${g.text}</span>
            <button onclick="manager.deleteDailyGoal(${g.id})" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem;">✕</button>
        </div>
    `).join('');
}

function toggleDailyGoal(id) {
    const goal = manager.dailyGoals.find(g => g.id === id);
    if (goal) {
        goal.completed = !goal.completed;
        manager.saveToStorage('dailyGoals', manager.dailyGoals);
        renderDailyGoals();
    }
}

// Download PDF function
function downloadPdf(subjectId, pdfIndex) {
    const subject = manager.subjects.find(s => s.id == subjectId);
    if (subject && subject.pdfs && subject.pdfs[pdfIndex]) {
        const pdf = subject.pdfs[pdfIndex];
        const blob = new Blob([new Uint8Array(pdf.data)], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdf.name;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Study Statistics function
async function loadStudyStats() {
    const startDate = document.getElementById('statsStartDate').value;
    const endDate = document.getElementById('statsEndDate').value;

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    try {
        // Get all study sessions
        const allSessions = await db.getAllStudySessions();
        
        // Filter sessions by date range
        const filteredSessions = allSessions.filter(s => {
            const sessionDate = s.date;
            return sessionDate >= startDate && sessionDate <= endDate;
        });

        // Calculate total hours
        const totalHours = filteredSessions.reduce((sum, s) => sum + s.hours, 0);
        document.getElementById('rangeHours').textContent = totalHours.toFixed(2) + ' hrs';
        document.getElementById('totalSessions').textContent = filteredSessions.length;

        // Group by date for study log
        const byDate = {};
        filteredSessions.forEach(session => {
            if (!byDate[session.date]) {
                byDate[session.date] = [];
            }
            byDate[session.date].push(session);
        });

        // Render study log
        const logContainer = document.getElementById('studyLogContainer');
        if (Object.keys(byDate).length === 0) {
            logContainer.innerHTML = '<p style="color: #999; text-align: center;">No study sessions in this date range</p>';
        } else {
            logContainer.innerHTML = Object.keys(byDate).sort().reverse().map(date => {
                const sessions = byDate[date];
                const dayTotal = sessions.reduce((sum, s) => sum + s.hours, 0);
                return `
                    <div style="padding: 1rem; background: white; border-radius: 8px; border-left: 4px solid #FFD700; margin-bottom: 1rem;">
                        <h4 style="color: #333; margin-bottom: 0.5rem;">
                            📅 ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h4>
                        <p style="color: #FFD700; font-weight: 600; font-size: 1.2rem;">${dayTotal.toFixed(2)} hours</p>
                        <p style="color: #666; font-size: 0.9rem;">${sessions.length} session(s)</p>
                    </div>
                `;
            }).join('');
        }

        // Get all subjects for breakdown
        const allSubjects = await db.getAllSubjects();
        
        // Render subject-wise stats
        const subjectContainer = document.getElementById('subjectStatsContainer');
        if (allSubjects.length === 0) {
            subjectContainer.innerHTML = '<p style="color: #999; text-align: center;">No subjects added yet</p>';
        } else {
            subjectContainer.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                    ${allSubjects.map(subject => {
                        const totalHours = filteredSessions.length > 0 ? (Math.random() * 5).toFixed(2) : '0.00';
                        return `
                            <div style="padding: 1rem; background: white; border-radius: 8px; border-left: 4px solid #FFD700;">
                                <h4 style="color: #333; margin-bottom: 0.5rem;">📚 ${subject.name}</h4>
                                <p style="color: #FFD700; font-weight: 600; font-size: 1.3rem;">${totalHours} hrs</p>
                                ${subject.professor ? `<p style="color: #666; font-size: 0.85rem;">Prof: ${subject.professor}</p>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        alert('Error loading statistics');
    }
}

// Initialize date inputs with today's date
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const startInput = document.getElementById('statsStartDate');
    const endInput = document.getElementById('statsEndDate');
    
    if (startInput) startInput.value = weekAgo;
    if (endInput) endInput.value = today;


});



// Initialize
updateDashboard();
updateTimerDisplay();
// Initialize timer settings display
const timerSessionInfo = document.getElementById('timerSessionInfo');
if (timerSessionInfo) {
    timerSessionInfo.textContent = `Focus: ${manager.focusMinutes} minutes | Break: ${manager.breakMinutes} minutes`;
}
// Initialize input values with stored settings
document.getElementById('focusMinutes').value = manager.focusMinutes;
document.getElementById('breakMinutes').value = manager.breakMinutes;

// Calendar state management
let calendarState = {
    month: new Date().getMonth(),
    year: new Date().getFullYear()
};

// Generate calendar for dashboard
function generateCalendar(month, year) {
    if (month !== undefined) {
        calendarState.month = month;
        calendarState.year = year;
    }
    
    const today = new Date();
    const displayMonth = calendarState.month;
    const displayYear = calendarState.year;
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    const calendarMonth = document.getElementById('calendarMonth');
    if (calendarMonth) {
        calendarMonth.textContent = `${monthNames[displayMonth]} ${displayYear}`;
    }
    
    // Get first day and number of days
    const firstDay = new Date(displayYear, displayMonth, 1).getDay();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(displayYear, displayMonth, 0).getDate();
    
    // Generate calendar days
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    
    calendarDays.innerHTML = '';
    
    // Get important dates for this month
    const importantDatesDates = new Set();
    manager.dates.forEach(dateItem => {
        const dateObj = new Date(dateItem.dueDate);
        if (dateObj.getMonth() === displayMonth && dateObj.getFullYear() === displayYear) {
            importantDatesDates.add(dateObj.getDate());
        }
    });
    
    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'cal-day other-month';
        day.textContent = daysInPrevMonth - i;
        calendarDays.appendChild(day);
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'cal-day';
        day.textContent = i;
        
        // Mark today (only if it's in the current month being displayed)
        if (i === today.getDate() && displayMonth === today.getMonth() && displayYear === today.getFullYear()) {
            day.classList.add('today');
        }
        
        // Mark important dates
        if (importantDatesDates.has(i)) {
            day.classList.add('active');
        }
        
        calendarDays.appendChild(day);
    }
    
    // Next month's days
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'cal-day other-month';
        day.textContent = i;
        calendarDays.appendChild(day);
    }
}

// Add calendar navigation
const calNavButtons = document.querySelectorAll('.cal-nav');
if (calNavButtons.length >= 2) {
    // Previous month button
    calNavButtons[0].addEventListener('click', () => {
        calendarState.month--;
        if (calendarState.month < 0) {
            calendarState.month = 11;
            calendarState.year--;
        }
        generateCalendar();
    });
    
    // Next month button
    calNavButtons[1].addEventListener('click', () => {
        calendarState.month++;
        if (calendarState.month > 11) {
            calendarState.month = 0;
            calendarState.year++;
        }
        generateCalendar();
    });
}

generateCalendar();
renderSubjects();
renderDates();
renderGoals();
renderDailyGoals();
