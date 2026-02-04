// =============================================================================
// MultiFileGitHubSync v2.3.0 - VOLLSTÄNDIG mit GitHub API + Merge Sync
// =============================================================================

// UTF-8 Helper Funktionen
async function base64EncodeUTF8(str) {
    return new Promise((resolve) => {
        const blob = new Blob([str], { type: "text/plain;charset=utf-8" });
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(",")[1];
            resolve(base64);
        };
        reader.readAsDataURL(blob);
    });
}

async function base64DecodeUTF8(base64) {
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

class MultiFileGitHubSync {
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
        if (this.isSyncing) {
            console.log('⏸️ Sync läuft bereits');
            return { status: 'busy' };
        }
        
        this.isSyncing = true;
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
            // Bilder für alle Items mit Foto herunterladen
            await this.syncImagesForCategory(categoryId, remoteData);
            return { action: 'downloaded', category: categoryId };
        }
        
        // Auch bei 'none': fehlende Bilder nachladen
        await this.syncImagesForCategory(categoryId, remoteData || localData);
        return { action: 'none', category: categoryId };
    }

    async syncImagesForCategory(categoryId, categoryData) {
        if (!categoryData || !categoryData.items) return;
        
        for (const item of categoryData.items) {
            if (!item.photo) continue;
            
            const imageId = `${categoryId}/${item.id}`;
            const localImage = await this.imageManager.loadImage(imageId);
            
            if (!localImage) {
                // Bild fehlt lokal → von GitHub laden
                try {
                    await this.imageManager.downloadFromGitHub(imageId, this);
                } catch (err) {
                    console.warn(`⚠️ Bild-Sync übersprungen: ${imageId}`);
                }
            }
        }
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
            const jsonString = await base64DecodeUTF8(base64Content);
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
        const content = await base64EncodeUTF8(jsonString);
        
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

    // -------------------------------------------------------------------------
    // MERGE SYNC - Bidirektionaler Sync (ohne Datenverlust)
    // -------------------------------------------------------------------------

    async mergeSync() {
        if (this.isSyncing) {
            console.log('⏸️ Sync läuft bereits');
            return { status: 'busy' };
        }

        if (!this.isConfigured()) {
            throw new Error('GitHub nicht konfiguriert! Bitte Token, Owner und Repo in Einstellungen eintragen.');
        }

        this.isSyncing = true;
        const startTime = Date.now();

        try {
            console.log('🔄 MERGE SYNC gestartet...');

            const stats = {
                localToGitHub: 0,
                gitHubToLocal: 0,
                conflicts: 0,
                unchanged: 0,
                newCategories: 0,
                images: { uploaded: 0, downloaded: 0 }
            };

            // 1. Remote Index laden (oder null wenn nicht vorhanden)
            let remoteIndex = await this.getFile('index.json');
            const remoteCategories = remoteIndex?.categories || [];

            // 2. Alle Kategorien sammeln (lokal + remote)
            const allCategoryIds = new Set([
                ...this.categoryManager.categories.map(c => c.id),
                ...remoteCategories.map(c => c.id)
            ]);

            const categoryResults = [];

            // 3. Jede Kategorie mergen
            for (const categoryId of allCategoryIds) {
                try {
                    const result = await this.mergeCategorySync(categoryId, stats);
                    categoryResults.push(result);
                } catch (error) {
                    console.error(`❌ Merge-Fehler bei ${categoryId}:`, error);
                    categoryResults.push({
                        category: categoryId,
                        status: 'error',
                        error: error.message
                    });
                }
            }

            // 4. Index aktualisieren und hochladen
            const localIndex = await this.categoryManager.exportIndexJSON();
            await this.putFile('index.json', localIndex, 'Merge Sync: index.json aktualisiert');

            const duration = Date.now() - startTime;

            console.log(`✅ MERGE SYNC abgeschlossen in ${duration}ms`);
            console.log(`📊 Lokal→GitHub: ${stats.localToGitHub}, GitHub→Lokal: ${stats.gitHubToLocal}, Unverändert: ${stats.unchanged}`);

            return {
                status: 'success',
                action: 'merge',
                duration,
                stats,
                categories: categoryResults
            };

        } catch (error) {
            console.error('❌ Merge Sync Fehler:', error);
            return { status: 'error', error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }

    async mergeCategorySync(categoryId, stats) {
        console.log(`🔀 Merging category: ${categoryId}...`);

        // Lokale Daten laden
        const localData = await this.categoryManager.exportCategoryJSON(categoryId);
        const localItems = localData?.items || [];

        // Remote Daten laden
        const remoteData = await this.getFile(`categories/${categoryId}.json`);
        const remoteItems = remoteData?.items || [];

        // Wenn keine Remote-Daten → alles hochladen
        if (!remoteData) {
            console.log(`📤 Neue Kategorie "${categoryId}" → zu GitHub`);
            await this.putFile(
                `categories/${categoryId}.json`,
                localData,
                `Merge: Neue Kategorie ${categoryId}`
            );
            stats.newCategories++;
            stats.localToGitHub += localItems.length;

            // Bilder hochladen
            const imgCount = await this.uploadAllImagesForCategory(categoryId, localData);
            stats.images.uploaded += imgCount;

            return { category: categoryId, action: 'uploaded_new', items: localItems.length };
        }

        // Merge-Maps erstellen
        const localMap = new Map(localItems.map(item => [item.id, item]));
        const remoteMap = new Map(remoteItems.map(item => [item.id, item]));

        // Alle Item-IDs sammeln
        const allItemIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

        const mergedItems = [];
        const itemsToUpload = [];
        const itemsToDownload = [];

        for (const itemId of allItemIds) {
            const localItem = localMap.get(itemId);
            const remoteItem = remoteMap.get(itemId);

            if (localItem && !remoteItem) {
                // Nur lokal vorhanden → zu GitHub hochladen
                mergedItems.push(localItem);
                itemsToUpload.push(localItem);
                stats.localToGitHub++;
            } else if (!localItem && remoteItem) {
                // Nur remote vorhanden → lokal speichern
                mergedItems.push(remoteItem);
                itemsToDownload.push(remoteItem);
                stats.gitHubToLocal++;
            } else if (localItem && remoteItem) {
                // Beides vorhanden → neueren nehmen
                const localTime = new Date(localItem.updatedAt || 0).getTime();
                const remoteTime = new Date(remoteItem.updatedAt || 0).getTime();

                if (localTime > remoteTime) {
                    mergedItems.push(localItem);
                    itemsToUpload.push(localItem);
                    stats.localToGitHub++;
                } else if (remoteTime > localTime) {
                    mergedItems.push(remoteItem);
                    itemsToDownload.push(remoteItem);
                    stats.gitHubToLocal++;
                } else {
                    // Gleich → lokal behalten
                    mergedItems.push(localItem);
                    stats.unchanged++;
                }
            }
        }

        // Remote Items lokal speichern
        for (const item of itemsToDownload) {
            await this.saveItemToDB({
                ...item,
                category: categoryId
            });

            // Bild herunterladen falls vorhanden
            if (item.photo) {
                try {
                    const imageId = `${categoryId}/${item.id}`;
                    await this.imageManager.downloadFromGitHub(imageId, this);
                    stats.images.downloaded++;
                } catch (e) {
                    console.warn(`⚠️ Bild-Download übersprungen: ${item.id}`);
                }
            }
        }

        // Bilder für lokale Items hochladen
        for (const item of itemsToUpload) {
            if (item.photo) {
                try {
                    const imageId = `${categoryId}/${item.id}`;
                    const blob = await this.imageManager.loadImage(imageId);
                    if (blob) {
                        await this.imageManager.uploadToGitHub(imageId, blob, this);
                        stats.images.uploaded++;
                    }
                } catch (e) {
                    console.warn(`⚠️ Bild-Upload übersprungen: ${item.id}`);
                }
            }
        }

        // Merged Daten zu GitHub hochladen
        const mergedCategoryData = {
            category: categoryId,
            categoryName: localData.categoryName || remoteData.categoryName,
            lastModified: new Date().toISOString(),
            itemCount: mergedItems.length,
            items: mergedItems
        };

        await this.putFile(
            `categories/${categoryId}.json`,
            mergedCategoryData,
            `Merge Sync: ${categoryId}`
        );

        // CategoryManager Cache aktualisieren
        this.categoryManager.categoryData.set(categoryId, mergedItems);

        console.log(`✅ ${categoryId}: ${itemsToUpload.length}↑ ${itemsToDownload.length}↓ ${stats.unchanged} unverändert`);

        return {
            category: categoryId,
            action: 'merged',
            uploaded: itemsToUpload.length,
            downloaded: itemsToDownload.length,
            total: mergedItems.length
        };
    }

    // -------------------------------------------------------------------------
    // 1:1 FULL EXPORT - Alle lokalen Daten zu GitHub hochladen
    // -------------------------------------------------------------------------

    async fullExport() {
        if (this.isSyncing) {
            console.log('⏸️ Sync läuft bereits');
            return { status: 'busy' };
        }

        if (!this.isConfigured()) {
            throw new Error('GitHub nicht konfiguriert! Bitte Token, Owner und Repo in Einstellungen eintragen.');
        }

        this.isSyncing = true;
        const startTime = Date.now();

        try {
            console.log('📤 FULL EXPORT gestartet...');

            // 1. Index hochladen
            const localIndex = await this.categoryManager.exportIndexJSON();
            await this.putFile('index.json', localIndex, 'Full Export: index.json');
            console.log('✅ index.json hochgeladen');

            // 2. Alle Kategorien hochladen
            const categoryResults = [];
            for (const category of this.categoryManager.categories) {
                try {
                    const categoryData = await this.categoryManager.exportCategoryJSON(category.id);
                    await this.putFile(
                        `categories/${category.id}.json`,
                        categoryData,
                        `Full Export: ${category.name}`
                    );
                    console.log(`✅ Kategorie "${category.id}" hochgeladen (${categoryData.itemCount} Items)`);

                    // 3. Bilder für diese Kategorie hochladen
                    const imageCount = await this.uploadAllImagesForCategory(category.id, categoryData);

                    categoryResults.push({
                        category: category.id,
                        name: category.name,
                        items: categoryData.itemCount,
                        images: imageCount,
                        status: 'uploaded'
                    });
                } catch (error) {
                    console.error(`❌ Fehler bei Kategorie ${category.id}:`, error);
                    categoryResults.push({
                        category: category.id,
                        status: 'error',
                        error: error.message
                    });
                }
            }

            const duration = Date.now() - startTime;
            const totalItems = categoryResults.reduce((sum, c) => sum + (c.items || 0), 0);
            const totalImages = categoryResults.reduce((sum, c) => sum + (c.images || 0), 0);

            console.log(`✅ FULL EXPORT abgeschlossen in ${duration}ms`);
            console.log(`📊 ${categoryResults.length} Kategorien, ${totalItems} Items, ${totalImages} Bilder`);

            return {
                status: 'success',
                action: 'export',
                duration,
                categories: categoryResults,
                totalItems,
                totalImages
            };

        } catch (error) {
            console.error('❌ Full Export Fehler:', error);
            return { status: 'error', error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }

    async uploadAllImagesForCategory(categoryId, categoryData) {
        if (!categoryData || !categoryData.items) return 0;

        let uploadedCount = 0;

        for (const item of categoryData.items) {
            if (!item.photo) continue;

            const imageId = `${categoryId}/${item.id}`;

            try {
                const localBlob = await this.imageManager.loadImage(imageId);
                if (localBlob) {
                    await this.imageManager.uploadToGitHub(imageId, localBlob, this);
                    uploadedCount++;
                    console.log(`📸 Bild hochgeladen: ${imageId}`);
                }
            } catch (error) {
                console.warn(`⚠️ Bild-Upload übersprungen: ${imageId}`, error.message);
            }
        }

        return uploadedCount;
    }

    // -------------------------------------------------------------------------
    // 1:1 FULL IMPORT - Alle Daten von GitHub herunterladen
    // -------------------------------------------------------------------------

    async fullImport() {
        if (this.isSyncing) {
            console.log('⏸️ Sync läuft bereits');
            return { status: 'busy' };
        }

        if (!this.isConfigured()) {
            throw new Error('GitHub nicht konfiguriert! Bitte Token, Owner und Repo in Einstellungen eintragen.');
        }

        this.isSyncing = true;
        const startTime = Date.now();

        try {
            console.log('📥 FULL IMPORT gestartet...');

            // 1. Index von GitHub laden
            const remoteIndex = await this.getFile('index.json');
            if (!remoteIndex) {
                throw new Error('Keine Daten im Repository gefunden! (index.json fehlt)');
            }
            console.log(`✅ index.json geladen: ${remoteIndex.categories?.length || 0} Kategorien`);

            // 2. Kategorien aus dem Index aktualisieren
            if (remoteIndex.categories && remoteIndex.categories.length > 0) {
                const newCategories = remoteIndex.categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    icon: this.categoryManager.getCategoryById(cat.id)?.icon || '📦'
                }));

                // Kategorien in localStorage speichern
                this.categoryManager.categories = newCategories;
                this.categoryManager.saveCategories();
                console.log(`✅ ${newCategories.length} Kategorien aktualisiert`);
            }

            // 3. Alle Kategorien herunterladen
            const categoryResults = [];
            for (const remoteCat of remoteIndex.categories || []) {
                try {
                    const categoryData = await this.getFile(`categories/${remoteCat.id}.json`);
                    if (categoryData) {
                        // Items importieren
                        await this.importCategoryItems(remoteCat.id, categoryData);
                        console.log(`✅ Kategorie "${remoteCat.id}" importiert: ${categoryData.itemCount} Items`);

                        // 4. Bilder herunterladen
                        const imageCount = await this.downloadAllImagesForCategory(remoteCat.id, categoryData);

                        categoryResults.push({
                            category: remoteCat.id,
                            name: remoteCat.name,
                            items: categoryData.itemCount,
                            images: imageCount,
                            status: 'imported'
                        });
                    }
                } catch (error) {
                    console.error(`❌ Fehler bei Import Kategorie ${remoteCat.id}:`, error);
                    categoryResults.push({
                        category: remoteCat.id,
                        status: 'error',
                        error: error.message
                    });
                }
            }

            const duration = Date.now() - startTime;
            const totalItems = categoryResults.reduce((sum, c) => sum + (c.items || 0), 0);
            const totalImages = categoryResults.reduce((sum, c) => sum + (c.images || 0), 0);

            console.log(`✅ FULL IMPORT abgeschlossen in ${duration}ms`);
            console.log(`📊 ${categoryResults.length} Kategorien, ${totalItems} Items, ${totalImages} Bilder`);

            // Cache invalidieren und UI aktualisieren
            this.categoryManager.invalidateCache();

            return {
                status: 'success',
                action: 'import',
                duration,
                categories: categoryResults,
                totalItems,
                totalImages
            };

        } catch (error) {
            console.error('❌ Full Import Fehler:', error);
            return { status: 'error', error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }

    async importCategoryItems(categoryId, categoryData) {
        if (!categoryData || !categoryData.items) return;

        // Alle Items dieser Kategorie in die DB importieren
        for (const item of categoryData.items) {
            // Photo-Pfad zu Marker umwandeln (wird später geladen)
            const itemToSave = {
                ...item,
                category: categoryId,
                photo: item.photo ? `github:${item.photo}` : ''
            };

            await this.saveItemToDB(itemToSave);
        }

        // CategoryManager Cache aktualisieren
        this.categoryManager.categoryData.set(categoryId, categoryData.items);
    }

    async saveItemToDB(item) {
        return new Promise((resolve, reject) => {
            const db = this.categoryManager.db;
            const transaction = db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');

            let request;
            if (item.id) {
                request = store.put(item);
            } else {
                request = store.add(item);
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async downloadAllImagesForCategory(categoryId, categoryData) {
        if (!categoryData || !categoryData.items) return 0;

        let downloadedCount = 0;

        for (const item of categoryData.items) {
            if (!item.photo) continue;

            const imageId = `${categoryId}/${item.id}`;

            try {
                const blob = await this.imageManager.downloadFromGitHub(imageId, this);
                if (blob) {
                    downloadedCount++;
                    console.log(`📸 Bild heruntergeladen: ${imageId}`);
                }
            } catch (error) {
                console.warn(`⚠️ Bild-Download übersprungen: ${imageId}`, error.message);
            }
        }

        return downloadedCount;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiFileGitHubSync;
}
