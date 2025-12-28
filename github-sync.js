/**
 * GitHub Sync - MIT ROBUSTEM UTF-8 ENCODING
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
                    <input type="text" id="ghUsername" placeholder="MKI13" 
                           value="${this.settings.username}">
                </div>
                
                <div class="form-group">
                    <label for="ghRepo">📦 Backup Repository</label>
                    <input type="text" id="ghRepo" placeholder="inventur-v2" 
                           value="${this.settings.repo}">
                    <small>Ziel: <strong>github.com/${this.settings.username}/${this.settings.repo}</strong></small>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="ghAutoSync" 
                               ${this.settings.autoSync ? 'checked' : ''}>
                        🔄 Auto-Sync aktivieren
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
                    💾 Speichern
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
        if (!lastSync) return '<p class="status-info">⏳ Noch nicht synchronisiert</p>';
        const timeAgo = this.getTimeAgo(lastSync);
        const statusIcon = lastSyncStatus === 'success' ? '✅' : '❌';
        const statusClass = lastSyncStatus === 'success' ? 'status-success' : 'status-error';
        return `<p class="${statusClass}">${statusIcon} Letzte Sync: ${timeAgo}</p>`;
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
            alert('⚠️ Bitte GitHub Token eingeben!');
            return;
        }

        this.settings = { 
            token, username, repo, autoSync,
            lastSync: this.settings.lastSync,
            lastSyncStatus: this.settings.lastSyncStatus 
        };
        
        this.saveSettings();
        alert(`✅ Gespeichert!\n\nBackup-Ziel: ${username}/${repo}`);
        this.close();
    }

    async syncNow() {
        console.log('🔄 syncNow gestartet');

        if (!this.settings.token) {
            alert('⚠️ Bitte erst GitHub Token eingeben!');
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
            
            alert(`✅ Backup erfolgreich!\n\nRepository: ${this.settings.username}/${this.settings.repo}`);
            
        } catch (error) {
            console.error('❌ Sync-Fehler:', error);
            
            if (btn) {
                btn.textContent = '❌ Fehler';
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = '🔄 Jetzt Synchronisieren';
                }, 2000);
            }
            
            alert(`❌ Backup fehlgeschlagen!\n\n${error.message}`);
        }
    }

    // ROBUSTES UTF-8 zu Base64 Encoding (funktioniert mit Umlauten!)
    utf8ToBase64(str) {
        try {
            // Moderne Methode mit TextEncoder
            const bytes = new TextEncoder().encode(str);
            const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
            return btoa(binString);
        } catch (e) {
            console.warn('TextEncoder fehlgeschlagen, Fallback:', e);
            // Fallback für ältere Browser
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode(parseInt('0x' + p1));
            }));
        }
    }

    async pushToGitHub() {
        const { token, username, repo } = this.settings;
        
        console.log('📤 Hole Daten aus IndexedDB...');
        const data = await this.getInventoryData();
        
        if (!data || data.items.length === 0) {
            throw new Error('Keine Inventardaten zum Sichern!');
        }

        console.log(`📦 ${data.items.length} Artikel bereit`);

        // JSON erstellen
        const jsonContent = JSON.stringify(data, null, 2);
        console.log(`📄 JSON Größe: ${(jsonContent.length / 1024).toFixed(2)} KB`);
        
        // UTF-8 zu Base64 (funktioniert mit deutschen Umlauten!)
        const base64Content = this.utf8ToBase64(jsonContent);
        console.log(`🔐 Base64 kodiert: ${(base64Content.length / 1024).toFixed(2)} KB`);

        const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/backup/inventory.json`;
        
        // Prüfen ob Datei existiert
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
                console.log('📝 Update existierender Datei');
            } else {
                console.log('📝 Neue Datei wird erstellt');
            }
        } catch (e) {
            console.log('📝 Neue Datei wird erstellt');
        }

        // Zu GitHub pushen
        console.log('🚀 Push zu GitHub...');
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `🔄 ef-sin Inventur Backup - ${data.items.length} Artikel vom ${new Date().toLocaleString('de-DE')}`,
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
            throw new Error(`GitHub API: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Backup erfolgreich:', result.commit.sha);

        this.settings.lastSync = new Date().toISOString();
        this.settings.lastSyncStatus = 'success';
        this.saveSettings();
        this.updateUI();
        
        return result;
    }

    async getInventoryData() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('efsinInventurDB', 1);
            request.onerror = () => reject(new Error('Datenbank-Zugriff fehlgeschlagen'));
            request.onsuccess = (event) => {
                try {
                    const db = event.target.result;
                    const transaction = db.transaction(['inventory'], 'readonly');
                    const objectStore = transaction.objectStore('inventory');
                    const getAllRequest = objectStore.getAll();
                    
                    getAllRequest.onsuccess = () => {
                        resolve({
                            version: '2.1.9',
                            exportDate: new Date().toISOString(),
                            source: 'ef-sin Inventur PWA',
                            backupTarget: `${this.settings.username}/${this.settings.repo}`,
                            itemCount: getAllRequest.result.length,
                            items: getAllRequest.result
                        });
                    };
                    getAllRequest.onerror = () => reject(new Error('Daten konnten nicht gelesen werden'));
                } catch (e) {
                    reject(new Error(`IndexedDB Fehler: ${e.message}`));
                }
            };
        });
    }

    saveSettings() {
        try {
            localStorage.setItem('githubSyncSettings', JSON.stringify(this.settings));
            console.log('💾 Settings gespeichert');
        } catch (e) {
            console.error('Fehler beim Speichern:', e);
        }
    }

    updateUI() {
        const statusDiv = document.getElementById('syncStatus');
        if (statusDiv) statusDiv.innerHTML = this.renderStatus();
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
        if (!this.settings.autoSync || !this.settings.token) return;
        try {
            await this.pushToGitHub();
            console.log('✅ Auto-Sync erfolgreich');
        } catch (error) {
            console.error('❌ Auto-Sync fehlgeschlagen:', error);
        }
    }
}

window.githubSync = new GitHubSync();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.githubSync.init());
} else {
    window.githubSync.init();
}

console.log('✅ GitHub Sync geladen - UTF-8 sicher!');
