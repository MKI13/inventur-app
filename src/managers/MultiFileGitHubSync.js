// =============================================================================
// MultiFileGitHubSync v2.0.0 - VOLLSTÄNDIG mit GitHub API
// =============================================================================

// UTF-8 Helper Funktionen
function base64EncodeUTF8_OLD(str) {
    return btoa(encodeURIComponent(str).replace(
        /%([0-9A-F]{2})/g,
        (match, p1) => String.fromCharCode(parseInt(p1, 16))
    ));
}

function await this.base64ToString(str) {
    return decodeURIComponent(
        atob(str).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
    );
}

class MultiFileGitHubSync {

    // UTF-8 zu Base64 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
        return new Promise((resolve) => {

    // Base64 zu UTF-8 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
            const blob = new Blob([str], { type: "text/plain;charset=utf-8" });

    // Base64 zu UTF-8 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
            const reader = new FileReader();

    // Base64 zu UTF-8 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
            reader.onloadend = () => {

    // Base64 zu UTF-8 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
                const base64 = reader.result.split(",")[1];

    // Base64 zu UTF-8 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
                resolve(base64);

    // Base64 zu UTF-8 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
            };

    // Base64 zu UTF-8 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
            reader.readAsDataURL(blob);

    // Base64 zu UTF-8 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
        });

    // Base64 zu UTF-8 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
    }

    // Base64 zu UTF-8 Konvertierung (Blob-basiert)
    async base64ToString(base64) {
        return new Promise((resolve, reject) => {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes]);
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob, "utf-8");
            } catch (error) {
                reject(error);
            }
        });
    }
    constructor(categoryManager, imageManager) {
        this.categoryManager = categoryManager;
        this.imageManager = imageManager;
        this.token = localStorage.getItem('efsin_github_token');
        this.owner = localStorage.getItem('efsin_github_owner');
        this.repo = localStorage.getItem('efsin_github_repo');
        this.branch = 'main';
        this.syncInterval = null;
        this.isSyncing = false;
        this.fileSHAs = new Map();
    }

    isConfigured() {
        return !!(this.token && this.owner && this.repo);
    }

    // -------------------------------------------------------------------------
    // Smart Sync - Nur geänderte Kategorien
    // -------------------------------------------------------------------------

    async smartSync() {
        const startTime = Date.now();
        
        try {
            console.log('🔄 Smart Sync gestartet...');
            
            // 1. Index syncen
            const indexResult = await this.syncIndex();
            
            // 2. Geänderte Kategorien ermitteln
            const remoteIndex = indexResult.action === 'downloaded' 
                ? indexResult.data 
                : await this.getFile('index.json');
            
            const changedCategories = await this.detectChangedCategories(remoteIndex);
            
            console.log(`📊 ${changedCategories.length} Kategorien zu syncen`);
            
            // 3. Nur geänderte Kategorien syncen
            const results = [];
            for (const categoryId of changedCategories) {
                const result = await this.syncCategory(categoryId);
                results.push(result);
            }
            
            const duration = Date.now() - startTime;
            console.log(`✅ Smart Sync abgeschlossen in ${duration}ms`);
            
            return {
                status: 'success',
                duration,
                index: indexResult,
                categories: results
            };
            
        } catch (error) {
            console.error('❌ Smart Sync Fehler:', error);
            return { status: 'error', error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }

    // -------------------------------------------------------------------------
    // Index Sync
    // -------------------------------------------------------------------------

    async syncIndex() {
        console.log('📄 Syncing index.json...');
        
        const localIndex = await this.categoryManager.exportIndexJSON();
        const remoteIndex = await this.getFile('index.json');
        
        if (!remoteIndex) {
            // Erste Sync
            await this.putFile('index.json', localIndex, 'Initial sync: index.json');
            return { action: 'uploaded', file: 'index.json' };
        }
        
        // Vergleiche Timestamps
        const localTime = new Date(localIndex.lastUpdated).getTime();
        const remoteTime = new Date(remoteIndex.lastUpdated).getTime();
        
        if (localTime > remoteTime) {
            await this.putFile('index.json', localIndex, 'Update index.json');
            return { action: 'uploaded', file: 'index.json' };
        } else if (remoteTime > localTime) {
            return { action: 'downloaded', file: 'index.json', data: remoteIndex };
        }
        
        return { action: 'none', file: 'index.json' };
    }

    // -------------------------------------------------------------------------
    // Kategorie Sync
    // -------------------------------------------------------------------------

    async syncCategory(categoryId) {
        console.log(`📂 Syncing category: ${categoryId}...`);
        
        const localData = await this.categoryManager.exportCategoryJSON(categoryId);
        const remoteData = await this.getFile(`categories/${categoryId}.json`);
        
        if (!remoteData) {
            // Kategorie existiert nicht remote
            await this.putFile(
                `categories/${categoryId}.json`,
                localData,
                `Add category: ${categoryId}`
            );
            return { action: 'uploaded', category: categoryId };
        }
        
        // Vergleiche lastModified
        const localTime = new Date(localData.lastModified).getTime();
        const remoteTime = new Date(remoteData.lastModified).getTime();
        
        if (localTime > remoteTime) {
            await this.putFile(
                `categories/${categoryId}.json`,
                localData,
                `Update category: ${categoryId}`
            );
            return { action: 'uploaded', category: categoryId };
        } else if (remoteTime > localTime) {
            await this.categoryManager.importCategoryJSON(categoryId, remoteData);
            return { action: 'downloaded', category: categoryId };
        }
        
        return { action: 'none', category: categoryId };
    }

    async syncAllCategories() {
        const results = [];
        
        for (const category of this.categoryManager.categories) {
            try {
                const result = await this.syncCategory(category.id);
                results.push(result);
            } catch (error) {
                console.error(`❌ Fehler bei Kategorie ${category.id}:`, error);
                results.push({ action: 'error', category: category.id, error: error.message });
            }
        }
        
        return results;
    }

    async detectChangedCategories(remoteIndex) {
        const changed = [];
        
        for (const category of this.categoryManager.categories) {
            const localStats = await this.categoryManager.getCategoryStats(category.id);
            const remoteCat = remoteIndex?.categories?.find(c => c.id === category.id);
            
            if (!remoteCat) {
                // Neue Kategorie
                changed.push(category.id);
                continue;
            }
            
            // Vergleiche Timestamps
            const localTime = localStats.lastModified;
            const remoteTime = new Date(remoteCat.lastModified).getTime();
            
            if (Math.abs(localTime - remoteTime) > 1000) { // 1 Sekunde Toleranz
                changed.push(category.id);
            }
        }
        
        return changed;
    }

    // -------------------------------------------------------------------------
    // GitHub API - JSON Dateien
    // -------------------------------------------------------------------------

    async getFile(path) {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.status === 404) {
                return null;
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`GitHub API Error: ${response.status} - ${error.message || ''}`);
            }
            
            const data = await response.json();
            
            // SHA speichern für Updates
            this.fileSHAs.set(path, data.sha);
            
            // Content decodieren
            const base64Content = data.content.replace(/\s/g, '');
            const jsonString = await this.base64ToString(base64Content);
            return JSON.parse(jsonString);
            
        } catch (error) {
            console.error(`❌ getFile(${path}) Fehler:`, error);
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async putFile(path, data, message) {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
        
        const jsonString = JSON.stringify(data, null, 2);
        const content = await this.stringToBase64(jsonString);
        
        const body = {
            message,
            content,
            branch: this.branch
        };
        
        // SHA hinzufügen wenn vorhanden (für Updates)
        if (this.fileSHAs.has(path)) {
            body.sha = this.fileSHAs.get(path);
        }
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`GitHub API Error: ${response.status} - ${error.message || ''}`);
            }
            
            const result = await response.json();
            
            // SHA aktualisieren für zukünftige Updates
            this.fileSHAs.set(path, result.content.sha);
            
            console.log(`✅ ${path} hochgeladen`);
            return result;
            
        } catch (error) {
            console.error(`❌ putFile(${path}) Fehler:`, error);
            throw error;
        }
    }

    // -------------------------------------------------------------------------
    // Bild-Sync (optional für später)
    // -------------------------------------------------------------------------

    async syncImage(itemId, categoryId) {
        const imageId = `${categoryId}/${itemId}`;
        
        // Prüfe ob Bild lokal existiert
        const localBlob = await this.imageManager.loadImage(imageId);
        
        if (localBlob) {
            // Upload zu GitHub
            await this.imageManager.uploadToGitHub(imageId, localBlob, this);
            return { action: 'uploaded', image: imageId };
        } else {
            // Download von GitHub
            const blob = await this.imageManager.downloadFromGitHub(imageId, this);
            return { action: 'downloaded', image: imageId, blob };
        }
    }

    // -------------------------------------------------------------------------
    // GitHub API - Binärdateien (für Bilder)
    // -------------------------------------------------------------------------

    async uploadFile(path, base64Content) {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
        
        const body = {
            message: `Upload image: ${path}`,
            content: base64Content,
            branch: this.branch
        };
        
        // SHA wenn vorhanden
        if (this.fileSHAs.has(path)) {
            body.sha = this.fileSHAs.get(path);
        }
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Upload failed: ${response.status} - ${error.message || ''}`);
        }
        
        const result = await response.json();
        this.fileSHAs.set(path, result.content.sha);
        return result;
    }

    async downloadFile(path) {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }
        
        const data = await response.json();
        this.fileSHAs.set(path, data.sha);
        
        return data.content.replace(/\s/g, '');
    }

    // -------------------------------------------------------------------------
    // Auto-Sync
    // -------------------------------------------------------------------------

    startAutoSync(intervalMinutes = 5) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(
            () => this.smartSync(),
            intervalMinutes * 60 * 1000
        );
        
        console.log(`⏰ Auto-Sync gestartet: alle ${intervalMinutes} Minuten`);
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏸️ Auto-Sync gestoppt');
        }
    }

    // -------------------------------------------------------------------------
    // Manueller Sync (für UI Button)
    // -------------------------------------------------------------------------

    async manualSync() {
        if (!this.isConfigured()) {
            throw new Error('GitHub nicht konfiguriert! Bitte Token, Owner und Repo in Einstellungen eintragen.');
        }
        
        return await this.smartSync();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiFileGitHubSync;
}

// BLOB-basiertes UTF-8 Encoding (100% sicher!)

