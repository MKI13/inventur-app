/**
 * GitHub Sync Komponente für Inventur PWA
 */

class GitHubSync {
    constructor() {
        this.settings = this.loadSettings();
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        const container = document.getElementById('githubSyncContainer');
        if (!container) {
            console.error('GitHub Sync Container nicht gefunden!');
            return;
        }

        container.innerHTML = this.renderModal();
        this.attachEventListeners();
        this.updateUI();
        this.isInitialized = true;
    }

    renderModal() {
        return `
            <div class="modal-body">
                <div class="form-group">
                    <label for="ghToken">GitHub Token</label>
                    <input type="password" id="ghToken" placeholder="ghp_..." 
                           value="${this.settings.token || ''}">
                    <small>Personal Access Token mit repo-Rechten</small>
                </div>
                
                <div class="form-group">
                    <label for="ghUsername">Username</label>
                    <input type="text" id="ghUsername" placeholder="username" 
                           value="${this.settings.username || ''}">
                </div>
                
                <div class="form-group">
                    <label for="ghRepo">Repository</label>
                    <input type="text" id="ghRepo" placeholder="inventur-app" 
                           value="${this.settings.repo || ''}">
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="ghAutoSync" 
                               ${this.settings.autoSync ? 'checked' : ''}>
                        Auto-Sync aktivieren
                    </label>
                </div>

                <div class="sync-status" id="syncStatus">
                    ${this.renderStatus()}
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn-secondary" onclick="window.githubSync.close()">
                    Abbrechen
                </button>
                <button class="btn-primary" onclick="window.githubSync.save()">
                    Speichern
                </button>
                <button class="btn-primary" onclick="window.githubSync.syncNow()" 
                        id="syncNowBtn">
                    🔄 Jetzt Synchronisieren
                </button>
            </div>
        `;
    }

    renderStatus() {
        const { lastSync, lastSyncStatus } = this.settings;
        
        if (!lastSync) {
            return '<p class="status-info">⏳ Noch nicht synchronisiert</p>';
        }

        const timeAgo = this.getTimeAgo(lastSync);
        const statusIcon = lastSyncStatus === 'success' ? '✅' : '❌';
        const statusClass = lastSyncStatus === 'success' ? 'status-success' : 'status-error';

        return `<p class="${statusClass}">${statusIcon} Letzte Sync: ${timeAgo}</p>`;
    }

    attachEventListeners() {
        const autoSyncCheckbox = document.getElementById('ghAutoSync');
        if (autoSyncCheckbox) {
            autoSyncCheckbox.addEventListener('change', (e) => {
                this.settings.autoSync = e.target.checked;
                this.saveSettings();
            });
        }
    }

    close() {
        const modal = document.getElementById('githubSettingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    open() {
        this.init();
        const modal = document.getElementById('githubSettingsModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    save() {
        const token = document.getElementById('ghToken')?.value.trim();
        const username = document.getElementById('ghUsername')?.value.trim();
        const repo = document.getElementById('ghRepo')?.value.trim();
        const autoSync = document.getElementById('ghAutoSync')?.checked;

        if (!token || !username || !repo) {
            alert('⚠️ Bitte alle Felder ausfüllen!');
            return;
        }

        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            alert('⚠️ Token-Format scheint ungültig.');
            return;
        }

        this.settings = {
            token,
            username,
            repo,
            autoSync,
            lastSync: this.settings.lastSync,
            lastSyncStatus: this.settings.lastSyncStatus
        };

        this.saveSettings();
        alert('✅ Einstellungen gespeichert!');
        this.close();
    }

    async syncNow() {
        console.log('🔄 Starte Synchronisation...');

        if (!this.settings.token || !this.settings.username || !this.settings.repo) {
            alert('⚠️ Bitte erst GitHub-Einstellungen konfigurieren!');
            this.open();
            return;
        }

        const btn = document.getElementById('syncNowBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Synchronisiere...';
        }

        try {
            await this.pushToGitHub();
            
            if (btn) {
                btn.textContent = '✅ Fertig!';
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = '🔄 Jetzt Synchronisieren';
                }, 2000);
            }

            alert('✅ Synchronisation erfolgreich!');
            
        } catch (error) {
            console.error('❌ Sync-Fehler:', error);
            
            if (btn) {
                btn.textContent = '❌ Fehler';
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = '🔄 Jetzt Synchronisieren';
                }, 2000);
            }

            alert(`❌ Synchronisation fehlgeschlagen:\n${error.message}`);
        }
    }

    async pushToGitHub() {
        const { token, username, repo } = this.settings;
        const data = await this.getInventoryData();
        
        if (!data || data.items.length === 0) {
            throw new Error('Keine Inventardaten gefunden!');
        }

        const jsonContent = JSON.stringify(data, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));
        const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/backup/inventory.json`;
        
        let sha = null;
        try {
            const checkResponse = await fetch(apiUrl, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (checkResponse.ok) {
                const fileData = await checkResponse.json();
                sha = fileData.sha;
            }
        } catch (e) {
            console.log('Neue Datei wird erstellt');
        }

        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `🔄 Inventar-Backup vom ${new Date().toLocaleString('de-DE')}`,
                content: base64Content,
                sha: sha || undefined,
                committer: {
                    name: 'ef-sin Inventur PWA',
                    email: 'inventur@ef-sin.de'
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API Fehler: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        this.settings.lastSync = new Date().toISOString();
        this.settings.lastSyncStatus = 'success';
        this.saveSettings();
        this.updateUI();

        return result;
    }

    async getInventoryData() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('efsinInventurDB', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['inventory'], 'readonly');
                const objectStore = transaction.objectStore('inventory');
                const getAllRequest = objectStore.getAll();

                getAllRequest.onsuccess = () => {
                    resolve({
                        version: '1.0.0',
                        exportDate: new Date().toISOString(),
                        itemCount: getAllRequest.result.length,
                        items: getAllRequest.result
                    });
                };
                getAllRequest.onerror = () => reject(getAllRequest.error);
            };
        });
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('githubSyncSettings');
            return saved ? JSON.parse(saved) : {
                token: '',
                username: '',
                repo: '',
                autoSync: false,
                lastSync: null,
                lastSyncStatus: null
            };
        } catch (e) {
            return {
                token: '',
                username: '',
                repo: '',
                autoSync: false,
                lastSync: null,
                lastSyncStatus: null
            };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('githubSyncSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Fehler beim Speichern:', e);
        }
    }

    updateUI() {
        const statusDiv = document.getElementById('syncStatus');
        if (statusDiv) {
            statusDiv.innerHTML = this.renderStatus();
        }
    }

    getTimeAgo(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'vor wenigen Sekunden';
        if (diffMins < 60) return `vor ${diffMins} Minuten`;
        if (diffHours < 24) return `vor ${diffHours} Stunden`;
        return `vor ${diffDays} Tagen`;
    }

    async triggerAutoSync() {
        if (!this.settings.autoSync) return;
        try {
            await this.pushToGitHub();
        } catch (error) {
            console.error('Auto-Sync fehlgeschlagen:', error);
        }
    }
}

window.githubSync = new GitHubSync();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.githubSync.init();
    });
} else {
    window.githubSync.init();
}
