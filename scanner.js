// ===================================
// Scanner Module - QR & Barcode
// ===================================

class BarcodeScanner {
    constructor() {
        this.stream = null;
        this.scanning = false;
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.worker = null;
        this.init();
    }

    init() {
        this.setupUI();
        this.setupEventListeners();
    }

    setupUI() {
        // Video Element für Scanner erstellen
        const scannerDiv = document.getElementById('scanner');
        
        this.video = document.createElement('video');
        this.video.setAttribute('playsinline', true);
        this.video.style.width = '100%';
        this.video.style.height = '100%';
        this.video.style.objectFit = 'cover';
        
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        
        // Video vor Overlay einfügen
        scannerDiv.insertBefore(this.video, scannerDiv.firstChild);
    }

    setupEventListeners() {
        document.getElementById('startScanBtn').addEventListener('click', () => {
            this.startScanning();
        });

        document.getElementById('stopScanBtn').addEventListener('click', () => {
            this.stopScanning();
        });
    }

    async startScanning() {
        try {
            // Kamera-Zugriff anfordern
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Rückkamera bei Mobilgeräten
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.video.srcObject = this.stream;
            await this.video.play();

            // UI aktualisieren
            document.getElementById('startScanBtn').style.display = 'none';
            document.getElementById('stopScanBtn').style.display = 'block';
            document.querySelector('.scanner-frame').style.display = 'block';

            this.scanning = true;
            this.scan();

            console.log('Scanner gestartet');
        } catch (error) {
            console.error('Kamera-Fehler:', error);
            this.showScanError('Kamera-Zugriff verweigert oder nicht verfügbar');
        }
    }

    stopScanning() {
        this.scanning = false;

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.video) {
            this.video.srcObject = null;
        }

        // UI aktualisieren
        document.getElementById('startScanBtn').style.display = 'block';
        document.getElementById('stopScanBtn').style.display = 'none';

        console.log('Scanner gestoppt');
    }

    scan() {
        if (!this.scanning) return;

        // Canvas-Größe an Video anpassen
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        // Frame capturen
        this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // ImageData für Barcode-Erkennung
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Versuche Barcode zu erkennen
        this.detectBarcode(imageData);

        // Nächstes Frame
        requestAnimationFrame(() => this.scan());
    }

    async detectBarcode(imageData) {
        try {
            // Verwende Browser BarcodeDetector API wenn verfügbar
            if ('BarcodeDetector' in window) {
                const barcodeDetector = new BarcodeDetector({
                    formats: [
                        'qr_code',
                        'code_128',
                        'code_39',
                        'ean_13',
                        'ean_8',
                        'upc_a',
                        'upc_e'
                    ]
                });

                const barcodes = await barcodeDetector.detect(imageData);
                
                if (barcodes.length > 0) {
                    const barcode = barcodes[0];
                    this.onBarcodeDetected(barcode.rawValue, barcode.format);
                }
            } else {
                // Fallback: Einfache Pattern-Erkennung für Demo
                this.fallbackDetection(imageData);
            }
        } catch (error) {
            // Stilles Fehlerhandling - Scanner läuft weiter
            console.debug('Detection error:', error);
        }
    }

    fallbackDetection(imageData) {
        // Einfache Fallback-Lösung für Browser ohne BarcodeDetector API
        // In Production: Verwende Library wie jsQR oder ZXing
        
        // Für Demo: Simuliere Scan nach Klick auf Scanner-Bereich
        const scannerDiv = document.getElementById('scanner');
        if (!scannerDiv.hasAttribute('data-click-handler')) {
            scannerDiv.setAttribute('data-click-handler', 'true');
            scannerDiv.addEventListener('click', () => {
                if (this.scanning) {
                    // Demo: Simuliere erkannten Code
                    const demoCode = 'DEMO-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                    this.onBarcodeDetected(demoCode, 'qr_code');
                }
            });
        }
    }

    onBarcodeDetected(code, format) {
        console.log('Barcode erkannt:', code, format);
        
        // Scanner stoppen
        this.stopScanning();

        // Ergebnis anzeigen
        this.showScanResult(code, format);

        // Prüfe ob Artikel existiert
        this.lookupItem(code);
    }

    showScanResult(code, format) {
        const resultDiv = document.getElementById('scanResult');
        resultDiv.innerHTML = `
            <h3>Code erkannt!</h3>
            <div style="margin: 1rem 0;">
                <strong>Code:</strong> ${code}<br>
                <strong>Format:</strong> ${format}
            </div>
            <div style="display: flex; gap: 1rem;">
                <button class="btn-primary" onclick="scanner.searchItem('${code}')">
                    Artikel suchen
                </button>
                <button class="btn-secondary" onclick="scanner.startScanning()">
                    Nochmal scannen
                </button>
            </div>
        `;
    }

    showScanError(message) {
        const resultDiv = document.getElementById('scanResult');
        resultDiv.innerHTML = `
            <div style="color: var(--danger); padding: 1rem; text-align: center;">
                <strong>Fehler:</strong><br>
                ${message}
            </div>
        `;
    }

    async lookupItem(code) {
        try {
            // Suche nach SKU
            const item = app.items.find(item => 
                item.sku === code || 
                item.id === code ||
                item.name.includes(code)
            );

            if (item) {
                // Artikel gefunden - öffne zum Bearbeiten
                setTimeout(() => {
                    app.editItem(item.id);
                }, 1000);
            } else {
                // Artikel nicht gefunden - biete Neu-Erstellung an
                this.offerNewItem(code);
            }
        } catch (error) {
            console.error('Lookup error:', error);
        }
    }

    searchItem(code) {
        // Suche in Inventory View
        app.switchView('inventory');
        setTimeout(() => {
            document.getElementById('searchInput').value = code;
            app.filterItems(code);
        }, 100);
    }

    offerNewItem(code) {
        const resultDiv = document.getElementById('scanResult');
        resultDiv.innerHTML += `
            <div style="margin-top: 1rem; padding: 1rem; background: var(--surface); border-radius: var(--radius-md);">
                <p>Artikel mit diesem Code nicht gefunden.</p>
                <button class="btn-primary" onclick="scanner.createNewItemWithCode('${code}')">
                    Neuen Artikel mit SKU "${code}" anlegen
                </button>
            </div>
        `;
    }

    createNewItemWithCode(code) {
        app.showAddItem();
        setTimeout(() => {
            document.getElementById('itemSKU').value = code;
            document.getElementById('itemName').focus();
        }, 100);
    }

    // Prüfe ob Browser BarcodeDetector unterstützt
    static isSupported() {
        return 'BarcodeDetector' in window;
    }

    // Prüfe ob Kamera verfügbar ist
    static async isCameraAvailable() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch {
            return false;
        }
    }
}

// ===================================
// Scanner Utilities
// ===================================

class QRCodeGenerator {
    // Generiere QR-Code für Artikel (optional für Zukunft)
    static async generateQR(text) {
        // Verwende externe QR-Code Library oder API
        // Beispiel: https://api.qrserver.com/v1/create-qr-code/
        const size = 300;
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
        return url;
    }

    // Drucke QR-Code Label
    static async printLabel(item) {
        const qrUrl = await this.generateQR(item.sku || item.id);
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR-Label: ${item.name}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                    }
                    .label {
                        text-align: center;
                        padding: 2rem;
                        border: 2px solid #000;
                    }
                    img { max-width: 300px; }
                    h2 { margin: 1rem 0; }
                    @media print {
                        body { margin: 0; }
                        .label { border: none; }
                    }
                </style>
            </head>
            <body>
                <div class="label">
                    <img src="${qrUrl}" alt="QR Code">
                    <h2>${item.name}</h2>
                    <p><strong>SKU:</strong> ${item.sku || item.id}</p>
                    <p><strong>Kategorie:</strong> ${item.category}</p>
                </div>
                <script>
                    window.onload = () => {
                        setTimeout(() => window.print(), 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
}

// ===================================
// Initialize Scanner
// ===================================
let scanner;

document.addEventListener('DOMContentLoaded', () => {
    scanner = new BarcodeScanner();
    
    // Zeige Info wenn BarcodeDetector nicht unterstützt wird
    if (!BarcodeScanner.isSupported()) {
        console.warn('BarcodeDetector API nicht unterstützt. Verwende Fallback-Methode.');
        console.info('Für beste Ergebnisse Chrome/Edge verwenden oder jsQR Library integrieren.');
    }
});

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BarcodeScanner, QRCodeGenerator };
}
