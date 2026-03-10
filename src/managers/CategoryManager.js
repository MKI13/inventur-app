// =============================================================================
// CategoryManager v2.1.0 - VOLLSTÄNDIG mit Export/Import (IndexedDB Fix)
// =============================================================================

class CategoryManager {
    constructor(db) {
        this.db = db;
        this.categories = [];
        this.categoryData = new Map(); // Map<categoryId, items[]>
        this.metadata = null;
    }

    // -------------------------------------------------------------------------
    // Initialisierung
    // -------------------------------------------------------------------------

    async init() {
        this.categories = await this.loadCategories();
        console.log(`✅ CategoryManager v2.1.0: ${this.categories.length} Kategorien geladen`);
    }

    async loadCategories() {
        const stored = localStorage.getItem('efsin_categories_v2');
        if (stored) {
            return JSON.parse(stored);
        }

        // Default Kategorien
        return [
            { id: 'holz', name: 'Holz', icon: '🪵' },
            { id: 'platten', name: 'Platten', icon: '📋' },
            { id: 'beschlaege', name: 'Beschläge', icon: '🔩' },
            { id: 'werkzeuge', name: 'Werkzeuge', icon: '🔨' },
            { id: 'lacke', name: 'Lacke', icon: '🎨' },
            { id: 'schrauben', name: 'Schrauben', icon: '⚙️' },
            { id: 'sonstiges', name: 'Sonstiges', icon: '📦' }
        ];
    }

    saveCategories() {
        localStorage.setItem('efsin_categories_v2', JSON.stringify(this.categories));
    }

    // -------------------------------------------------------------------------
    // Kategorie CRUD
    // -------------------------------------------------------------------------

    addCategory(name, icon = '📦') {
        const id = this.generateCategoryId(name);
        const category = { id, name, icon };
        this.categories.push(category);
        this.saveCategories();
        return category;
    }

    updateCategory(id, updates) {
        const index = this.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...updates };
            this.saveCategories();
            return this.categories[index];
        }
        return null;
    }

    deleteCategory(id) {
        this.categories = this.categories.filter(c => c.id !== id);
        this.saveCategories();
    }

    getCategoryById(id) {
        return this.categories.find(c => c.id === id);
    }

    generateCategoryId(name) {
        return name.toLowerCase()
            .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // -------------------------------------------------------------------------
    // Items pro Kategorie laden (KORRIGIERTE IndexedDB Methoden)
    // -------------------------------------------------------------------------

    async loadCategoryItems(categoryId) {
        if (this.categoryData.has(categoryId)) {
            return this.categoryData.get(categoryId);
        }

        const allItems = await this.getAllItemsFromDB();

        // Kategorie finden (für Name-Matching)
        const category = this.getCategoryById(categoryId);

        // Items filtern: nach ID ODER nach Name (für Kompatibilität)
        const items = allItems.filter(item =>
            item.category === categoryId ||
            item.category === category?.name ||
            item.category?.toLowerCase() === categoryId
        );

        this.categoryData.set(categoryId, items);

        console.log(`📂 Kategorie "${categoryId}" (${category?.name}): ${items.length} Artikel`);
        return items;
    }

    // Korrigierte Methode: Alle Items aus IndexedDB laden
    async getAllItemsFromDB() {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['items'], 'readonly');
                const store = transaction.objectStore('items');
                const request = store.getAll();

                request.onsuccess = () => {
                    resolve(request.result || []);
                };

                request.onerror = () => {
                    console.error('❌ getAllItemsFromDB Fehler:', request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error('❌ getAllItemsFromDB Exception:', error);
                reject(error);
            }
        });
    }

    async getAllItemsByCategory() {
        const result = {};
        for (const category of this.categories) {
            result[category.id] = await this.loadCategoryItems(category.id);
        }
        return result;
    }

    // -------------------------------------------------------------------------
    // Kategorie-Statistiken
    // -------------------------------------------------------------------------

    async getCategoryStats(categoryId) {
        const items = await this.loadCategoryItems(categoryId);

        return {
            itemCount: items.length,
            totalValue: items.reduce((sum, item) => sum + ((item.price || 0) * (item.stock || 0)), 0),
            lowStock: items.filter(item => item.min && item.stock <= item.min).length,
            totalStock: items.reduce((sum, item) => sum + (item.stock || 0), 0),
            lastModified: items.length > 0
                ? Math.max(...items.map(i => new Date(i.updatedAt || 0).getTime()))
                : Date.now()
        };
    }

    async getAllStats() {
        const stats = {
            categories: [],
            totals: {
                items: 0,
                value: 0,
                lowStock: 0
            }
        };

        for (const category of this.categories) {
            const catStats = await this.getCategoryStats(category.id);
            stats.categories.push({
                id: category.id,
                name: category.name,
                ...catStats
            });

            stats.totals.items += catStats.itemCount;
            stats.totals.value += catStats.totalValue;
            stats.totals.lowStock += catStats.lowStock;
        }

        return stats;
    }

    // -------------------------------------------------------------------------
    // Export für GitHub (pro Kategorie)
    // -------------------------------------------------------------------------

    async exportCategoryJSON(categoryId) {
        // Cache invalidieren um frische Daten zu bekommen
        this.invalidateCache(categoryId);

        const items = await this.loadCategoryItems(categoryId);
        const category = this.getCategoryById(categoryId);

        return {
            category: categoryId,
            categoryName: category?.name || categoryId,
            lastModified: new Date().toISOString(),
            itemCount: items.length,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                sku: item.sku || '',
                stock: item.stock || 0,
                unit: item.unit || 'Stück',
                min: item.min || 0,
                max: item.max || 0,
                price: item.price || 0,
                location: item.location || '',
                notes: item.notes || '',
                photo: item.photo ? `images/${categoryId}/${item.id}.jpg` : '',
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString()
            }))
        };
    }

    async exportIndexJSON() {
        // Cache invalidieren
        this.invalidateCache();

        const stats = await this.getAllStats();

        return {
            version: '2.1.0',
            lastUpdated: new Date().toISOString(),
            categories: stats.categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                file: `categories/${cat.id}.json`,
                itemCount: cat.itemCount,
                totalValue: cat.totalValue,
                lowStock: cat.lowStock,
                lastModified: new Date(cat.lastModified).toISOString()
            })),
            statistics: {
                totalItems: stats.totals.items,
                totalValue: stats.totals.value,
                lowStock: stats.totals.lowStock,
                categories: this.categories.length
            }
        };
    }

    // -------------------------------------------------------------------------
    // Import von GitHub (pro Kategorie) - KORRIGIERT
    // -------------------------------------------------------------------------

    async importCategoryJSON(categoryId, data) {
        if (data.category !== categoryId) {
            throw new Error(`Category mismatch: expected ${categoryId}, got ${data.category}`);
        }

        // Items in DB schreiben (korrigierte Methode)
        for (const item of data.items) {
            await this.saveItemToDB({
                ...item,
                category: categoryId
            });
        }

        // Cache aktualisieren
        this.categoryData.set(categoryId, data.items);

        console.log(`✅ Kategorie "${categoryId}" importiert: ${data.items.length} Artikel`);
    }

    // Korrigierte Methode: Item in IndexedDB speichern
    async saveItemToDB(item) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['items'], 'readwrite');
                const store = transaction.objectStore('items');

                const request = item.id ? store.put(item) : store.add(item);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('❌ saveItemToDB Fehler:', request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error('❌ saveItemToDB Exception:', error);
                reject(error);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Cache Management
    // -------------------------------------------------------------------------

    invalidateCache(categoryId = null) {
        if (categoryId) {
            this.categoryData.delete(categoryId);
        } else {
            this.categoryData.clear();
        }
        console.log(`🗑️ Cache invalidiert: ${categoryId || 'alle'}`);
    }

    async refreshCategory(categoryId) {
        this.invalidateCache(categoryId);
        return await this.loadCategoryItems(categoryId);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryManager;
}
