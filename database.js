// IndexedDB Database System
class DatabaseManager {
    constructor() {
        this.dbName = 'SemesterManagerDB';
        this.version = 1;
        this.db = null;
        this.init();
    }

    init() {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
            console.error('Database failed to open');
        };

        request.onsuccess = () => {
            this.db = request.result;
            console.log('Database opened successfully');
        };

        request.onupgradeneeded = (e) => {
            const db = e.target.result;

            // Subjects store
            if (!db.objectStoreNames.contains('subjects')) {
                const subjectStore = db.createObjectStore('subjects', { keyPath: 'id' });
                subjectStore.createIndex('name', 'name', { unique: false });
            }

            // Materials store (PDFs linked to subjects)
            if (!db.objectStoreNames.contains('materials')) {
                const materialStore = db.createObjectStore('materials', { keyPath: 'id' });
                materialStore.createIndex('subjectId', 'subjectId', { unique: false });
            }

            // Study sessions (date-wise hours tracking)
            if (!db.objectStoreNames.contains('studySessions')) {
                const sessionStore = db.createObjectStore('studySessions', { keyPath: 'id' });
                sessionStore.createIndex('date', 'date', { unique: false });
                sessionStore.createIndex('subjectId', 'subjectId', { unique: false });
            }

            // Important dates
            if (!db.objectStoreNames.contains('importantDates')) {
                const dateStore = db.createObjectStore('importantDates', { keyPath: 'id' });
                dateStore.createIndex('dueDate', 'dueDate', { unique: false });
            }

            // Weekly goals
            if (!db.objectStoreNames.contains('weeklyGoals')) {
                db.createObjectStore('weeklyGoals', { keyPath: 'id' });
            }

            // Reminders settings
            if (!db.objectStoreNames.contains('reminderSettings')) {
                db.createObjectStore('reminderSettings', { keyPath: 'id' });
            }

            // Reminder log (which reminders were shown)
            if (!db.objectStoreNames.contains('reminderLog')) {
                const logStore = db.createObjectStore('reminderLog', { keyPath: 'id' });
                logStore.createIndex('dateId', 'dateId', { unique: false });
            }

            // Study streak data
            if (!db.objectStoreNames.contains('streakData')) {
                db.createObjectStore('streakData', { keyPath: 'id' });
            }
        };
    }

    // Subject operations
    addSubject(subject) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['subjects'], 'readwrite');
            const store = transaction.objectStore('subjects');
            const request = store.add(subject);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getSubject(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['subjects'], 'readonly');
            const store = transaction.objectStore('subjects');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getAllSubjects() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['subjects'], 'readonly');
            const store = transaction.objectStore('subjects');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    updateSubject(subject) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['subjects'], 'readwrite');
            const store = transaction.objectStore('subjects');
            const request = store.put(subject);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    deleteSubject(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['subjects', 'materials'], 'readwrite');
            const subjectStore = transaction.objectStore('subjects');
            const materialStore = transaction.objectStore('materials');

            subjectStore.delete(id);

            // Delete related materials
            const index = materialStore.index('subjectId');
            const range = IDBKeyRange.only(id);
            index.openCursor(range).onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    materialStore.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Material operations
    addMaterial(material) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['materials'], 'readwrite');
            const store = transaction.objectStore('materials');
            material.id = Date.now();
            const request = store.add(material);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getMaterialsBySubject(subjectId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['materials'], 'readonly');
            const store = transaction.objectStore('materials');
            const index = store.index('subjectId');
            const request = index.getAll(subjectId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    deleteMaterial(materialId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['materials'], 'readwrite');
            const store = transaction.objectStore('materials');
            const request = store.delete(materialId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Study session operations (Date-wise hours)
    addStudySession(session) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['studySessions'], 'readwrite');
            const store = transaction.objectStore('studySessions');
            session.id = Date.now();
            const request = store.add(session);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getStudySessionsByDate(date) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['studySessions'], 'readonly');
            const store = transaction.objectStore('studySessions');
            const index = store.index('date');
            const request = index.getAll(date);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getStudySessionsBySubject(subjectId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['studySessions'], 'readonly');
            const store = transaction.objectStore('studySessions');
            const index = store.index('subjectId');
            const request = index.getAll(subjectId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getAllStudySessions() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['studySessions'], 'readonly');
            const store = transaction.objectStore('studySessions');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Important dates operations
    addImportantDate(date) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['importantDates'], 'readwrite');
            const store = transaction.objectStore('importantDates');
            const request = store.add(date);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getAllImportantDates() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['importantDates'], 'readonly');
            const store = transaction.objectStore('importantDates');
            const request = store.getAll();

            request.onsuccess = () => {
                const dates = request.result.sort((a, b) => 
                    new Date(a.dueDate) - new Date(b.dueDate)
                );
                resolve(dates);
            };
            request.onerror = () => reject(request.error);
        });
    }

    deleteImportantDate(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['importantDates'], 'readwrite');
            const store = transaction.objectStore('importantDates');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Weekly goals operations
    addGoal(goal) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['weeklyGoals'], 'readwrite');
            const store = transaction.objectStore('weeklyGoals');
            const request = store.add(goal);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getAllGoals() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['weeklyGoals'], 'readonly');
            const store = transaction.objectStore('weeklyGoals');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    deleteGoal(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(['weeklyGoals'], 'readwrite');
            const store = transaction.objectStore('weeklyGoals');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Study Streak operations
    async updateStreak(lastStudyDate) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['streakData'], 'readwrite');
            const store = tx.objectStore('streakData');
            
            // Get current streak data
            const getReq = store.get('streakData');
            
            getReq.onsuccess = () => {
                let streakData = getReq.result || {
                    id: 'streakData',
                    currentStreak: 0,
                    longestStreak: 0,
                    lastStudyDate: null,
                    streakStartDate: null
                };

                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                
                if (!streakData.lastStudyDate) {
                    // First study session
                    streakData.currentStreak = 1;
                    streakData.longestStreak = 1;
                    streakData.lastStudyDate = today;
                    streakData.streakStartDate = today;
                } else if (streakData.lastStudyDate === today) {
                    // Already studied today, don't change streak
                } else if (streakData.lastStudyDate === yesterday) {
                    // Continued streak
                    streakData.currentStreak++;
                    streakData.lastStudyDate = today;
                    
                    // Update longest streak if needed
                    if (streakData.currentStreak > streakData.longestStreak) {
                        streakData.longestStreak = streakData.currentStreak;
                    }
                } else {
                    // Streak broken, restart
                    streakData.currentStreak = 1;
                    streakData.lastStudyDate = today;
                    streakData.streakStartDate = today;
                }

                const updateReq = store.put(streakData);
                updateReq.onsuccess = () => resolve(streakData);
                updateReq.onerror = () => reject(updateReq.error);
            };
            
            getReq.onerror = () => reject(getReq.error);
        });
    }

    async getStreakData() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['streakData'], 'readonly');
            const store = tx.objectStore('streakData');
            const req = store.get('streakData');
            
            req.onsuccess = () => resolve(req.result || {
                currentStreak: 0,
                longestStreak: 0,
                lastStudyDate: null,
                streakStartDate: null
            });
            req.onerror = () => reject(req.error);
        });
    }

    // Utility - Get total hours for a date range
    getTotalHoursByDateRange(startDate, endDate) {
        return new Promise((resolve, reject) => {
            this.getAllStudySessions().then(sessions => {
                const filtered = sessions.filter(s => {
                    const sessionDate = new Date(s.date);
                    return sessionDate >= new Date(startDate) && sessionDate <= new Date(endDate);
                });
                const total = filtered.reduce((sum, s) => sum + s.hours, 0);
                resolve(total);
            }).catch(reject);
        });
    }

    // Clear all data
    clearAllData() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction(
                ['subjects', 'materials', 'studySessions', 'importantDates', 'weeklyGoals', 'reminderSettings', 'reminderLog', 'streakData'],
                'readwrite'
            );

            ['subjects', 'materials', 'studySessions', 'importantDates', 'weeklyGoals', 'reminderSettings', 'reminderLog', 'streakData'].forEach(store => {
                transaction.objectStore(store).clear();
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Reminder Settings
    async setReminderSettings(settings) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['reminderSettings'], 'readwrite');
            const store = tx.objectStore('reminderSettings');
            
            const settingsData = {
                id: 'reminderPrefs',
                daysInAdvance: settings.daysInAdvance || 1,
                notificationTime: settings.notificationTime || '09:00',
                phoneNumber: settings.phoneNumber || '',
                notificationService: settings.notificationService || 'twilio-sms'
            };
            
            const req = store.put(settingsData);
            req.onsuccess = () => resolve(settingsData);
            req.onerror = () => reject(req.error);
        });
    }

    async getReminderSettings() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['reminderSettings'], 'readonly');
            const store = tx.objectStore('reminderSettings');
            const req = store.get('reminderPrefs');
            
            req.onsuccess = () => resolve(req.result || {
                daysInAdvance: 1,
                notificationTime: '09:00',
                phoneNumber: '',
                notificationService: 'twilio-sms'
            });
            req.onerror = () => reject(req.error);
        });
    }

    async logReminder(dateId, dateTitle) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['reminderLog'], 'readwrite');
            const store = tx.objectStore('reminderLog');
            
            const logEntry = {
                id: `${dateId}-${Date.now()}`,
                dateId: dateId,
                dateTitle: dateTitle,
                reminderTime: new Date().toISOString(),
                read: false
            };
            
            const req = store.add(logEntry);
            req.onsuccess = () => resolve(logEntry);
            req.onerror = () => reject(req.error);
        });
    }

    async getReminderLog() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['reminderLog'], 'readonly');
            const store = tx.objectStore('reminderLog');
            const req = store.getAll();
            
            req.onsuccess = () => resolve(req.result.sort((a, b) => 
                new Date(b.reminderTime) - new Date(a.reminderTime)
            ));
            req.onerror = () => reject(req.error);
        });
    }

    async clearReminderLog() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['reminderLog'], 'readwrite');
            const store = tx.objectStore('reminderLog');
            const req = store.clear();
            
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
}

// Initialize database
const db = new DatabaseManager();
