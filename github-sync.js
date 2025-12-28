/**
 * GitHub Sync - MIT BLOB-basiertem UTF-8 Encoding (100% sicher!)
 */

class GitHubSync {
    constructor() {
        this.settings = {
            token: '',
            username: 'MKI13',
            repo: 'inventur-v2',
            autoSync: false,
            lastSync: null,
            lastSyncStatus: null
        };
        
        try {
            const saved = localStorage.getItem('githubSyncSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Settings laden fehlgeschlagen:', e);
        }
        
        this.isInitialized = false;
        console.log('✅ GitHubSync Konstruktor fertig');
    }

    init() {
        if (this.isInitialized) return;
        const container = document.getElementById('githubSyncContainer');
        if (!container) return;
        container.innerHTML = this.renderModal();
        this.attachEventListeners();
        this.updateUI();
        this.isInitialized = true;
    }

    renderModal() {
        return `
            <div class="modal-body">
                <div class="form-group">
                    <label for="ghToken">🔑 GitHub Token</label>
                    <input type="password" id="ghToken" placeholder="ghp_..." 
                           value="${this.settings.token || ''}">
                    <small><a href="https://github.com/settings/tokens" target="_blank">Token erstellen</a></small>
                </div>
                
                <div class="form-group">
                    <label for="ghUsername">👤 Username</label>
                    <input type="text" id="ghUsername" value="${this.settings.username}">
                </div>
                
                <div class="form-group">
                    <label for="ghRepo">📦 Backup Repository</label>
                    <input type="text" id="ghRepo" value="${this.settings.repo}">
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="ghAutoSync" 
                               ${this.settings.autoSync ? 'checked' : ''}>
                        🔄 Auto-Sync
                    </label>
                </div>

                <div class="sync-status" id="syncStatus">
                    ${this.renderStatus()}
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn-secondary" onclick="window.githubSync.close()">Abbrechen</button>
                <button class="btn-primary" onclick="window.githubSync.save()">💾 Speichern</button>
                <button class="btn-primary" onclick="window.githubSync.syncNow()" id="syncNowBtn">
                    🔄 Jetzt Synchronisieren
                </button>
            </div>
        `;
    }

    renderStatus() {
        const { lastSync, lastSyncStatus } = this.settings;
        if (!lastSync) return '<p>⏳ Noch nicht synchronisiert</p>';
        const timeAgo = this.getTimeAgo(lastSync);
        const icon = lastSyncStatus === 'success' ? '✅' : '❌';
        return `<p>${icon} Letzte Sync: ${timeAgo}</p>`;
    }

    attachEventListeners() {
        const autoSync = document.getElementById('ghAutoSync');
        if (autoSync) {
            autoSync.addEventListener('change', (e) => {
                this.settings.autoSync = e.target.checked;
                this.saveSettings();
            });
        }
    }

    close() {
        const modal = document.getElementById('githubSettingsModal');
        if (modal) modal.style.display = 'none';
    }

    open() {
        this.init();
        const modal = document.getElementById('githubSettingsModal');
        if (modal) modal.style.display = 'flex';
    }

    save() {
        const token = document.getElementById('ghToken')?.value.trim();
        const username = document.getElementById('ghUsername')?.value.trim() || 'MKI13';
        const repo = document.getElementById('ghRepo')?.value.trim() || 'inventur-v2';
        const autoSync = document.getElementById('ghAutoSync')?.checked;

        if (!token) {
            alert('⚠️ Bitte Token eingeben!');
            return;
        }

        this.settings = { token, username, repo, autoSync,
            lastSync: this.settings.lastSync,
            lastSyncStatus: this.settings.lastSyncStatus };
        
        this.saveSettings();
        alert(`✅ Gespeichert!`);
        this.close();
    }

    async syncNow() {
        if (!this.settings.token) {
            alert('⚠️ Bitte erst Token eingeben!');
            this.open();
            return;
        }

        const btn = document.getElementById('syncNowBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Läuft...';
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
            
            alert(`✅ Backup erfolgreich!`);
            
        } catch (error) {
            console.error('Sync-Fehler:', error);
            
            if (btn) {
                btn.textContent = '❌ Fehler';
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = '🔄 Jetzt Synchronisieren';
                }, 2000);
            }
            
            alert(`❌ Fehler: ${error.message}`);
        }
    }

    // BLOB-basierte Base64 Konvertierung - 100% UTF-8 sicher!
    async stringToBase64(str) {
        return new Promise((resolve) => {
            const blob = new Blob([str], { type: 'text/plain;charset=utf-8' });
            const reader = new FileReader();
            reader.onloadend = () => {
                // Data URL format: data:text/plain;base64,XXXXX
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(blob);
        });
    }

    async pushToGitHub() {
        const { token, username, repo } = this.settings;
        
        console.log('📤 Hole Daten...');
        const data = await this.getInventoryData();
        
        if (!data || data.items.length === 0) {
            throw new Error('Keine Daten vorhanden!');
        }

        console.log(`📦 ${data.items.length} Artikel`);

        const jsonContent = JSON.stringify(data, null, 2);
        console.log(`📄 JSON: ${(jsonContent.length / 1024).toFixed(1)} KB`);
        
        // BLOB-basierte Konvertierung - funktioniert IMMER!
        const base64Content = await this.stringToBase64(jsonContent);
        console.log(`🔐 Base64: ${(base64Content.length / 1024).toFixed(1)} KB`);

        const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/backup/inventory.json`;
        
        let sha = null;
        try {
            const check = await fetch(apiUrl, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (check.ok) {
                const fileData = await check.json();
                sha = fileData.sha;
                console.log('📝 Update');
            }
        } catch (e) {
            console.log('📝 Neu');
        }

        console.log('🚀 Push...');
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `ef-sin Backup - ${data.items.length} Artikel`,
                content: base64Content,
                sha: sha || undefined
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || response.statusText);
        }

        const result = await response.json();
        console.log('✅ Erfolgreich:', result.commit.sha);

        this.settings.lastSync = new Date().toISOString();
        this.settings.lastSyncStatus = 'success';
        this.saveSettings();
        this.updateUI();
        
        return result;
    }

    async getInventoryData() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('InventurDB', 1);
            request.onerror = () => reject(new Error('DB-Fehler'));
            request.onsuccess = (event) => {
                try {
                    const db = event.target.result;
                    const tx = db.transaction(['items'], 'readonly');
                    const store = tx.objectStore('items');
                    const getAll = store.getAll();
                    
                    getAll.onsuccess = () => {
                        resolve({
                            version: '2.1.9',
                            exportDate: new Date().toISOString(),
                            source: 'ef-sin Inventur',
                            itemCount: getAll.result.length,
                            items: getAll.result
                        });
                    };
                    getAll.onerror = () => reject(new Error('Lese-Fehler'));
                } catch (e) {
                    reject(new Error(e.message));
                }
            };
        });
    }

    saveSettings() {
        try {
            localStorage.setItem('githubSyncSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Save-Fehler:', e);
        }
    }

    updateUI() {
        const status = document.getElementById('syncStatus');
        if (status) status.innerHTML = this.renderStatus();
    }

    getTimeAgo(iso) {
        const ms = new Date() - new Date(iso);
        const mins = Math.floor(ms / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);
        if (mins < 1) return 'gerade eben';
        if (mins < 60) return `vor ${mins} Min`;
        if (hrs < 24) return `vor ${hrs} Std`;
        return `vor ${days} Tagen`;
    }

    async triggerAutoSync() {
        if (!this.settings.autoSync || !this.settings.token) return;
        try {
            await this.pushToGitHub();
        } catch (e) {
            console.error('Auto-Sync Fehler:', e);
        }
    }
}

window.githubSync = new GitHubSync();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.githubSync.init());
} else {
    window.githubSync.init();
}

console.log('✅ GitHub Sync - Blob-basiert, UTF-8 sicher');
