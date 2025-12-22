// =============================================================================
// QuickAdd v2.0.0 - GEFIXT
// =============================================================================

class QuickAdd {
    constructor(app, categoryManager) {
        this.app = app;
        this.categoryManager = categoryManager;
        this.lastCategory = null;
        this.todayCount = 0;
        this.templates = new Map();
        this.barcodeDB = new Map();
    }

    // -------------------------------------------------------------------------
    // Modal öffnen - GEFIXT!
    // -------------------------------------------------------------------------

    open() {
        console.log('⚡ Quick Add öffnet...');
        
        // Modal anzeigen
        const modal = document.getElementById('quickAddModal');
        modal.classList.add('active');
        
        // Form zurücksetzen
        this.resetForm();
        
        // Kategorie vorauswählen (wenn vorhanden)
        if (this.lastCategory) {
            const select = document.getElementById('quickCategory');
            if (select && select.options.length > 0) {
                select.value = this.lastCategory;
            }
        }
        
        // Focus auf SKU-Feld
        setTimeout(() => {
            document.getElementById('quickSKU').focus();
        }, 100);
        
        // Statistik aktualisieren
        this.updateStats();
        
        console.log('✅ Quick Add geöffnet');
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

    // -------------------------------------------------------------------------
    // Defaults laden
    // -------------------------------------------------------------------------

    async getDefaults(categoryId) {
        if (this.templates.has(categoryId)) {
            return this.templates.get(categoryId);
        }

        const items = await this.categoryManager.loadCategoryItems(categoryId);
        
        if (items.length === 0) {
            return {
                unit: 'Stück',
                min: 1,
                max: 10,
                location: ''
            };
        }

        // Letztes Item als Vorlage
        const lastItem = items[items.length - 1];
        const defaults = {
            unit: lastItem.unit,
            min: lastItem.min,
            max: lastItem.max,
            location: lastItem.location
        };

        this.templates.set(categoryId, defaults);
        return defaults;
    }

    // -------------------------------------------------------------------------
    // Speichern - GEFIXT!
    // -------------------------------------------------------------------------

    async save() {
        const name = document.getElementById('quickName').value.trim();
        const stock = parseFloat(document.getElementById('quickStock').value);
        const categoryId = document.getElementById('quickCategory').value;
        
        // Validierung
        if (!name) {
            this.app.showToast('❌ Name erforderlich!', 'error');
            document.getElementById('quickName').focus();
            return;
        }
        
        if (!stock || stock <= 0) {
            this.app.showToast('❌ Anzahl erforderlich!', 'error');
            document.getElementById('quickStock').focus();
            return;
        }
        
        if (!categoryId) {
            this.app.showToast('❌ Kategorie erforderlich!', 'error');
            return;
        }
        
        try {
            // Defaults holen
            const defaults = await this.getDefaults(categoryId);
            
            // Item erstellen
            const item = {
                id: this.app.generateId(),
                name,
                sku: document.getElementById('quickSKU').value || '',
                category: categoryId,
                stock,
                unit: defaults.unit,
                min: defaults.min,
                max: defaults.max,
                price: parseFloat(document.getElementById('quickPrice').value) || 0,
                location: document.getElementById('quickLocation').value || defaults.location,
                notes: '',
                photo: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // In DB speichern
            await this.app.db.update(item);
            
            // Cache invalidieren
            this.categoryManager.invalidateCache(categoryId);
            
            // Statistik erhöhen
            this.todayCount++;
            this.lastCategory = categoryId;
            
            // Toast
            this.app.showToast(`✅ "${name}" hinzugefügt`, 'success');
            
            // Form zurücksetzen für nächsten Artikel
            this.resetForm();
            
            // Kategorie beibehalten
            document.getElementById('quickCategory').value = categoryId;
            
            // Focus auf SKU für nächste Eingabe
            document.getElementById('quickSKU').focus();
            
            // Stats aktualisieren
            this.updateStats();
            
            // Items neu laden wenn in gleicher Kategorie
            if (this.app.currentCategory === categoryId) {
                await this.app.loadItems();
            }
            
        } catch (error) {
            console.error('❌ Quick Add Fehler:', error);
            this.app.showToast('❌ Fehler beim Speichern: ' + error.message, 'error');
        }
    }

    // -------------------------------------------------------------------------
    // Statistik
    // -------------------------------------------------------------------------

    updateStats() {
        const counter = document.getElementById('quickTodayCount');
        if (counter) {
            counter.textContent = this.todayCount;
        }
    }

    // -------------------------------------------------------------------------
    // Barcode Scanner (für später)
    // -------------------------------------------------------------------------

    async scanBarcode() {
        this.app.showToast('Barcode-Scanner in Entwicklung', 'info');
    }

    async lookupBarcode(sku) {
        // Interne Datenbank
        if (this.barcodeDB.has(sku)) {
            return this.barcodeDB.get(sku);
        }
        
        // Alle Items durchsuchen
        const allItems = await this.app.db.getAll();
        const existing = allItems.find(item => item.sku === sku);
        
        if (existing) {
            return {
                name: existing.name,
                price: existing.price,
                category: existing.category
            };
        }
        
        return null;
    }

    // -------------------------------------------------------------------------
    // Keyboard Handler
    // -------------------------------------------------------------------------

    handleKeyboard(event) {
        // ENTER = Speichern
        if (event.key === 'Enter') {
            event.preventDefault();
            this.save();
        }
        
        // ESC = Schließen
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
        }
        
        // STRG+B = Barcode
        if (event.ctrlKey && event.key === 'b') {
            event.preventDefault();
            this.scanBarcode();
        }
    }
}

// Keyboard Events registrieren
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('quickAddModal');
    if (modal) {
        modal.addEventListener('keydown', (e) => {
            if (window.quickAdd) {
                window.quickAdd.handleKeyboard(e);
            }
        });
    }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickAdd;
}