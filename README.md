# ef-sin Inventur PWA

Eine moderne Progressive Web App für die Inventarverwaltung in der Schreinerei-Werkstatt.

## 🎯 Features

### Kernfunktionen
- ✅ **Offline-First** - Vollständig funktionsfähig ohne Internet
- ✅ **QR/Barcode Scanner** - Schnelles Erfassen von Artikeln
- ✅ **Foto-Dokumentation** - Bilder direkt von der Kamera
- ✅ **Kategorisierung** - Holz, Platten, Beschläge, Werkzeuge, etc.
- ✅ **Bestandswarnung** - Min/Max-Levels mit Warnungen
- ✅ **Export/Import** - JSON-Format für Backup und Datenaustausch
- ✅ **Responsive Design** - Optimiert für Tablets und Smartphones

### Technische Features
- 🔧 IndexedDB für lokale Datenspeicherung
- 🔧 Service Worker für Offline-Funktionalität
- 🔧 Industrielles Design (Orange/Grau)
- 🔧 Touch-optimiert für Arbeitshandschuhe
- 🔧 Kein Server erforderlich
- 🔧 DSGVO-konform (alle Daten lokal)

## 📦 Installation

### Option 1: Lokale Installation (Empfohlen)

1. **Dateien herunterladen**
   ```bash
   # Alle Dateien in einen Ordner kopieren
   inventur-pwa/
   ├── index.html
   ├── manifest.json
   ├── service-worker.js
   ├── app.js
   ├── scanner.js
   ├── styles.css
   └── offline.html
   ```

2. **Lokaler Webserver starten**
   
   **Python:**
   ```bash
   cd inventur-pwa
   python3 -m http.server 8080
   ```
   
   **Node.js:**
   ```bash
   npx serve
   ```
   
   **PHP:**
   ```bash
   php -S localhost:8080
   ```

3. **Im Browser öffnen**
   ```
   http://localhost:8080
   ```

4. **Als App installieren**
   - Chrome/Edge: Adressleiste → "Installieren" Symbol
   - Safari iOS: Teilen → "Zum Home-Bildschirm"

### Option 2: GitHub Pages (Online)

1. **Repository erstellen**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/USERNAME/inventur.git
   git push -u origin main
   ```

2. **GitHub Pages aktivieren**
   - Repository Settings → Pages
   - Source: main branch
   - URL: `https://USERNAME.github.io/inventur/`

### Option 3: APK Generierung

#### Mit PWA Builder (Empfohlen)

1. **PWA Builder besuchen**
   ```
   https://www.pwabuilder.com/
   ```

2. **PWA URL eingeben**
   - Gebe die URL deiner gehosteten PWA ein
   - Oder verwende: `pwabuilder package` CLI

3. **APK generieren**
   - Wähle "Android" Package
   - Konfiguriere App-Details
   - Download APK

4. **Installation auf Android**
   - APK auf Gerät kopieren
   - Installation erlauben (Einstellungen → Sicherheit)
   - APK installieren

#### Mit Bubblewrap CLI

```bash
# NPM installieren
npm install -g @bubblewrap/cli

# APK erstellen
bubblewrap init --manifest https://DEINE-URL/manifest.json
bubblewrap build

# APK findet sich in: app-release-signed.apk
```

## 🚀 Verwendung

### Erste Schritte

1. **Artikel hinzufügen**
   - Klick auf den orange "+" Button
   - Fülle Artikeldetails aus
   - Speichern

2. **QR-Code scannen**
   - Wechsle zu "Scanner" Tab
   - Erlaube Kamera-Zugriff
   - Code scannen
   - Artikel wird gesucht oder neu angelegt

3. **Bestand verwalten**
   - "Bestand" Tab zeigt alle Artikel
   - Klick auf Artikel zum Bearbeiten
   - Suchfunktion und Filter nutzen

4. **Daten exportieren**
   - Menü (☰) öffnen
   - "Daten exportieren" wählen
   - JSON-Datei wird heruntergeladen

### Kategorien

Vordefinierte Kategorien:
- Holz
- Platten
- Beschläge
- Werkzeuge
- Lacke & Öle
- Schrauben & Dübel
- Sonstiges

Kategorien können im Code angepasst werden (`app.js`, Zeile 10-18).

### Bestandswarnungen

- **Kritisch** (Rot): Bestand = 0
- **Niedrig** (Orange): Bestand ≤ Mindestbestand
- **OK** (Grün): Bestand > Mindestbestand

## 🔧 Konfiguration

### Anpassung der Farben

In `styles.css` die CSS-Variablen ändern:

```css
:root {
    --primary: #ff6b00;        /* Hauptfarbe */
    --background: #1a1a1a;     /* Hintergrund */
    --surface: #242424;        /* Karten-Hintergrund */
    /* ... weitere Farben */
}
```

### App-Name und Icon ändern

In `manifest.json`:

```json
{
    "name": "Dein Firmenname Inventur",
    "short_name": "Inventur",
    "icons": [
        {
            "src": "dein-icon-192.png",
            "sizes": "192x192"
        }
    ]
}
```

### Kategorien anpassen

In `app.js` und `index.html`:

```javascript
// app.js
DEFAULT_CATEGORIES: [
    'Deine Kategorie 1',
    'Deine Kategorie 2',
    // ...
]
```

```html
<!-- index.html - Form -->
<select id="itemCategory">
    <option value="Kategorie1">Kategorie 1</option>
    <!-- ... -->
</select>
```

## 📱 Browser-Kompatibilität

### Empfohlen
- ✅ Chrome 90+ (Desktop & Android)
- ✅ Edge 90+
- ✅ Safari 14+ (iOS & macOS)

### Funktioniert
- ⚠️ Firefox 88+ (kein BarcodeDetector - Fallback aktiv)
- ⚠️ Opera 76+

### Scanner-Hinweise

Der QR/Barcode-Scanner nutzt die **BarcodeDetector API**:
- Voll unterstützt: Chrome, Edge, Opera, Samsung Internet
- Nicht unterstützt: Firefox, Safari

Für Firefox/Safari: 
- Fallback-Methode aktiv (manueller Scan)
- Oder externe Library integrieren (jsQR, ZXing)

## 💾 Datenverwaltung

### Lokale Speicherung

Alle Daten werden in **IndexedDB** gespeichert:
- Datenbank: `efsinInventurDB`
- Object Store: `inventory`
- Speicherort: Browser-intern
- Maximale Größe: ~50MB (browser-abhängig)

### Backup

**Manuelles Backup:**
1. Menü → "Daten exportieren"
2. JSON-Datei speichern

**Automatisches Backup:**
- Optional: Cloud-Sync implementieren
- LocalStorage für zusätzliche Sicherheit

### Import/Export

**Export-Format:**
```json
{
    "version": "1.0.0",
    "exportDate": "2024-12-20T10:30:00.000Z",
    "items": [
        {
            "id": "item_12345",
            "name": "Buchenholz 40mm",
            "sku": "BH-40-001",
            "category": "Holz",
            "stock": 25.5,
            "unit": "m",
            "min": 10,
            "max": 50,
            "price": 12.50,
            "location": "Regal A3",
            "notes": "Für Tischplatten",
            "photo": "data:image/jpeg;base64,...",
            "createdAt": "2024-01-15T08:00:00.000Z",
            "updatedAt": "2024-12-20T10:00:00.000Z"
        }
    ]
}
```

## 🔐 Sicherheit & Datenschutz

### DSGVO-Konformität
- ✅ Alle Daten bleiben lokal auf dem Gerät
- ✅ Keine Server-Kommunikation
- ✅ Keine Cookies
- ✅ Keine Tracking-Tools
- ✅ Volle Kontrolle über Daten

### Best Practices
- Regelmäßige Backups erstellen
- Export-Dateien sicher aufbewahren
- Bei Gerätewechsel: Export/Import nutzen
- Kamera-Zugriff nur für Scanner nötig

## 🛠️ Entwicklung

### Projektstruktur

```
inventur-pwa/
├── index.html          # Haupt-HTML
├── manifest.json       # PWA-Manifest
├── service-worker.js   # Offline-Funktionalität
├── app.js              # Hauptlogik + IndexedDB
├── scanner.js          # QR/Barcode-Scanner
├── styles.css          # Design
├── offline.html        # Offline-Fallback
└── README.md           # Diese Datei
```

### Lokale Entwicklung

```bash
# Dateien bearbeiten
# Browser öffnen und testen
# Service Worker in DevTools prüfen

# Chrome DevTools:
# - Application → Service Workers
# - Application → IndexedDB
# - Application → Manifest
```

### Erweiterungen

**Mögliche Features:**
- Cloud-Synchronisation
- Mehrbenutzer-Support
- Barcode-Drucker Integration
- CSV-Export für Excel
- Inventur-Protokolle
- Lieferanten-Verwaltung
- Bestellvorschläge

## 📄 Lizenz

© 2024 ef-sin Schreinerei
Marios Karampas / Holzbau Karampas
München / Unterhaching

Für internen Gebrauch entwickelt.

## 🐛 Fehlerbehebung

### App startet nicht
- Browser-Cache leeren
- Service Worker deregistrieren
- IndexedDB in DevTools prüfen

### Scanner funktioniert nicht
- Kamera-Berechtigung prüfen
- HTTPS verwenden (erforderlich für Kamera)
- Browser wechseln (Chrome empfohlen)

### Daten gehen verloren
- Browser-Daten nicht löschen
- Regelmäßig exportieren
- Backup-Routine einrichten

### Offline-Modus funktioniert nicht
- Service Worker registriert?
- Chrome DevTools → Application → Service Workers
- Browser neu laden

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Dokumentation prüfen
- Browser DevTools Console prüfen

## 🎨 Design

**Farbschema:** Werkstatt-Industriell
- Primär: Orange (#ff6b00) - Signalfarbe
- Hintergrund: Dunkelgrau (#1a1a1a)
- Akzent: Graustufen

**Typografie:**
- Display: Rajdhani (robust, industriell)
- Monospace: JetBrains Mono (Zahlen/Codes)

**Touch-Targets:**
- Minimum 48x48px für Arbeitshandschuhe
- Große Schaltflächen
- Klare Kontraste

---

**Version:** 1.0.0  
**Erstellt:** Dezember 2024  
**Plattform:** Progressive Web App (PWA)
