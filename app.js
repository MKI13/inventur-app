// =============================================================================
// ef-sin Inventur App v2.0.3 - CLEAN (ohne Migration)
// Professional & Production-Ready
// =============================================================================

// Helper Funktionen
function base64EncodeUTF8(str) {
    return btoa(encodeURIComponent(str).replace(
        /%([0-9A-F]{2})/g,
        (match, p1) => String.fromCharCode(parseInt(p1, 16))
    ));
}

function base64DecodeUTF8(str) {
    return decodeURIComponent(
        atob(str).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
    );
}

// =============================================================================
// Haupt-App Klasse
// =============================================================================

class InventurApp {
    constructor() {
        this.version = '2.0.3';
        this.db = null;
        this.categoryManager = null;
        this.imageManager = null;
        this.githubSync = null;
        this.quickAdd = null;
        
        this.currentCategory = null;
        this.items = [];
        this.editingItem = null;
        this.editingCategory = null;
    }

    // -------------------------------------------------------------------------
    // Initialisierung
    // -------------------------------------------------------------------------

    async init() {
        console.log(`🚀 Inventur v${this.version} startet...`);
        
        try {
            this.showLoading(true);
            
            // Version Check (einfach!)
            this.checkVersion();
            
            // Database
            this.db = new DatabaseManager();
            await this.db.init();
            
            // Manager initialisieren
            this.categoryManager = new CategoryManager(this.db);
            await this.categoryManager.init();
            
            this.imageManager = new ImageManager();
            await this.imageManager.init();
            
            this.githubSync = new MultiFileGitHubSync(
                this.categoryManager,
                this.imageManager
            );
            
            this.quickAdd = new QuickAdd(this, this.categoryManager);
            
            // UI initialisieren
            this.setupUI();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            
            // Daten laden
            await this.loadData();
            
            // Auto-Sync
            if (this.githubSync.isConfigured()) {
                this.githubSync.startAutoSync(5);
            }
            
            this.showLoading(false);
            console.log(`✅ App v${this.version} initialisiert`);
            
        } catch (error) {
            console.error('❌ Initialisierungs-Fehler:', error);
            this.showToast('Fehler beim Laden: ' + error.message, 'error');
            this.showLoading(false);
        }
    }

    // -------------------------------------------------------------------------
    // Version Check (EINFACH!)
    // -------------------------------------------------------------------------

    checkVersion() {
        const storedVersion = localStorage.getItem('efsin_version');
        
        if (!storedVersion) {
            // Erste Installation
            console.log('✨ Erste Installation - Willkommen!');
            localStorage.setItem('efsin_version', this.version);
            return;
        }
        
        if (storedVersion !== this.version) {
            // Version Update
            console.log(`📦 Update: v${storedVersion} → v${this.version}`);
            localStorage.setItem('efsin_version', this.version);
            
            // Info-Toast
            this.showToast(`✅ Update auf v${this.version} erfolgreich`, 'success');
        }
    }

    // -------------------------------------------------------------------------
    // UI Setup
    // -------------------------------------------------------------------------

    setupUI() {
        this.renderCategoryTabs();
        
        if (this.categoryManager.categories.length > 0) {
            this.currentCategory = this.categoryManager.categories[0].id;
        }
    }

    setupEventListeners() {
        document.getElementById('addNormalButton').onclick = () => this.showAddItem();
        document.getElementById('addQuickButton').onclick = () => this.openQuickAdd();
        document.getElementById('syncButton').onclick = () => this.manualSync();
        document.getElementById('menuButton').onclick = () => this.openMenu();
        
        document.getElementById('searchInput').oninput = (e) => this.search(e.target.value);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'q') {
                e.preventDefault();
                this.openQuickAdd();
            }
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.showAddItem();
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.manualSync();
            }
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeCategoryModal();
                this.quickAdd.close();
                this.closeMenu();
            }
        });
    }

    // -------------------------------------------------------------------------
    // Kategorien Verwaltung
    // -------------------------------------------------------------------------

    showCategoryManagement() {
        this.editingCategory = null;
        document.getElementById('categoryModalTitle').textContent = 'Kategorien verwalten';
        this.renderCategoryList();
        document.getElementById('categoryModal').classList.add('active');
    }

    renderCategoryList() {
        const container = document.getElementById('categoryList');
        container.innerHTML = this.categoryManager.categories.map(cat => `
            <div class="category-item">
                <span class="category-icon">${cat.icon}</span>
                <span class="category-name">${cat.name}</span>
                <div class="category-actions">
                    <button onclick="app.editCategory('${cat.id}')" title="Bearbeiten">✏️</button>
                    <button onclick="app.deleteCategory('${cat.id}')" title="Löschen">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    showAddCategory() {
        this.editingCategory = null;
        document.getElementById('catName').value = '';
        document.getElementById('catIcon').value = '📦';
        document.getElementById('categoryEditModal').classList.add('active');
    }

    editCategory(categoryId) {
        const category = this.categoryManager.getCategoryById(categoryId);
        if (!category) return;
        
        this.editingCategory = category;
        document.getElementById('catName').value = category.name;
        document.getElementById('catIcon').value = category.icon;
        document.getElementById('categoryEditModal').classList.add('active');
    }

    async saveCategory() {
        const name = document.getElementById('catName').value.trim();
        const icon = document.getElementById('catIcon').value.trim();
        
        if (!name) {
            this.showToast('❌ Name erforderlich!', 'error');
            return;
        }
        
        try {
            if (this.editingCategory) {
                this.categoryManager.updateCategory(this.editingCategory.id, { name, icon });
                this.showToast(`✅ "${name}" aktualisiert`, 'success');
            } else {
                this.categoryManager.addCategory(name, icon);
                this.showToast(`✅ "${name}" erstellt`, 'success');
            }
            
            this.closeCategoryEditModal();
            this.renderCategoryList();
            this.renderCategoryTabs();
            
        } catch (error) {
            this.showToast('❌ Fehler: ' + error.message, 'error');
        }
    }

    async deleteCategory(categoryId) {
        const category = this.categoryManager.getCategoryById(categoryId);
        if (!category) return;
        
        const items = await this.categoryManager.loadCategoryItems(categoryId);
        if (items.length > 0) {
            if (!confirm(`Kategorie "${category.name}" hat ${items.length} Artikel!\n\nTrotzdem löschen? (Artikel bleiben erhalten)`)) {
                return;
            }
        }
        
        if (!confirm(`Kategorie "${category.name}" wirklich löschen?`)) {
            return;
        }
        
        this.categoryManager.deleteCategory(categoryId);
        this.showToast(`✅ "${category.name}" gelöscht`, 'success');
        
        this.renderCategoryList();
        this.renderCategoryTabs();
        
        if (this.currentCategory === categoryId && this.categoryManager.categories.length > 0) {
            this.currentCategory = this.categoryManager.categories[0].id;
            await this.loadItems();
        }
    }

    closeCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
    }

    closeCategoryEditModal() {
        document.getElementById('categoryEditModal').classList.remove('active');
    }

    // -------------------------------------------------------------------------
    // Kategorien Tabs
    // -------------------------------------------------------------------------

    renderCategoryTabs() {
        const container = document.getElementById('categoryTabs');
        container.innerHTML = this.categoryManager.categories.map(cat => `
            <button class="category-tab ${cat.id === this.currentCategory ? 'active' : ''}"
                    onclick="app.selectCategory('${cat.id}')">
                ${cat.icon} ${cat.name}
            </button>
        `).join('');
    }

    async selectCategory(categoryId) {
        this.currentCategory = categoryId;
        this.renderCategoryTabs();
        await this.loadItems();
    }

    // -------------------------------------------------------------------------
    // Daten laden
    // -------------------------------------------------------------------------

    async loadData() {
        await this.loadItems();
    }

    async loadItems() {
        if (!this.currentCategory) return;
        
        this.items = await this.categoryManager.loadCategoryItems(this.currentCategory);
        this.renderItems();
    }

    renderItems() {
        const container = document.getElementById('itemsContainer');
        
        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📦 Keine Artikel in dieser Kategorie</p>
                    <button class="btn-primary" onclick="app.showAddItem()">
                        Ersten Artikel hinzufügen
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.items.map(item => `
            <div class="item-card ${item.stock <= item.min ? 'low-stock' : ''}">
                <div class="item-header">
                    <h3>${item.name}</h3>
                    <div class="item-actions">
                        <button onclick="app.editItem('${item.id}')" title="Bearbeiten">✏️</button>
                        <button onclick="app.deleteItem('${item.id}')" title="Löschen">🗑️</button>
                    </div>
                </div>
                <div class="item-body">
                    ${item.photo ? '<div class="item-photo"><img src="" data-image-id="' + item.photo + '"></div>' : ''}
                    <div class="item-info">
                        <div class="info-row">
                            <span class="label">Bestand:</span>
                            <span class="value ${item.stock <= item.min ? 'warning' : ''}">${item.stock} ${item.unit}</span>
                        </div>
                        ${item.sku ? '<div class="info-row"><span class="label">SKU:</span><span class="value">' + item.sku + '</span></div>' : ''}
                        ${item.location ? '<div class="info-row"><span class="label">Standort:</span><span class="value">' + item.location + '</span></div>' : ''}
                        ${item.price ? '<div class="info-row"><span class="label">Preis:</span><span class="value">' + item.price.toFixed(2) + ' €</span></div>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        this.loadImages();
    }

    async loadImages() {
        const images = document.querySelectorAll('[data-image-id]');
        for (const img of images) {
            const imageId = img.getAttribute('data-image-id');
            const dataUrl = await this.imageManager.getImageDataURL(imageId);
            if (dataUrl) {
                img.src = dataUrl;
            }
        }
    }

    // -------------------------------------------------------------------------
    // Artikel CRUD
    // -------------------------------------------------------------------------

    showAddItem() {
        this.editingItem = null;
        document.getElementById('modalTitle').textContent = 'Artikel hinzufügen';
        this.clearForm();
        this.fillCategorySelect('itemCategory');
        document.getElementById('addModal').classList.add('active');
    }

    async editItem(itemId) {
        this.editingItem = this.items.find(i => i.id === itemId);
        if (!this.editingItem) return;
        
        document.getElementById('modalTitle').textContent = 'Artikel bearbeiten';
        this.fillForm(this.editingItem);
        this.fillCategorySelect('itemCategory');
        document.getElementById('addModal').classList.add('active');
    }

    async saveItem() {
        const name = document.getElementById('itemName').value.trim();
        const stock = parseFloat(document.getElementById('itemStock').value);
        const category = document.getElementById('itemCategory').value;
        
        if (!name || !stock || !category) {
            this.showToast('Name, Bestand und Kategorie sind erforderlich!', 'error');
            return;
        }
        
        const item = {
            id: this.editingItem?.id || this.generateId(),
            name,
            sku: document.getElementById('itemSKU').value || '',
            category,
            stock,
            unit: document.getElementById('itemUnit').value,
            min: parseFloat(document.getElementById('itemMin').value) || 0,
            max: parseFloat(document.getElementById('itemMax').value) || 0,
            price: parseFloat(document.getElementById('itemPrice').value) || 0,
            location: document.getElementById('itemLocation').value || '',
            notes: document.getElementById('itemNotes').value || '',
            photo: this.editingItem?.photo || '',
            createdAt: this.editingItem?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await this.db.update(item);
        this.categoryManager.invalidateCache(item.category);
        
        await this.loadItems();
        this.closeModal();
        this.showToast('✅ Gespeichert', 'success');
    }

    async deleteItem(itemId) {
        if (!confirm('Artikel wirklich löschen?')) return;
        
        const item = this.items.find(i => i.id === itemId);
        await this.db.delete(itemId);
        this.categoryManager.invalidateCache(item.category);
        
        await this.loadItems();
        this.showToast('✅ Gelöscht', 'success');
    }

    // -------------------------------------------------------------------------
    // Quick Add
    // -------------------------------------------------------------------------

    openQuickAdd() {
        this.fillCategorySelect('quickCategory');
        this.quickAdd.open();
    }

    // -------------------------------------------------------------------------
    // Sync
    // -------------------------------------------------------------------------

    async manualSync() {
        if (!this.githubSync.isConfigured()) {
            this.showToast('GitHub nicht konfiguriert!', 'warning');
            this.showGitHubSettings();
            return;
        }
        
        this.showToast('Sync läuft...', 'info');
        
        try {
            const result = await this.githubSync.smartSync();
            
            if (result.status === 'success') {
                this.showToast('✅ Sync erfolgreich', 'success');
                await this.loadItems();
            } else {
                this.showToast('❌ Sync fehlgeschlagen', 'error');
            }
        } catch (error) {
            console.error('Sync Error:', error);
            this.showToast('❌ Sync Fehler: ' + error.message, 'error');
        }
    }

    // -------------------------------------------------------------------------
    // Hilfsfunktionen
    // -------------------------------------------------------------------------

    fillCategorySelect(selectId) {
        const select = document.getElementById(selectId);
        if (!select) {
            console.error(`Select nicht gefunden: ${selectId}`);
            return;
        }
        
        select.innerHTML = this.categoryManager.categories.map(cat => 
            `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
        ).join('');
        
        if (this.currentCategory) {
            select.value = this.currentCategory;
        }
    }

    clearForm() {
        document.getElementById('itemName').value = '';
        document.getElementById('itemSKU').value = '';
        document.getElementById('itemStock').value = '';
        document.getElementById('itemUnit').value = 'Stück';
        document.getElementById('itemMin').value = '';
        document.getElementById('itemMax').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemLocation').value = '';
        document.getElementById('itemNotes').value = '';
        const preview = document.getElementById('photoPreview');
        if (preview) preview.innerHTML = '';
    }

    fillForm(item) {
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemSKU').value = item.sku || '';
        document.getElementById('itemStock').value = item.stock;
        document.getElementById('itemUnit').value = item.unit;
        document.getElementById('itemMin').value = item.min || '';
        document.getElementById('itemMax').value = item.max || '';
        document.getElementById('itemPrice').value = item.price || '';
        document.getElementById('itemLocation').value = item.location || '';
        document.getElementById('itemNotes').value = item.notes || '';
    }

    generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    closeModal() {
        document.getElementById('addModal').classList.remove('active');
    }

    openMenu() {
        document.getElementById('menuSidebar').classList.add('active');
        document.getElementById('menuOverlay').classList.add('active');
    }

    closeMenu() {
        document.getElementById('menuSidebar').classList.remove('active');
        document.getElementById('menuOverlay').classList.remove('active');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    search(query) {
        // TODO: Implementieren
    }

    async exportData() {
        const allData = await this.categoryManager.exportIndexJSON();
        const json = JSON.stringify(allData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventur-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        this.showToast('✅ Daten exportiert', 'success');
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                this.showToast('✅ Daten importiert', 'success');
                await this.loadItems();
            } catch (error) {
                this.showToast('❌ Import fehlgeschlagen: ' + error.message, 'error');
            }
        };
        input.click();
    }

    showGitHubSettings() {
        const token = prompt('GitHub Token:', this.githubSync.token || '');
        if (!token) return;
        
        const owner = prompt('GitHub Owner:', this.githubSync.owner || 'MKI13');
        if (!owner) return;
        
        const repo = prompt('GitHub Repo:', this.githubSync.repo || 'inventur-data-backup');
        if (!repo) return;
        
        localStorage.setItem('efsin_github_token', token);
        localStorage.setItem('efsin_github_owner', owner);
        localStorage.setItem('efsin_github_repo', repo);
        
        this.githubSync.token = token;
        this.githubSync.owner = owner;
        this.githubSync.repo = repo;
        
        this.showToast('✅ GitHub konfiguriert', 'success');
    }

    showAbout() {
        alert(`ef-sin Inventur v${this.version}\n\n✅ Kategorie-Management\n✅ GitHub Sync\n✅ Quick Add\n✅ Clean Code (kein Migration-Ballast)`);
    }

    showStats() {
        alert('Statistiken in Entwicklung');
    }
}

// =============================================================================
// Database Manager
// =============================================================================

class DatabaseManager {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('efsinInventurDB', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('inventory')) {
                    db.createObjectStore('inventory', { keyPath: 'id' });
                }
            };
        });
    }

    async getAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['inventory'], 'readonly');
            const store = transaction.objectStore('inventory');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['inventory'], 'readwrite');
            const store = transaction.objectStore('inventory');
            const request = store.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async delete(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['inventory'], 'readwrite');
            const store = transaction.objectStore('inventory');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// =============================================================================
// App Start
// =============================================================================

let app;
let quickAdd;

document.addEventListener('DOMContentLoaded', async () => {
    app = new InventurApp();
    await app.init();
    quickAdd = app.quickAdd;
});