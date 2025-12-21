// ===================================
// App Configuration
// ===================================
const APP_CONFIG = {
    DB_NAME: 'efsinInventurDB',
    DB_VERSION: 1,
    STORE_NAME: 'inventory',
    CATEGORIES_KEY: 'efsin_categories',
    LAST_BACKUP_KEY: 'efsin_last_backup',
    BACKUP_REMINDER_DAYS: 7, // Erinnere alle 7 Tage
    DEFAULT_CATEGORIES: [
        'Holz',
        'Platten',
        'Beschläge',
        'Werkzeuge',
        'Lacke',
        'Schrauben',
        'Sonstiges'
    ]
};

const GITHUB_CONFIG = {
    TOKEN_KEY: 'efsin_github_token',
    REPO_KEY: 'efsin_github_repo',
    OWNER_KEY: 'efsin_github_owner',
    LAST_SYNC_KEY: 'efsin_last_sync',
    LAST_SHA_KEY: 'efsin_last_sha',
    SYNC_INTERVAL: 5 * 60 * 1000, // 5 Minuten
    FILE_PATH: 'data/inventory.json',
    BRANCH: 'main'
};

// ===================================
// Database Manager
// ===================================
class DatabaseManager {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(APP_CONFIG.DB_NAME, APP_CONFIG.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Erstelle Object Store wenn nicht vorhanden
                if (!db.objectStoreNames.contains(APP_CONFIG.STORE_NAME)) {
                    const store = db.createObjectStore(APP_CONFIG.STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: false
                    });

                    // Erstelle Indizes
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('category', 'category', { unique: false });
                    store.createIndex('sku', 'sku', { unique: false });
                    store.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
            };
        });
    }

    async getAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([APP_CONFIG.STORE_NAME], 'readonly');
            const store = transaction.objectStore(APP_CONFIG.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([APP_CONFIG.STORE_NAME], 'readonly');
            const store = transaction.objectStore(APP_CONFIG.STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([APP_CONFIG.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(APP_CONFIG.STORE_NAME);
            const request = store.add(item);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([APP_CONFIG.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(APP_CONFIG.STORE_NAME);
            const request = store.put(item);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([APP_CONFIG.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(APP_CONFIG.STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clear() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([APP_CONFIG.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(APP_CONFIG.STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// ===================================
// UTF-8 Base64 Helper Functions
// ===================================
function base64EncodeUTF8(str) {
    // Konvertiere String zu UTF-8 Bytes, dann zu Base64
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));
}

function base64DecodeUTF8(str) {
    // Konvertiere Base64 zu UTF-8 String
    return decodeURIComponent(atob(str).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

// ===================================
// GitHub Sync Manager
// ===================================
class GitHubManager {
    constructor() {
        this.token = localStorage.getItem(GITHUB_CONFIG.TOKEN_KEY);
        this.owner = localStorage.getItem(GITHUB_CONFIG.OWNER_KEY);
        this.repo = localStorage.getItem(GITHUB_CONFIG.REPO_KEY);
        this.lastSHA = localStorage.getItem(GITHUB_CONFIG.LAST_SHA_KEY);
        this.syncInterval = null;
        this.isSyncing = false;
    }

    isConfigured() {
        return !!(this.token && this.owner && this.repo);
    }

    configure(token, owner, repo) {
        this.token = token;
        this.owner = owner;
        this.repo = repo;
        
        localStorage.setItem(GITHUB_CONFIG.TOKEN_KEY, token);
        localStorage.setItem(GITHUB_CONFIG.OWNER_KEY, owner);
        localStorage.setItem(GITHUB_CONFIG.REPO_KEY, repo);
    }

    async getFile() {
        if (!this.isConfigured()) throw new Error('GitHub nicht konfiguriert');

        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${GITHUB_CONFIG.FILE_PATH}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            return null; // Datei existiert noch nicht
        }

        if (!response.ok) {
            throw new Error(`GitHub API Fehler: ${response.status}`);
        }

        const data = await response.json();
        // GitHub fügt Zeilenumbrüche in base64 ein - entfernen
        const base64Content = data.content.replace(/\s/g, '');
        const content = JSON.parse(base64DecodeUTF8(base64Content));
        
        this.lastSHA = data.sha;
        localStorage.setItem(GITHUB_CONFIG.LAST_SHA_KEY, data.sha);
        
        return content;
    }

    async putFile(data, message = 'Auto-Sync') {
        if (!this.isConfigured()) throw new Error('GitHub nicht konfiguriert');

        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${GITHUB_CONFIG.FILE_PATH}`;
        
        const content = base64EncodeUTF8(JSON.stringify(data, null, 2));
        
        const body = {
            message: message,
            content: content,
            branch: GITHUB_CONFIG.BRANCH
        };

        // Wenn Datei existiert, SHA mitschicken
        if (this.lastSHA) {
            body.sha = this.lastSHA;
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
            const errorMsg = (error.message || JSON.stringify(error)).toLowerCase();
            
            // SHA-Mismatch: Hole aktuellen SHA und versuche nochmal
            // Verschiedene Error-Formate: "does not match", "sha", "409 conflict"
            if (response.status === 409 || 
                errorMsg.includes('does not match') || 
                errorMsg.includes('sha') ||
                errorMsg.includes('conflict')) {
                
                console.log('SHA-Mismatch erkannt, hole aktuellen SHA...');
                console.log('Original Error:', error.message || error);
                
                try {
                    // Hole NUR den SHA (ohne Datei-Inhalt zu laden/überschreiben)
                    const fileInfoUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${GITHUB_CONFIG.FILE_PATH}`;
                    const fileInfoResponse = await fetch(fileInfoUrl, {
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    
                    if (fileInfoResponse.ok) {
                        const fileInfo = await fileInfoResponse.json();
                        this.lastSHA = fileInfo.sha;
                        localStorage.setItem(GITHUB_CONFIG.LAST_SHA_KEY, fileInfo.sha);
                        
                        console.log('Neuer SHA erhalten:', this.lastSHA);
                        
                        // Update body mit neuem SHA
                        body.sha = this.lastSHA;
                        
                        // Retry mit korrektem SHA
                        const retryResponse = await fetch(url, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `token ${this.token}`,
                                'Accept': 'application/vnd.github.v3+json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(body)
                        });
                        
                        if (!retryResponse.ok) {
                            const retryError = await retryResponse.json();
                            throw new Error(`Retry fehlgeschlagen: ${retryError.message || 'Unbekannter Fehler'}`);
                        }
                        
                        const retryResult = await retryResponse.json();
                        this.lastSHA = retryResult.content.sha;
                        localStorage.setItem(GITHUB_CONFIG.LAST_SHA_KEY, retryResult.content.sha);
                        localStorage.setItem(GITHUB_CONFIG.LAST_SYNC_KEY, new Date().toISOString());
                        
                        console.log('SHA-Mismatch behoben! Neuer SHA:', this.lastSHA);
                        return retryResult;
                    }
                    
                } catch (retryError) {
                    console.error('Retry nach SHA-Refresh fehlgeschlagen:', retryError);
                    
                    // Letzter Versuch: Lösche SHA komplett und versuche als neue Datei
                    console.log('Versuche ohne SHA (neue Datei)...');
                    this.lastSHA = null;
                    localStorage.removeItem(GITHUB_CONFIG.LAST_SHA_KEY);
                    
                    throw new Error(`SHA-Konflikt konnte nicht behoben werden. Bitte 🔄 Button nochmal klicken oder Setup neu machen.`);
                }
            }
            
            // Kein SHA-Mismatch, anderer Fehler
            throw new Error(`GitHub API Fehler: ${error.message || JSON.stringify(error)}`);
        }

        const result = await response.json();
        this.lastSHA = result.content.sha;
        localStorage.setItem(GITHUB_CONFIG.LAST_SHA_KEY, result.content.sha);
        localStorage.setItem(GITHUB_CONFIG.LAST_SYNC_KEY, new Date().toISOString());
        
        return result;
    }

    async sync(localData, onConflict) {
        if (this.isSyncing) {
            console.log('Sync läuft bereits');
            return;
        }

        this.isSyncing = true;

        try {
            // Hole aktuelle Version von GitHub
            const remoteData = await this.getFile();

            if (!remoteData) {
                // Datei existiert noch nicht - erste Upload
                await this.putFile(localData, 'Initialer Sync');
                return { action: 'uploaded', message: 'Erste Synchronisation erfolgreich' };
            }

            // Vergleiche Versionen
            const localTimestamp = this.getLatestTimestamp(localData);
            const remoteTimestamp = this.getLatestTimestamp(remoteData);

            if (localTimestamp > remoteTimestamp) {
                // Lokale Version ist neuer
                await this.putFile(localData, 'Auto-Sync: Lokale Änderungen');
                return { action: 'uploaded', message: 'Lokale Änderungen hochgeladen' };
            } else if (remoteTimestamp > localTimestamp) {
                // Remote Version ist neuer
                if (onConflict) {
                    const result = await onConflict(remoteData, localData);
                    if (result === 'remote') {
                        return { action: 'downloaded', data: remoteData, message: 'Remote-Version übernommen' };
                    } else if (result === 'local') {
                        await this.putFile(localData, 'Konflikt gelöst: Lokale Version');
                        return { action: 'uploaded', message: 'Lokale Version beibehalten' };
                    }
                } else {
                    return { action: 'downloaded', data: remoteData, message: 'Remote-Version heruntergeladen' };
                }
            } else {
                // Keine Änderungen
                return { action: 'none', message: 'Bereits synchronisiert' };
            }
        } finally {
            this.isSyncing = false;
        }
    }

    getLatestTimestamp(data) {
        if (!data || !data.items || data.items.length === 0) {
            return new Date(0).toISOString();
        }

        const timestamps = data.items.map(item => 
            new Date(item.updatedAt || item.createdAt || 0)
        );

        return new Date(Math.max(...timestamps)).toISOString();
    }

    startAutoSync(syncCallback) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            console.log('Auto-Sync gestartet...');
            syncCallback();
        }, GITHUB_CONFIG.SYNC_INTERVAL);

        console.log(`Auto-Sync aktiviert (alle ${GITHUB_CONFIG.SYNC_INTERVAL / 60000} Minuten)`);
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Auto-Sync gestoppt');
        }
    }

    getLastSyncTime() {
        const lastSync = localStorage.getItem(GITHUB_CONFIG.LAST_SYNC_KEY);
        if (!lastSync) return null;
        
        const date = new Date(lastSync);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / 60000);
        
        if (diffMinutes < 1) return 'Gerade eben';
        if (diffMinutes < 60) return `vor ${diffMinutes} Min`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `vor ${diffHours} Std`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `vor ${diffDays} Tagen`;
    }
}

// ===================================
// Main Application Class
// ===================================
class InventoryApp {
    constructor() {
        this.db = new DatabaseManager();
        this.github = new GitHubManager();
        this.currentView = 'overview';
        this.items = [];
        this.editingItem = null;
        this.categories = this.loadCategories();
        this.init();
    }

    async init() {
        try {
            await this.db.init();
            await this.loadItems();
            this.updateCategorySelects();
            this.setupEventListeners();
            this.updateUI();
            this.checkOnlineStatus();
            this.checkBackupReminder();
            this.initGitHubSync();
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Fehler beim Initialisieren der App', 'error');
        }
    }

    setupEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // FAB
        document.getElementById('addBtn').addEventListener('click', () => {
            this.showAddItem();
        });

        // Menu
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.showMenu();
        });

        // Sync
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncData();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterItems(e.target.value);
        });

        // Filters
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterItems();
        });

        document.getElementById('sortFilter').addEventListener('change', () => {
            this.filterItems();
        });

        // Form Submit
        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });

        // Photo Upload
        document.getElementById('itemPhoto').addEventListener('change', (e) => {
            this.handlePhotoUpload(e);
        });

        // Online/Offline Status
        window.addEventListener('online', () => this.checkOnlineStatus());
        window.addEventListener('offline', () => this.checkOnlineStatus());
    }

    async loadItems() {
        try {
            this.items = await this.db.getAll();
            console.log(`Loaded ${this.items.length} items`);
        } catch (error) {
            console.error('Error loading items:', error);
            this.items = [];
        }
    }

    switchView(viewName) {
        // Update tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        document.getElementById(`${viewName}-view`).classList.add('active');
        this.currentView = viewName;

        // Update view-specific content
        if (viewName === 'inventory') {
            this.renderInventory();
        } else if (viewName === 'overview') {
            this.renderOverview();
        } else if (viewName === 'stats') {
            this.renderStats();
        }
        
        // Update FAB visibility
        this.updateFAB();
    }

    renderOverview() {
        // Update stats
        const totalItems = this.items.length;
        const lowStock = this.items.filter(item => this.isLowStock(item)).length;
        const categories = new Set(this.items.map(item => item.category)).size;
        const totalValue = this.items.reduce((sum, item) => {
            return sum + (item.stock * (item.price || 0));
        }, 0);

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('lowStock').textContent = lowStock;
        document.getElementById('categories').textContent = categories;
        document.getElementById('totalValue').textContent = totalValue.toFixed(2) + '€';

        // Render recent items
        const recentItems = [...this.items]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5);

        const recentHTML = recentItems.map(item => this.renderItemCard(item)).join('');
        document.getElementById('recentItems').innerHTML = recentHTML || '<p class="hint">Keine Artikel vorhanden</p>';
    }

    renderInventory() {
        this.filterItems();
    }

    filterItems() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const sortFilter = document.getElementById('sortFilter').value;

        let filtered = this.items.filter(item => {
            const matchesSearch = !searchTerm || 
                item.name.toLowerCase().includes(searchTerm) ||
                item.sku.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || item.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });

        // Sort
        filtered.sort((a, b) => {
            switch(sortFilter) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'stock':
                    return a.stock - b.stock;
                case 'stock-desc':
                    return b.stock - a.stock;
                case 'date':
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                default:
                    return 0;
            }
        });

        const html = filtered.map(item => this.renderInventoryCard(item)).join('');
        document.getElementById('inventoryList').innerHTML = html || '<p class="hint">Keine Artikel gefunden</p>';

        // Update category filter options
        this.updateCategoryFilter();
    }

    updateCategoryFilter() {
        const categories = new Set(this.items.map(item => item.category));
        const select = document.getElementById('categoryFilter');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Alle Kategorien</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    }

    renderItemCard(item) {
        const stockPercentage = this.getStockPercentage(item);
        const stockClass = this.getStockClass(item);
        const hasPhoto = item.photo && item.photo.trim() && item.photo.startsWith('data:image');
        const hasNotes = item.notes && item.notes.trim().length > 0;

        return `
            <div class="inventory-item ${stockClass}" onclick="app.editItem('${item.id}')">
                ${hasPhoto ? `<div class="item-photo"><img src="${item.photo}" alt="${item.name}"></div>` : ''}
                <div class="item-header">
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div class="item-sku">${item.sku || 'N/A'}</div>
                    </div>
                    <div class="item-badges">
                        <div class="item-badge badge-category">${item.category}</div>
                        ${hasNotes ? `<button class="btn-notes" onclick="event.stopPropagation(); app.showNotes('${item.id}')" title="Notizen anzeigen">📝</button>` : ''}
                    </div>
                </div>
                <div class="item-stock">
                    <span class="stock-value">${item.stock}</span>
                    <span class="stock-unit">${item.unit}</span>
                </div>
                ${item.location ? `<div class="item-footer">📍 ${item.location}</div>` : ''}
            </div>
        `;
    }

    renderInventoryCard(item) {
        const stockPercentage = this.getStockPercentage(item);
        const stockClass = this.getStockClass(item);
        const stockFillClass = stockPercentage < 20 ? 'critical' : (stockPercentage < 50 ? 'low' : '');
        const hasPhoto = item.photo && item.photo.trim() && item.photo.startsWith('data:image');
        const hasNotes = item.notes && item.notes.trim().length > 0;

        return `
            <div class="inventory-item ${stockClass}" onclick="app.editItem('${item.id}')">
                ${hasPhoto ? `<div class="item-photo"><img src="${item.photo}" alt="${item.name}"></div>` : ''}
                <div class="item-header">
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div class="item-sku">${item.sku || 'N/A'}</div>
                    </div>
                    <div class="item-badges">
                        <div class="item-badge badge-category">${item.category}</div>
                        ${hasNotes ? `<button class="btn-notes" onclick="event.stopPropagation(); app.showNotes('${item.id}')" title="Notizen anzeigen">📝</button>` : ''}
                    </div>
                </div>
                <div class="item-stock">
                    <span class="stock-value">${item.stock}</span>
                    <span class="stock-unit">${item.unit}</span>
                </div>
                <div class="stock-bar">
                    <div class="stock-fill ${stockFillClass}" style="width: ${stockPercentage}%"></div>
                </div>
                <div class="item-footer">
                    <span>${item.location || 'Kein Lagerort'}</span>
                    <span>${(item.stock * (item.price || 0)).toFixed(2)}€</span>
                </div>
            </div>
        `;
    }

    getStockPercentage(item) {
        if (!item.max || item.max === 0) return 100;
        return Math.min(100, (item.stock / item.max) * 100);
    }

    getStockClass(item) {
        if (item.stock === 0) return 'out-of-stock';
        if (this.isLowStock(item)) return 'low-stock';
        return '';
    }

    isLowStock(item) {
        if (!item.min) return false;
        return item.stock <= item.min;
    }

    showAddItem() {
        this.editingItem = null;
        document.getElementById('modalTitle').textContent = 'Artikel hinzufügen';
        document.getElementById('itemForm').reset();
        document.getElementById('itemId').value = '';
        document.getElementById('photoPreview').innerHTML = '';
        this.updateCategorySelects();
        document.getElementById('itemModal').classList.add('active');
    }

    async editItem(itemId) {
        try {
            this.editingItem = await this.db.getById(itemId);
            if (!this.editingItem) {
                this.showToast('Artikel nicht gefunden', 'error');
                return;
            }

            this.updateCategorySelects();
            
            document.getElementById('modalTitle').textContent = 'Artikel bearbeiten';
            document.getElementById('itemId').value = this.editingItem.id;
            document.getElementById('itemName').value = this.editingItem.name;
            document.getElementById('itemSKU').value = this.editingItem.sku || '';
            document.getElementById('itemCategory').value = this.editingItem.category;
            document.getElementById('itemStock').value = this.editingItem.stock;
            document.getElementById('itemUnit').value = this.editingItem.unit;
            document.getElementById('itemMin').value = this.editingItem.min || '';
            document.getElementById('itemMax').value = this.editingItem.max || '';
            document.getElementById('itemPrice').value = this.editingItem.price || '';
            document.getElementById('itemLocation').value = this.editingItem.location || '';
            document.getElementById('itemNotes').value = this.editingItem.notes || '';

            if (this.editingItem.photo) {
                document.getElementById('photoPreview').innerHTML = 
                    `<img src="${this.editingItem.photo}" alt="Artikelfoto">`;
            }

            document.getElementById('itemModal').classList.add('active');
        } catch (error) {
            console.error('Error loading item:', error);
            this.showToast('Fehler beim Laden des Artikels', 'error');
        }
    }

    async saveItem() {
        try {
            const itemData = {
                id: document.getElementById('itemId').value || this.generateId(),
                name: document.getElementById('itemName').value,
                sku: document.getElementById('itemSKU').value,
                category: document.getElementById('itemCategory').value,
                stock: parseFloat(document.getElementById('itemStock').value),
                unit: document.getElementById('itemUnit').value,
                min: parseFloat(document.getElementById('itemMin').value) || 0,
                max: parseFloat(document.getElementById('itemMax').value) || 0,
                price: parseFloat(document.getElementById('itemPrice').value) || 0,
                location: document.getElementById('itemLocation').value,
                notes: document.getElementById('itemNotes').value,
                photo: this.editingItem?.photo || '',
                createdAt: this.editingItem?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (this.editingItem) {
                await this.db.update(itemData);
                this.showToast('Artikel aktualisiert', 'success');
            } else {
                await this.db.add(itemData);
                this.showToast('Artikel hinzugefügt', 'success');
            }

            await this.loadItems();
            this.closeModal();
            this.updateUI();
        } catch (error) {
            console.error('Error saving item:', error);
            this.showToast('Fehler beim Speichern', 'error');
        }
    }

    async deleteItem(itemId) {
        if (!confirm('Artikel wirklich löschen?')) return;

        try {
            await this.db.delete(itemId);
            await this.loadItems();
            this.showToast('Artikel gelöscht', 'success');
            this.updateUI();
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showToast('Fehler beim Löschen', 'error');
        }
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const photoData = e.target.result;
            if (this.editingItem) {
                this.editingItem.photo = photoData;
            }
            document.getElementById('photoPreview').innerHTML = 
                `<img src="${photoData}" alt="Artikelfoto">`;
        };
        reader.readAsDataURL(file);
    }

    async exportData() {
        try {
            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                categories: this.categories,
                items: this.items
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `efsin-inventur-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            // Speichere Backup-Zeitstempel
            localStorage.setItem(APP_CONFIG.LAST_BACKUP_KEY, new Date().toISOString());

            this.showToast('Backup erfolgreich erstellt! 💾', 'success');
            this.closeMenu();
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Fehler beim Export', 'error');
        }
    }

    checkBackupReminder() {
        // Nur erinnern wenn Artikel vorhanden
        if (this.items.length === 0) return;

        const lastBackup = localStorage.getItem(APP_CONFIG.LAST_BACKUP_KEY);
        const now = new Date();
        
        if (!lastBackup) {
            // Noch nie Backup gemacht
            if (this.items.length >= 5) {
                setTimeout(() => {
                    this.showBackupReminder('Du hast noch kein Backup erstellt!');
                }, 3000);
            }
            return;
        }

        const lastBackupDate = new Date(lastBackup);
        const daysSinceBackup = Math.floor((now - lastBackupDate) / (1000 * 60 * 60 * 24));

        if (daysSinceBackup >= APP_CONFIG.BACKUP_REMINDER_DAYS) {
            setTimeout(() => {
                this.showBackupReminder(`Letztes Backup vor ${daysSinceBackup} Tagen!`);
            }, 3000);
        }
    }

    showBackupReminder(message) {
        const reminder = confirm(
            `⚠️ BACKUP EMPFOHLEN\n\n${message}\n\n` +
            `Du hast ${this.items.length} Artikel gespeichert.\n\n` +
            `WICHTIG: Wenn Browser-Daten gelöscht werden,\n` +
            `sind alle Artikel verloren!\n\n` +
            `Jetzt Backup erstellen?`
        );

        if (reminder) {
            this.exportData();
        }
    }

    // ===================================
    // GitHub Sync Functions
    // ===================================

    initGitHubSync() {
        this.updateSyncStatus();
        
        if (this.github.isConfigured()) {
            // Hole aktuellen SHA von GitHub (silent)
            this.refreshGitHubSHA();
            
            // Starte Auto-Sync
            this.github.startAutoSync(() => this.autoSync());
            this.showToast('GitHub Auto-Sync aktiviert (alle 5 Min)', 'success');
        } else {
            // Zeige Setup-Hinweis wenn nicht konfiguriert
            setTimeout(() => {
                const setup = confirm(
                    '🔄 GITHUB SYNC VERFÜGBAR\n\n' +
                    'Möchtest du GitHub Auto-Sync einrichten?\n\n' +
                    'Vorteile:\n' +
                    '✓ Automatische Backups alle 5 Min\n' +
                    '✓ Sync zwischen mehreren Geräten\n' +
                    '✓ Sicher in privatem Repository\n\n' +
                    'Jetzt einrichten?'
                );
                
                if (setup) {
                    this.showGitHubSetup();
                }
            }, 5000);
        }
    }

    async refreshGitHubSHA() {
        try {
            // Hole nur SHA, ohne zu syncen
            const response = await fetch(
                `https://api.github.com/repos/${this.github.owner}/${this.github.repo}/contents/${GITHUB_CONFIG.FILE_PATH}`,
                {
                    headers: {
                        'Authorization': `token ${this.github.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                this.github.lastSHA = data.sha;
                localStorage.setItem(GITHUB_CONFIG.LAST_SHA_KEY, data.sha);
                console.log('GitHub SHA aktualisiert:', data.sha.substring(0, 7));
            }
        } catch (error) {
            console.log('SHA Refresh Fehler (ignoriert):', error.message);
        }
    }

    showGitHubSetup() {
        document.getElementById('githubSetupModal').classList.add('active');
    }

    closeGitHubSetup() {
        document.getElementById('githubSetupModal').classList.remove('active');
    }

    async saveGitHubConfig() {
        const token = document.getElementById('githubToken').value.trim();
        const owner = document.getElementById('githubOwner').value.trim();
        const repo = document.getElementById('githubRepo').value.trim();

        if (!token || !owner || !repo) {
            this.showToast('Bitte alle Felder ausfüllen', 'error');
            return;
        }

        // Test der Verbindung
        this.showToast('Teste GitHub Verbindung...', 'info');

        try {
            this.github.configure(token, owner, repo);
            
            // Test API Call
            const testUrl = `https://api.github.com/repos/${owner}/${repo}`;
            const response = await fetch(testUrl, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error('Repository nicht gefunden oder kein Zugriff');
            }

            const repoData = await response.json();
            
            if (!repoData.private) {
                const warning = confirm(
                    '⚠️ WARNUNG: Repository ist ÖFFENTLICH!\n\n' +
                    'Deine Daten würden öffentlich sichtbar sein.\n\n' +
                    'Bitte erstelle ein PRIVATES Repository!\n\n' +
                    'Trotzdem fortfahren? (NICHT EMPFOHLEN!)'
                );
                
                if (!warning) {
                    this.github.configure('', '', '');
                    return;
                }
            }

            this.showToast('GitHub erfolgreich verbunden! ✅', 'success');
            this.closeGitHubSetup();
            
            // Starte Auto-Sync
            this.github.startAutoSync(() => this.autoSync());
            this.updateSyncStatus();
            
            // Initiale Synchronisation
            setTimeout(() => this.syncWithGitHub(), 1000);

        } catch (error) {
            console.error('GitHub Setup Fehler:', error);
            this.showToast(`Fehler: ${error.message}`, 'error');
            this.github.configure('', '', '');
        }
    }

    async syncWithGitHub() {
        if (!this.github.isConfigured()) {
            this.showGitHubSetup();
            return;
        }

        if (this.github.isSyncing) {
            this.showToast('Sync läuft bereits...', 'info');
            return;
        }

        this.updateSyncStatus('syncing');

        try {
            const localData = {
                version: '1.4.0',
                exportDate: new Date().toISOString(),
                categories: this.categories,
                items: this.items
            };

            const result = await this.github.sync(localData, (remote, local) => 
                this.handleSyncConflict(remote, local)
            );

            if (result.action === 'downloaded' && result.data) {
                // Remote Daten übernehmen
                await this.importFromGitHub(result.data);
            }

            this.showToast(result.message, 'success');
            this.updateSyncStatus();

        } catch (error) {
            console.error('Sync Fehler:', error);
            this.showToast(`Sync Fehler: ${error.message}`, 'error');
            this.updateSyncStatus();
        }
    }

    async autoSync() {
        if (!this.github.isConfigured() || this.items.length === 0) {
            return;
        }

        console.log('Auto-Sync wird ausgeführt...');
        await this.syncWithGitHub();
    }

    async handleSyncConflict(remoteData, localData) {
        const remoteTime = new Date(remoteData.exportDate);
        const localTime = this.github.getLatestTimestamp(localData);

        const choice = confirm(
            '⚠️ SYNC-KONFLIKT ERKANNT\n\n' +
            `Remote (GitHub): ${remoteTime.toLocaleString()}\n` +
            `Lokal (Gerät): ${new Date(localTime).toLocaleString()}\n\n` +
            'Welche Version möchtest du behalten?\n\n' +
            'OK = Remote (GitHub)\n' +
            'Abbrechen = Lokal (dieses Gerät)'
        );

        return choice ? 'remote' : 'local';
    }

    async importFromGitHub(data) {
        // Kategorien importieren
        if (data.categories) {
            this.categories = data.categories;
            this.saveCategories();
            this.updateCategorySelects();
        }

        // Artikel importieren
        if (data.items && data.items.length > 0) {
            for (const item of data.items) {
                const existing = await this.db.getById(item.id);
                if (existing) {
                    await this.db.update(item);
                } else {
                    await this.db.add(item);
                }
            }
            
            await this.loadItems();
            this.updateUI();
        }
    }

    updateSyncStatus(status = 'idle') {
        const syncBtn = document.getElementById('syncBtn');
        if (!syncBtn) return;

        const icon = syncBtn.querySelector('.sync-icon');
        const text = syncBtn.querySelector('.sync-text');

        if (status === 'syncing') {
            icon.textContent = '🔄';
            icon.classList.add('spinning');
            if (text) text.textContent = 'Sync...';
        } else {
            icon.textContent = '🔄';
            icon.classList.remove('spinning');
            
            if (this.github.isConfigured()) {
                const lastSync = this.github.getLastSyncTime();
                if (text) text.textContent = lastSync || 'Sync';
            } else {
                if (text) text.textContent = 'Setup';
            }
        }
    }

    showImport() {
        document.getElementById('importModal').classList.add('active');
    }

    closeImport() {
        document.getElementById('importModal').classList.remove('active');
    }

    async importData() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('Keine Datei ausgewählt', 'error');
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.items || !Array.isArray(data.items)) {
                throw new Error('Ungültiges Format');
            }

            // Import items
            for (const item of data.items) {
                await this.db.update(item);
            }

            await this.loadItems();
            this.closeImport();
            this.showToast(`${data.items.length} Artikel importiert`, 'success');
            this.updateUI();
        } catch (error) {
            console.error('Import error:', error);
            this.showToast('Fehler beim Import', 'error');
        }
    }

    async clearAllData() {
        if (!confirm('Wirklich ALLE Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
            return;
        }

        try {
            await this.db.clear();
            await this.loadItems();
            this.showToast('Alle Daten gelöscht', 'success');
            this.updateUI();
            this.closeMenu();
        } catch (error) {
            console.error('Clear error:', error);
            this.showToast('Fehler beim Löschen', 'error');
        }
    }

    showMenu() {
        document.getElementById('menuModal').classList.add('active');
    }

    closeMenu() {
        document.getElementById('menuModal').classList.remove('active');
    }

    closeModal() {
        document.getElementById('itemModal').classList.remove('active');
        this.editingItem = null;
    }

    showScanner() {
        this.switchView('scan');
    }

    async syncData() {
        // Placeholder for sync functionality
        this.showToast('Synchronisation gestartet...', 'success');
        
        // In production: sync with server
        setTimeout(() => {
            this.showToast('Synchronisation abgeschlossen', 'success');
        }, 1500);
    }

    renderStats() {
        // Warning levels
        const critical = this.items.filter(item => item.stock === 0).length;
        const low = this.items.filter(item => this.isLowStock(item) && item.stock > 0).length;
        const ok = this.items.filter(item => !this.isLowStock(item) && item.stock > 0).length;

        document.getElementById('criticalCount').textContent = critical;
        document.getElementById('lowCount').textContent = low;
        document.getElementById('okCount').textContent = ok;

        // Top items by value
        const topItems = [...this.items]
            .map(item => ({
                ...item,
                totalValue: item.stock * (item.price || 0)
            }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 10);

        const topHTML = topItems.map(item => `
            <div class="inventory-item" onclick="app.editItem('${item.id}')">
                <div class="item-header">
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div class="item-sku">${item.category}</div>
                    </div>
                </div>
                <div class="item-footer">
                    <span>${item.stock} ${item.unit}</span>
                    <span><strong>${item.totalValue.toFixed(2)}€</strong></span>
                </div>
            </div>
        `).join('');

        document.getElementById('topItems').innerHTML = topHTML || '<p class="hint">Keine Daten</p>';
    }

    showAbout() {
        alert('ef-sin Inventur v1.3.0\n\nInventur-App für ef-sin Schreinerei\nMünchen / Unterhaching\n\n© 2024 ef-sin.de');
    }

    async showNotes(itemId) {
        try {
            const item = await this.db.getById(itemId);
            if (!item) return;
            
            const notes = item.notes || 'Keine Notizen vorhanden';
            
            document.getElementById('notesTitle').textContent = `📝 Notizen: ${item.name}`;
            document.getElementById('notesContent').textContent = notes;
            document.getElementById('notesModal').classList.add('active');
        } catch (error) {
            console.error('Error showing notes:', error);
        }
    }

    closeNotes() {
        document.getElementById('notesModal').classList.remove('active');
    }

    checkOnlineStatus() {
        const isOnline = navigator.onLine;
        const statusEl = document.getElementById('offlineStatus');
        if (statusEl) {
            statusEl.textContent = isOnline ? '● Online' : '● Offline';
            statusEl.className = isOnline ? 'status-online' : 'status-offline';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    updateUI() {
        if (this.currentView === 'overview') {
            this.renderOverview();
        } else if (this.currentView === 'inventory') {
            this.renderInventory();
        } else if (this.currentView === 'stats') {
            this.renderStats();
        }
        
        // FAB nur auf bestimmten Views zeigen
        this.updateFAB();
    }

    updateFAB() {
        const fab = document.getElementById('addBtn');
        if (this.currentView === 'scan' || this.currentView === 'stats') {
            fab.classList.add('hidden-view');
        } else {
            fab.classList.remove('hidden-view');
        }
    }

    // ===================================
    // Kategorie-Verwaltung
    // ===================================
    
    loadCategories() {
        const stored = localStorage.getItem(APP_CONFIG.CATEGORIES_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error loading categories:', e);
            }
        }
        return [...APP_CONFIG.DEFAULT_CATEGORIES];
    }

    saveCategories() {
        localStorage.setItem(APP_CONFIG.CATEGORIES_KEY, JSON.stringify(this.categories));
        this.updateCategorySelects();
    }

    updateCategorySelects() {
        // Update Formular-Select
        const formSelect = document.getElementById('itemCategory');
        const currentValue = formSelect.value;
        formSelect.innerHTML = '';
        
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            formSelect.appendChild(option);
        });
        
        if (currentValue && this.categories.includes(currentValue)) {
            formSelect.value = currentValue;
        }

        // Update Filter-Select
        this.updateCategoryFilter();
    }

    manageCategories() {
        this.renderCategoryList();
        document.getElementById('categoryModal').classList.add('active');
        this.closeMenu();
    }

    closeCategoryManager() {
        document.getElementById('categoryModal').classList.remove('active');
    }

    renderCategoryList() {
        const listDiv = document.getElementById('categoryList');
        
        const html = this.categories.map(cat => {
            const usedCount = this.items.filter(item => item.category === cat).length;
            
            return `
                <div class="category-item">
                    <div class="category-info">
                        <span class="category-name">${cat}</span>
                        ${usedCount > 0 ? `<span class="category-count">(${usedCount} Artikel)</span>` : ''}
                    </div>
                    <div class="category-actions">
                        <button class="btn-edit-category" 
                                onclick="app.editCategory('${cat}')"
                                title="Bearbeiten">
                            ✏️
                        </button>
                        <button class="btn-delete-category" 
                                onclick="app.deleteCategory('${cat}')"
                                ${usedCount > 0 ? 'disabled' : ''}
                                title="${usedCount > 0 ? 'In Verwendung - kann nicht gelöscht werden' : 'Löschen'}">
                            ${usedCount > 0 ? '🔒' : '🗑️'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        listDiv.innerHTML = html || '<p class="hint">Keine Kategorien vorhanden</p>';
    }

    addCategory() {
        const input = document.getElementById('newCategory');
        const categoryName = input.value.trim();
        
        if (!categoryName) {
            this.showToast('Bitte Kategorie-Namen eingeben', 'error');
            return;
        }
        
        if (this.categories.includes(categoryName)) {
            this.showToast('Kategorie existiert bereits', 'error');
            return;
        }
        
        this.categories.push(categoryName);
        this.saveCategories();
        this.renderCategoryList();
        input.value = '';
        this.showToast(`Kategorie "${categoryName}" hinzugefügt`, 'success');
    }

    deleteCategory(categoryName) {
        // Prüfe ob in Verwendung
        const usedCount = this.items.filter(item => item.category === categoryName).length;
        if (usedCount > 0) {
            this.showToast(`Kategorie wird von ${usedCount} Artikel(n) verwendet`, 'error');
            return;
        }
        
        // Warnung wenn letzte Kategorie
        if (this.categories.length === 1) {
            this.showToast('Mindestens eine Kategorie muss vorhanden sein', 'error');
            return;
        }
        
        if (!confirm(`Kategorie "${categoryName}" wirklich löschen?`)) {
            return;
        }
        
        this.categories = this.categories.filter(cat => cat !== categoryName);
        this.saveCategories();
        this.renderCategoryList();
        this.showToast(`Kategorie "${categoryName}" gelöscht`, 'success');
    }

    editCategory(oldName) {
        const newName = prompt(`Kategorie umbenennen:\n\nAktueller Name: ${oldName}\n\nNeuer Name:`, oldName);
        
        if (!newName || newName.trim() === '') {
            return;
        }
        
        const trimmedName = newName.trim();
        
        if (trimmedName === oldName) {
            return; // Keine Änderung
        }
        
        // Prüfe ob neuer Name bereits existiert
        if (this.categories.includes(trimmedName)) {
            this.showToast('Kategorie mit diesem Namen existiert bereits', 'error');
            return;
        }
        
        // Update Kategorie in der Liste
        const index = this.categories.indexOf(oldName);
        if (index !== -1) {
            this.categories[index] = trimmedName;
        }
        
        // Update alle Artikel die diese Kategorie verwenden
        const itemsToUpdate = this.items.filter(item => item.category === oldName);
        
        if (itemsToUpdate.length > 0) {
            if (confirm(`${itemsToUpdate.length} Artikel verwenden diese Kategorie.\n\nKategorie für alle Artikel umbenennen?`)) {
                itemsToUpdate.forEach(async (item) => {
                    item.category = trimmedName;
                    item.updatedAt = new Date().toISOString();
                    await this.db.update(item);
                });
                
                // Reload items
                setTimeout(async () => {
                    await this.loadItems();
                    this.updateUI();
                }, 100);
            }
        }
        
        this.saveCategories();
        this.renderCategoryList();
        this.showToast(`Kategorie umbenannt: "${oldName}" → "${trimmedName}"`, 'success');
    }

    showCategories() {
        this.switchView('inventory');
        // Zeige alle Kategorien im Filter
    }

    showLowStock() {
        this.switchView('inventory');
        setTimeout(() => {
            // Filter auf Low-Stock Artikel setzen
            const lowStockItems = this.items.filter(item => this.isLowStock(item));
            this.renderFilteredItems(lowStockItems);
        }, 100);
    }

    renderFilteredItems(items) {
        const html = items.map(item => this.renderInventoryCard(item)).join('');
        document.getElementById('inventoryList').innerHTML = html || '<p class="hint">Keine Artikel gefunden</p>';
    }

    generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// ===================================
// Initialize App
// ===================================
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new InventoryApp();
});