// CategoryManager v2.0.0
class CategoryManager {
    constructor(db) {
        this.db = db;
        this.categories = [];
        this.categoryData = new Map();
        this.metadata = null;
    }

    async init() {
        this.categories = await this.loadCategories();
        console.log(`✅ CategoryManager: ${this.categories.length} Kategorien`);
    }

    async loadCategories() {
        const stored = localStorage.getItem('efsin_categories_v2');
        if (stored) return JSON.parse(stored);
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

    addCategory(name, icon = '📦') {
        const id = this.generateCategoryId(name);
        const category = { id, name, icon };
        this.categories.push(category);
        this.saveCategories();
        return category;
    }

    getCategoryById(id) {
        return this.categories.find(c => c.id === id);
    }

    generateCategoryId(name) {
        return name.toLowerCase()
            .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    async loadCategoryItems(categoryId) {
        if (this.categoryData.has(categoryId)) {
            return this.categoryData.get(categoryId);
        }
        const allItems = await this.db.getAll();
        const items = allItems.filter(item => item.category === categoryId);
        this.categoryData.set(categoryId, items);
        return items;
    }

    async getCategoryStats(categoryId) {
        const items = await this.loadCategoryItems(categoryId);
        return {
            itemCount: items.length,
            totalValue: items.reduce((sum, item) => sum + (item.price * item.stock || 0), 0),
            lowStock: items.filter(item => item.stock <= item.min).length,
            lastModified: items.length > 0 ? Math.max(...items.map(i => new Date(i.updatedAt).getTime())) : Date.now()
        };
    }

    invalidateCache(categoryId = null) {
        if (categoryId) this.categoryData.delete(categoryId);
        else this.categoryData.clear();
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = CategoryManager;