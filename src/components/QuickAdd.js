// QuickAdd v2.0.0
class QuickAdd {
    constructor(app, categoryManager) {
        this.app = app;
        this.categoryManager = categoryManager;
        this.lastCategory = null;
        this.todayCount = 0;
    }

    open() {
        const modal = document.getElementById('quickAddModal');
        modal.classList.add('active');
        this.resetForm();
        if (this.lastCategory) {
            document.getElementById('quickCategory').value = this.lastCategory;
        }
        document.getElementById('quickSKU').focus();
        this.updateStats();
    }

    close() {
        document.getElementById('quickAddModal').classList.remove('active');
    }

    resetForm() {
        document.getElementById('quickSKU').value = '';
        document.getElementById('quickName').value = '';
        document.getElementById('quickStock').value = '';
        document.getElementById('quickPrice').value = '';
        document.getElementById('quickLocation').value = '';
    }

    async save() {
        const name = document.getElementById('quickName').value.trim();
        const stock = parseFloat(document.getElementById('quickStock').value);
        const categoryId = document.getElementById('quickCategory').value;
        if (!name || !stock || !categoryId) {
            this.app.showToast('Name, Anzahl und Kategorie erforderlich!', 'error');
            return;
        }
        const item = {
            id: this.app.generateId(),
            name,
            sku: document.getElementById('quickSKU').value || '',
            category: categoryId,
            stock,
            unit: 'Stück',
            min: 1,
            max: 10,
            price: parseFloat(document.getElementById('quickPrice').value) || 0,
            location: document.getElementById('quickLocation').value || '',
            notes: '',
            photo: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await this.app.db.update(item);
        this.todayCount++;
        this.lastCategory = categoryId;
        this.categoryManager.invalidateCache(categoryId);
        this.app.showToast('✅ "${name}" hinzugefügt', 'success');
        this.resetForm();
        document.getElementById('quickCategory').value = categoryId;
        document.getElementById('quickSKU').focus();
        this.updateStats();
    }

    updateStats() {
        document.getElementById('quickTodayCount').textContent = this.todayCount;
    }

    handleKeyboard(event) {
        if (event.key === 'Enter' && event.target.id !== 'quickSKU') {
            event.preventDefault();
            this.save();
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
        }
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = QuickAdd;
