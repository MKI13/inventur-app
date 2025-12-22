// ImageManager v2.0.0
class ImageManager {
    constructor() {
        this.imageCache = new Map();
        this.indexedDB = null;
        this.compression = { maxWidth: 800, maxHeight: 600, quality: 0.7 };
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('efsinImagesDB', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.indexedDB = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('images')) {
                    db.createObjectStore('images', { keyPath: 'id' });
                }
            };
        });
    }

    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let { width, height } = img;
                    const { maxWidth, maxHeight } = this.compression;
                    if (width > maxWidth || height > maxHeight) {
                        if (width > height) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        } else {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', this.compression.quality);
                };
                img.onerror = reject;
                img.src = event.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async saveImage(itemId, categoryId, file) {
        const blob = await this.compressImage(file);
        const imageId = `${categoryId}/${itemId}`;
        await this.storeInDB(imageId, blob);
        this.imageCache.set(imageId, blob);
        return imageId;
    }

    async storeInDB(imageId, blob) {
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.put({ id: imageId, blob: blob, timestamp: Date.now() });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async loadImage(imageId) {
        if (this.imageCache.has(imageId)) return this.imageCache.get(imageId);
        const blob = await this.loadFromDB(imageId);
        if (blob) this.imageCache.set(imageId, blob);
        return blob;
    }

    async loadFromDB(imageId) {
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const request = store.get(imageId);
            request.onsuccess = () => resolve(request.result ? request.result.blob : null);
            request.onerror = () => reject(request.error);
        });
    }

    async getImageDataURL(imageId) {
        const blob = await this.loadImage(imageId);
        if (!blob) return null;
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(blob);
        });
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = ImageManager;
