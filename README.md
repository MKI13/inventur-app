# Inventur PWA

Eine moderne Progressive Web App für die Inventarverwaltung in der Werkstatt.

## 🎯 Features

### Kernfunktionen

* ✅ **Offline-First** - Vollständig funktionsfähig ohne Internet
* ✅ **QR/Barcode Scanner** - Schnelles Erfassen von Artikeln
* ✅ **Foto-Dokumentation** - Bilder direkt von der Kamera
* ✅ **Kategorisierung** - Holz, Platten, Beschläge, Werkzeuge, etc.
* ✅ **Bestandswarnung** - Min/Max-Levels mit Warnungen
* ✅ **Export/Import** - JSON-Format für Backup und Datenaustausch
* ✅ **GitHub Sync** - Automatische Cloud-Backups
* ✅ **Responsive Design** - Optimiert für Tablets und Smartphones

### Technische Features

* 🔧 IndexedDB für lokale Datenspeicherung
* 🔧 Service Worker für Offline-Funktionalität
* 🔧 Touch-optimiert für Arbeitshandschuhe
* 🔧 Kein Server erforderlich
* 🔧 DSGVO-konform (alle Daten lokal)

## 📦 Installation

### Option 1: Lokale Installation (Empfohlen)

1. **Dateien herunterladen**

   ```bash
   git clone https://github.com/DEIN-USERNAME/inventur-app.git
   cd inventur-app
   ```

2. **Lokaler Webserver starten**

   **Python:**
   ```bash
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
   * Chrome/Edge: Adressleiste → "Installieren" Symbol
   * Safari iOS: Teilen → "Zum Home-Bildschirm"

### Option 2: GitHub Pages (Online)

1. **Repository forken**
2. **GitHub Pages aktivieren**
   * Repository Settings → Pages
   * Source: main branch
   * URL: `https://USERNAME.github.io/inventur-app/`

## 🚀 Verwendung

### Erste Schritte

1. **Artikel hinzufügen**
   * Klick auf den "+" Button
   * Fülle Artikeldetails aus
   * Speichern

2. **QR-Code scannen**
   * Wechsle zu "Scanner" Tab
   * Erlaube Kamera-Zugriff
   * Code scannen

3. **Bestand verwalten**
   * "Bestand" Tab zeigt alle Artikel
   * Klick auf Artikel zum Bearbeiten
   * Suchfunktion und Filter nutzen

4. **Daten exportieren**
   * Menü (☰) öffnen
   * "Daten exportieren" wählen
   * JSON-Datei wird heruntergeladen

### Kategorien

Vordefinierte Kategorien:
* Holz
* Platten
* Beschläge
* Werkzeuge
* Lacke
* Schrauben
* Sonstiges

Kategorien können verwaltet werden:
* Menü → "Kategorien verwalten"
* Neue Kategorie erstellen
* Bestehende bearbeiten oder löschen

### GitHub Sync

Automatische Backups in ein GitHub Repository:

1. **GitHub Token erstellen**
   * GitHub → Settings → Developer settings
   * Personal access tokens → Generate new token
   * Scopes: `repo`

2. **In App konfigurieren**
   * Menü → GitHub Einstellungen
   * Token, Owner, Repo eingeben
   * Auto-Sync aktiviert (alle 5 Minuten)

3. **Daten-Repository**
   * Erstelle separates Repo für Backups
   * Backup-Struktur:
     ```
     inventur-data/
     ├── index.json
     └── categories/
         ├── holz.json
         ├── platten.json
         └── ...
     ```

## 🗂️ Projekt-Struktur

```
inventur-app/
├── index.html              # Haupt-HTML
├── app.js                  # Hauptlogik
├── styles.css              # Design
├── manifest.json           # PWA-Manifest
├── service-worker.js       # Offline-Funktionalität
├── offline.html            # Offline-Fallback
├── scanner.js              # QR/Barcode-Scanner
│
├── src/
│   ├── managers/           # Business Logic
│   │   ├── CategoryManager.js
│   │   ├── MultiFileGitHubSync.js
│   │   └── ImageManager.js
│   └── components/         # UI Components
│       └── QuickAdd.js
│
└── README.md               # Diese Datei
```

## 🔧 Konfiguration

### Anpassung der Farben

In `styles.css` die CSS-Variablen ändern:

```css
:root {
    --primary: #ff6b00;        /* Hauptfarbe */
    --background: #1a1a1a;     /* Hintergrund */
    --surface: #242424;        /* Karten-Hintergrund */
}
```

### App-Name ändern

In `manifest.json`:

```json
{
    "name": "Dein Firmenname Inventur",
    "short_name": "Inventur"
}
```

## 📱 Browser-Kompatibilität

### Empfohlen
* ✅ Chrome 90+ (Desktop & Android)
* ✅ Edge 90+
* ✅ Safari 14+ (iOS & macOS)

### Funktioniert
* ⚠️ Firefox 88+ (kein BarcodeDetector - Fallback aktiv)
* ⚠️ Opera 76+

## 💾 Datenverwaltung

### Lokale Speicherung

Alle Daten werden in **IndexedDB** gespeichert:
* Datenbank: `efsinInventurDB`
* Object Store: `inventory`
* Maximale Größe: ~50MB (browser-abhängig)

### Backup

**Manuelles Backup:**
1. Menü → "Daten exportieren"
2. JSON-Datei speichern

**Automatisches Backup:**
* GitHub Sync aktivieren
* Alle 5 Minuten automatisch

## 🔐 Sicherheit & Datenschutz

### DSGVO-Konformität

* ✅ Alle Daten bleiben lokal auf dem Gerät
* ✅ Keine Server-Kommunikation (außer GitHub Sync)
* ✅ Keine Cookies
* ✅ Keine Tracking-Tools
* ✅ Volle Kontrolle über Daten

### Best Practices

* Regelmäßige Backups erstellen
* GitHub Token sicher aufbewahren
* Bei Gerätewechsel: Export/Import nutzen

## 🛠️ Entwicklung

### Lokale Entwicklung

```bash
# Dateien bearbeiten
# Browser öffnen und testen

# Chrome DevTools:
# - Application → Service Workers
# - Application → IndexedDB
# - Application → Manifest
```

### Erweiterungen

Mögliche Features:
* CSV-Export für Excel
* Inventur-Protokolle
* Lieferanten-Verwaltung
* Bestellvorschläge
* Mehrbenutzer-Support

## 📄 Lizenz

MIT License

## 🐛 Fehlerbehebung

### App startet nicht
* Browser-Cache leeren
* Service Worker deregistrieren
* IndexedDB in DevTools prüfen

### Scanner funktioniert nicht
* Kamera-Berechtigung prüfen
* HTTPS verwenden (erforderlich für Kamera)
* Browser wechseln (Chrome empfohlen)

### Offline-Modus funktioniert nicht
* Service Worker registriert?
* Chrome DevTools → Application → Service Workers
* Browser neu laden

## 📞 Support

Bei Fragen oder Problemen:
* GitHub Issues erstellen
* Dokumentation prüfen
* Browser DevTools Console prüfen

---

**Version:** 2.0.3  
**Erstellt:** Dezember 2024  
**Plattform:** Progressive Web App (PWA)
