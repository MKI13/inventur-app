// ===================================
// App Configuration
// ===================================
const APP_CONFIG = {
    DB_NAME: 'efsinInventurDB',
    DB_VERSION: 1,
    STORE_NAME: 'inventory',
    CATEGORIES_KEY: 'efsin_categories',
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
// Main Application Class
// ===================================
class InventoryApp {
    constructor() {
        this.db = new DatabaseManager();
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

            this.showToast('Daten exportiert', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Fehler beim Export', 'error');
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
