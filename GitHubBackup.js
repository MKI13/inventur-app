// =============================================================================
// GITHUB BACKUP - KOMPLETT MIT AUTO-UI
// Sync-Logik + Automatische UI-Erstellung
// =============================================================================

class GitHubBackup {
    constructor() {
        // GitHub Konfiguration
        this.config = {
            owner: 'MKI13',
            repo: 'inventur-v2',
            branch: 'main',
            token: localStorage.getItem('github_token') || ''
        };
        
        // Cache für letzte Sync-Zustände
        this.lastSync = JSON.parse(localStorage.getItem('github_last_sync') || '{}');
        
        // UI Elemente
        this.container = null;
        this.elements = {};
    }

    // =============================================================================
    // AUTO-UI ERSTELLEN
    // =============================================================================
    
    createUI(containerId = 'githubSyncContainer') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('GitHub Sync Container nicht gefunden:', containerId);
            return;
        }

        this.container.innerHTML = `
            <div class="github-sync-section">
                <h3 class="sync-title">🔄 GitHub Backup</h3>
                <p class="sync-subtitle">Automatisches Backup deiner Kategorien</p>
                
                <!-- GitHub Token -->
                <div class="sync-form-group">
                    <label for="githubToken">
                        GitHub Token:
                        <a href="https://github.com/settings/tokens/new" target="_blank" class="sync-link">
                            (Token erstellen →)
                        </a>
                    </label>
                    <div class="sync-input-group">
                        <input type="password" 
                               id="githubToken" 
                               class="sync-input"
                               placeholder="ghp_xxxxxxxxxxxx"
                               value="${this.config.token}">
                        <button id="saveTokenBtn" class="sync-btn sync-btn-sm">Speichern</button>
                    </div>
                </div>
                
                <!-- Sync Status -->
                <div class="sync-status-box">
                    <div class="sync-status-row">
                        <span class="sync-label">Repository:</span>
                        <span class="sync-value">${this.config.owner}/${this.config.repo}</span>
                    </div>
                    <div class="sync-status-row">
                        <span class="sync-label">Letzte Sync:</span>
                        <span id="lastSyncTime" class="sync-value">Noch nie</span>
                    </div>
                    <div class="sync-status-row">
                        <span class="sync-label">Änderungen:</span>
                        <span id="pendingChanges" class="sync-value sync-pending">Prüfe...</span>
                    </div>
                </div>
                
                <!-- Sync Button -->
                <button id="syncButton" class="sync-btn sync-btn-primary sync-btn-full">
                    <span id="syncIcon" class="sync-icon">🔄</span>
                    <span id="syncText">Jetzt synchronisieren</span>
                </button>
                
                <!-- Progress -->
                <div id="syncProgress" class="sync-progress" style="display: none;">
                    <div class="sync-progress-bar">
                        <div id="progressFill" class="sync-progress-fill"></div>
                    </div>
                    <div id="progressText" class="sync-progress-text"></div>
                </div>
                
                <!-- Log -->
                <div id="syncLog" class="sync-log" style="display: none;"></div>
            </div>
        `;

        // Event Listeners
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        const saveBtn = document.getElementById('saveTokenBtn');
        const syncBtn = document.getElementById('syncButton');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveToken());
        }

        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.performSync());
        }
    }

    // =============================================================================
    // UI UPDATES
    // =============================================================================
    
    updateUI() {
        this.updateSyncTime();
        this.checkPendingChanges();
    }

    updateSyncTime() {
        const lastSyncTime = localStorage.getItem('github_last_sync_time');
        const el = document.getElementById('lastSyncTime');
        
        if (el) {
            if (lastSyncTime) {
                const date = new Date(lastSyncTime);
                el.textContent = date.toLocaleString('de-DE');
            } else {
                el.textContent = 'Noch nie';
            }
        }
    }

    async checkPendingChanges() {
        const el = document.getElementById('pendingChanges');
        if (!el) return;

        if (!this.hasToken()) {
            el.textContent = 'Kein Token';
            el.className = 'sync-value sync-error';
            return;
        }

        try {
            const categories = window.app ? window.app.categories : [];
            const changes = await this.getChangedCategories(categories);
            
            if (changes.length === 0) {
                el.textContent = '✅ Alles synchronisiert';
                el.className = 'sync-value sync-success';
            } else {
                el.textContent = `⚠️ ${changes.length} Kategorie(n)`;
                el.className = 'sync-value sync-warning';
            }
        } catch (error) {
            el.textContent = 'Fehler';
            el.className = 'sync-value sync-error';
        }
    }

    // =============================================================================
    // TOKEN SPEICHERN
    // =============================================================================
    
    saveToken() {
        const input = document.getElementById('githubToken');
        if (!input) return;

        const token = input.value.trim();
        
        if (!token) {
            alert('⚠️ Bitte GitHub Token eingeben!');
            return;
        }
        
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            alert('⚠️ Token ungültig! Muss mit "ghp_" oder "github_pat_" beginnen.');
            return;
        }
        
        this.config.token = token;
        localStorage.setItem('github_token', token);
        alert('✅ GitHub Token gespeichert!');
        this.updateUI();
    }

    hasToken() {
        return !!this.config.token;
    }

    // =============================================================================
    // SYNC DURCHFÜHREN
    // =============================================================================
    
    async performSync() {
        if (!this.hasToken()) {
            alert('⚠️ Bitte zuerst GitHub Token speichern!');
            return;
        }

        const btn = document.getElementById('syncButton');
        const icon = document.getElementById('syncIcon');
        const text = document.getElementById('syncText');
        const progress = document.getElementById('syncProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const syncLog = document.getElementById('syncLog');

        // UI vorbereiten
        btn.disabled = true;
        icon.textContent = '⏳';
        text.textContent = 'Synchronisiere...';
        progress.style.display = 'block';
        syncLog.style.display = 'block';
        syncLog.innerHTML = '';

        try {
            const categories = window.app ? window.app.categories : [];
            
            if (categories.length === 0) {
                throw new Error('Keine Kategorien vorhanden');
            }

            // Log Funktion
            const log = (message, type = 'info') => {
                const entry = document.createElement('div');
                entry.className = `sync-log-entry sync-log-${type}`;
                entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
                syncLog.appendChild(entry);
                syncLog.scrollTop = syncLog.scrollHeight;
            };

            log('🚀 Starte GitHub Sync...', 'info');

            // Sync durchführen
            const result = await this.sync(categories, (current, total, name) => {
                const percent = Math.round((current / total) * 100);
                progressFill.style.width = percent + '%';
                progressText.textContent = `${current}/${total} - ${name}`;
                log(`📝 Syncronisiere: ${name}`, 'info');
            });

            // Ergebnis
            if (result.success) {
                icon.textContent = '✅';
                text.textContent = 'Synchronisiert!';
                log(result.message, 'success');

                if (result.details) {
                    result.details.forEach(detail => {
                        if (detail.success) {
                            log(`✅ ${detail.category} (${detail.action})`, 'success');
                        } else {
                            log(`❌ ${detail.category}: ${detail.error}`, 'error');
                        }
                    });
                }

                this.updateUI();

                setTimeout(() => {
                    icon.textContent = '🔄';
                    text.textContent = 'Jetzt synchronisieren';
                    btn.disabled = false;
                    progress.style.display = 'none';
                }, 3000);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Sync Fehler:', error);
            icon.textContent = '❌';
            text.textContent = 'Fehler!';
            
            const errorEntry = document.createElement('div');
            errorEntry.className = 'sync-log-entry sync-log-error';
            errorEntry.textContent = `❌ FEHLER: ${error.message}`;
            syncLog.appendChild(errorEntry);

            setTimeout(() => {
                icon.textContent = '🔄';
                text.textContent = 'Jetzt synchronisieren';
                btn.disabled = false;
                progress.style.display = 'none';
            }, 3000);
        }
    }

    // =============================================================================
    // SYNC LOGIK
    // =============================================================================
    
    async sync(categories, onProgress) {
        try {
            const changes = await this.getChangedCategories(categories);
            
            if (changes.length === 0) {
                return {
                    success: true,
                    message: '✅ Keine Änderungen zu synchronisieren',
                    synced: 0
                };
            }

            const results = [];
            for (let i = 0; i < changes.length; i++) {
                const change = changes[i];
                
                if (onProgress) {
                    onProgress(i + 1, changes.length, change.name || change.id);
                }

                try {
                    const result = await this.syncCategory(change);
                    results.push(result);
                } catch (error) {
                    results.push({
                        category: change.name || change.id,
                        success: false,
                        error: error.message
                    });
                }
            }

            this.updateSyncState(categories);
            await this.updateIndex(categories);

            const successful = results.filter(r => r.success).length;
            return {
                success: true,
                message: `✅ ${successful}/${changes.length} Kategorien synchronisiert`,
                synced: successful,
                changes: changes.length,
                details: results
            };

        } catch (error) {
            return {
                success: false,
                message: `❌ Fehler: ${error.message}`,
                synced: 0
            };
        }
    }

    async getChangedCategories(categories) {
        const changes = [];
        
        for (const category of categories) {
            const categoryId = category.id || this.slugify(category.name);
            const currentHash = this.hashCategory(category);
            const lastHash = this.lastSync[categoryId];
            
            if (currentHash !== lastHash) {
                changes.push({
                    id: categoryId,
                    name: category.name,
                    data: category,
                    action: lastHash ? 'UPDATE' : 'NEW',
                    hash: currentHash
                });
            }
        }
        
        const currentIds = categories.map(c => c.id || this.slugify(c.name));
        const deletedIds = Object.keys(this.lastSync).filter(id => !currentIds.includes(id));
        
        deletedIds.forEach(id => {
            changes.push({ id: id, action: 'DELETE' });
        });
        
        return changes;
    }

    hashCategory(category) {
        const data = JSON.stringify({
            name: category.name,
            icon: category.icon,
            items: category.items || []
        });
        
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash) + data.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString(36);
    }

    async syncCategory(change) {
        const fileName = `categories/${change.id}.json`;
        
        if (change.action === 'DELETE') {
            await this.deleteFile(fileName, `chore: Kategorie "${change.id}" gelöscht`);
            return { category: change.id, action: 'DELETE', success: true };
        } else {
            const content = JSON.stringify(change.data, null, 2);
            const message = change.action === 'NEW' 
                ? `feat: Kategorie "${change.name}" hinzugefügt`
                : `chore: Kategorie "${change.name}" aktualisiert`;
            
            await this.updateFile(fileName, content, message);
            return { category: change.name, action: change.action, success: true };
        }
    }

    async updateIndex(categories) {
        const index = {
            lastUpdate: new Date().toISOString(),
            categories: categories.map(c => ({
                id: c.id || this.slugify(c.name),
                name: c.name,
                icon: c.icon,
                itemCount: (c.items || []).length
            }))
        };
        
        await this.updateFile('index.json', JSON.stringify(index, null, 2), 'chore: Index aktualisiert');
    }

    async updateFile(path, content, message) {
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
        
        let sha = null;
        try {
            const getResponse = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (getResponse.ok) {
                const data = await getResponse.json();
                sha = data.sha;
            }
        } catch (e) {}

        const body = {
            message: message,
            content: btoa(unescape(encodeURIComponent(content))),
            branch: this.config.branch
        };
        
        if (sha) body.sha = sha;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Fehler beim Aktualisieren');
        }

        return await response.json();
    }

    async deleteFile(path, message) {
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
        
        const getResponse = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!getResponse.ok) throw new Error('Datei nicht gefunden');

        const data = await getResponse.json();

        const deleteResponse = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                sha: data.sha,
                branch: this.config.branch
            })
        });

        if (!deleteResponse.ok) {
            const error = await deleteResponse.json();
            throw new Error(error.message || 'Fehler beim Löschen');
        }

        return await deleteResponse.json();
    }

    updateSyncState(categories) {
        const newState = {};
        categories.forEach(category => {
            const categoryId = category.id || this.slugify(category.name);
            newState[categoryId] = this.hashCategory(category);
        });
        
        this.lastSync = newState;
        localStorage.setItem('github_last_sync', JSON.stringify(newState));
        localStorage.setItem('github_last_sync_time', new Date().toISOString());
    }

    slugify(name) {
        return name
            .toLowerCase()
            .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    clearCache() {
        this.lastSync = {};
        localStorage.removeItem('github_last_sync');
        localStorage.removeItem('github_last_sync_time');
    }
}

// =============================================================================
// AUTO-INIT
// =============================================================================

let githubBackup = null;

document.addEventListener('DOMContentLoaded', function() {
    githubBackup = new GitHubBackup();
    githubBackup.createUI('githubSyncContainer');
    
    // Auto-Check alle 30 Sekunden
    setInterval(() => {
        if (githubBackup) {
            githubBackup.checkPendingChanges();
        }
    }, 30000);
});

// Export
if (typeof window !== 'undefined') {
    window.GitHubBackup = GitHubBackup;
}
