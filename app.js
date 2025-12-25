// ============================================================================
// ef-sin INVENTUR APP - CORE JAVASCRIPT
// Version: 2.1.6 - Mit Dashboard/Statistik Integration
// ============================================================================

(function() {
    'use strict';
    
    console.log('📦 app.js v2.1.6 loading...');
    
    // ========================================================================
    // DATENBANK (IndexedDB)
    // ========================================================================
    
    let db;
    const DB_NAME = 'InventurDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'items';
    
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                console.log('✅ Database initialized');
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                db = event.target.result;
                
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    objectStore.createIndex('category', 'category', { unique: false });
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                    
                    console.log('✅ Object store created');
                }
            };
        });
    }
    
    // ========================================================================
    // DASHBOARD/STATISTIK UPDATE TRIGGER
    // ========================================================================
    
    function triggerUpdates() {
        console.log('🔄 Triggering Dashboard & Statistics update...');
        
        // Warte kurz bis DOM bereit ist
        setTimeout(() => {
            if (typeof updateDashboard === 'function') {
                updateDashboard();
                console.log('✅ Dashboard updated');
            }
            
            if (typeof updateStatistics === 'function') {
                updateStatistics();
                console.log('✅ Statistics updated');
            }
        }, 300);
    }
    
    // ========================================================================
    // APP OBJEKT
    // ========================================================================
    
    window.app = {
        items: [],
        categories: [],
        currentCategory: 'Alle',
        
        // ====================================================================
        // INITIALISIERUNG
        // ====================================================================
        
        async init() {
            console.log('🚀 Initializing app...');
            
            try {
                await initDB();
                await this.loadItems();
                this.loadCategories();
                this.renderItems();
                
                // Initial Dashboard/Statistik Update
                triggerUpdates();
                
                console.log('✅ App initialized successfully');
            } catch (error) {
                console.error('❌ Initialization error:', error);
            }
        },
        
        // ====================================================================
        // KATEGORIEN
        // ====================================================================
        
        loadCategories() {
            console.log('📁 Loading categories...');
            // Kategorien werden von index.html aus localStorage geladen
            // Dieser Code wird von index.html überschrieben
        },
        
        // ====================================================================
        // ITEMS LADEN
        // ====================================================================
        
        async loadItems() {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.getAll();
                
                request.onsuccess = () => {
                    this.items = request.result || [];
                    console.log(`✅ Loaded ${this.items.length} items`);
                    resolve(this.items);
                };
                
                request.onerror = () => reject(request.error);
            });
        },
        
        // ====================================================================
        // ITEMS RENDERN
        // ====================================================================
        
        renderItems() {
            const container = document.getElementById('itemsContainer');
            if (!container) return;
            
            // Filter nach Kategorie
            let filtered = this.currentCategory === 'Alle' 
                ? this.items 
                : this.items.filter(item => item.category === this.currentCategory);
            
            // Sortieren nach updatedAt
            filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <div class="empty-state-text">Keine Artikel in dieser Kategorie</div>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = filtered.map(item => this.renderItemCard(item)).join('');
            
            console.log(`✅ Rendered ${filtered.length} items`);
            
            // ⭐ UPDATE DASHBOARD/STATISTIK NACH RENDER
            triggerUpdates();
        },
        
        renderItemCard(item) {
            const stockClass = item.min && parseInt(item.stock) <= parseInt(item.min) 
                ? 'low-stock' 
                : '';
            
            return `
                <div class="item-card ${stockClass}" onclick="app.editItem(${item.id})">
                    ${item.photo ? `<img src="${item.photo}" alt="${item.name}" style="max-width: 100px; border-radius: 8px;">` : ''}
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-details">
                            ${item.category} • ${item.location || 'Kein Standort'}
                        </div>
                        ${item.sku ? `<div class="item-sku">SKU: ${item.sku}</div>` : ''}
                    </div>
                    <div class="item-actions">
                        <div class="item-stock">${item.stock} ${item.unit || 'Stk'}</div>
                        <button class="btn-icon" onclick="event.stopPropagation(); app.deleteItem(${item.id})">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        },
        
        // ====================================================================
        // ITEM SPEICHERN
        // ====================================================================
        
        saveItem() {
            const id = document.getElementById('itemId').value;
            const category = document.getElementById('itemCategory').value;
            const name = document.getElementById('itemName').value;
            const sku = document.getElementById('itemSKU').value;
            const stock = document.getElementById('itemStock').value;
            const unit = document.getElementById('itemUnit').value;
            const min = document.getElementById('itemMin').value;
            const max = document.getElementById('itemMax').value;
            const price = document.getElementById('itemPrice').value;
            const location = document.getElementById('itemLocation').value;
            const notes = document.getElementById('itemNotes').value;
            const photoInput = document.getElementById('itemPhoto');
            
            if (!name || !stock) {
                alert('Bitte Name und Bestand ausfüllen!');
                return;
            }
            
            const item = {
                category,
                name,
                sku,
                stock: parseFloat(stock),
                unit,
                min: min ? parseFloat(min) : null,
                max: max ? parseFloat(max) : null,
                price: price ? parseFloat(price) : null,
                location,
                notes,
                updatedAt: new Date().toISOString()
            };
            
            // Foto verarbeiten
            if (photoInput.files && photoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    item.photo = e.target.result;
                    this.saveItemToDB(item, id);
                };
                reader.readAsDataURL(photoInput.files[0]);
            } else {
                // Bestehendes Foto beibehalten wenn vorhanden
                if (id) {
                    const existingItem = this.items.find(i => i.id === parseInt(id));
                    if (existingItem && existingItem.photo) {
                        item.photo = existingItem.photo;
                    }
                }
                this.saveItemToDB(item, id);
            }
        },
        
        saveItemToDB(item, id) {
            console.log('💾 Saving item to database...');
            
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            
            let request;
            if (id) {
                item.id = parseInt(id);
                request = objectStore.put(item);
            } else {
                request = objectStore.add(item);
            }
            
            request.onsuccess = async () => {
                console.log('✅ Item saved successfully');
                await this.loadItems();
                this.renderItems();
                this.closeModal('itemModal');
                this.clearForm();
                
                // ⭐ UPDATE DASHBOARD/STATISTIK NACH SPEICHERN
                triggerUpdates();
            };
            
            request.onerror = () => {
                console.error('❌ Error saving item:', request.error);
                alert('Fehler beim Speichern!');
            };
        },
        
        // ====================================================================
        // ITEM BEARBEITEN
        // ====================================================================
        
        editItem(id) {
            const item = this.items.find(i => i.id === id);
            if (!item) return;
            
            document.getElementById('itemId').value = item.id;
            document.getElementById('itemCategory').value = item.category;
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemSKU').value = item.sku || '';
            document.getElementById('itemStock').value = item.stock;
            document.getElementById('itemUnit').value = item.unit || 'Stück';
            document.getElementById('itemMin').value = item.min || '';
            document.getElementById('itemMax').value = item.max || '';
            document.getElementById('itemPrice').value = item.price || '';
            document.getElementById('itemLocation').value = item.location || '';
            document.getElementById('itemNotes').value = item.notes || '';
            
            if (item.photo) {
                const preview = document.getElementById('photoPreview');
                preview.innerHTML = `<img src="${item.photo}" style="max-width: 200px; border-radius: 8px;">`;
            }
            
            this.openModal('itemModal');
        },
        
        // ====================================================================
        // ITEM LÖSCHEN
        // ====================================================================
        
        deleteItem(id) {
            if (!confirm('Artikel wirklich löschen?')) return;
            
            console.log('🗑️ Deleting item...');
            
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.delete(id);
            
            request.onsuccess = async () => {
                console.log('✅ Item deleted successfully');
                await this.loadItems();
                this.renderItems();
                
                // ⭐ UPDATE DASHBOARD/STATISTIK NACH LÖSCHEN
                triggerUpdates();
            };
            
            request.onerror = () => {
                console.error('❌ Error deleting item:', request.error);
                alert('Fehler beim Löschen!');
            };
        },
        
        // ====================================================================
        // MODAL FUNKTIONEN
        // ====================================================================
        
        openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
            }
        },
        
        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
            }
        },
        
        clearForm() {
            document.getElementById('itemId').value = '';
            document.getElementById('itemName').value = '';
            document.getElementById('itemSKU').value = '';
            document.getElementById('itemStock').value = '';
            document.getElementById('itemMin').value = '';
            document.getElementById('itemMax').value = '';
            document.getElementById('itemPrice').value = '';
            document.getElementById('itemLocation').value = '';
            document.getElementById('itemNotes').value = '';
            document.getElementById('itemPhoto').value = '';
            document.getElementById('photoPreview').innerHTML = '';
        }
    };
    
    // ========================================================================
    // AUTO-INIT
    // ========================================================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.app.init());
    } else {
        window.app.init();
    }
    
    console.log('✅ app.js v2.1.6 loaded');
    
})();
