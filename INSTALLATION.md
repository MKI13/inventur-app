# 📱 Installationsanleitung ef-sin Inventur PWA

## Schnellstart (5 Minuten)

### Schritt 1: Dateien vorbereiten ✅

Alle Dateien in einem Ordner `inventur-pwa/` speichern:

```
inventur-pwa/
├── index.html
├── manifest.json
├── service-worker.js
├── app.js
├── scanner.js
├── styles.css
├── offline.html
├── icon.svg
└── README.md
```

### Schritt 2: Lokaler Server starten 🚀

**Variante A - Python (empfohlen)**
```bash
cd inventur-pwa
python3 -m http.server 8080
```

**Variante B - Node.js**
```bash
cd inventur-pwa
npx serve
```

**Variante C - PHP**
```bash
cd inventur-pwa
php -S localhost:8080
```

### Schritt 3: Im Browser öffnen 🌐

Öffne in Chrome/Edge:
```
http://localhost:8080
```

✅ Die App sollte jetzt laufen!

### Schritt 4: Als App installieren 📲

#### Desktop (Chrome/Edge)
1. Adressleiste: Klick auf "Installieren" Symbol (⊕)
2. Oder: Menü (⋮) → "App installieren"

#### Android
1. Chrome: Menü (⋮) → "Zum Startbildschirm hinzufügen"
2. Oder: "App installieren" Popup

#### iOS (Safari)
1. Teilen-Symbol (□↑) tippen
2. "Zum Home-Bildschirm" wählen

---

## APK Erstellen (Android App)

### Methode 1: PWA Builder (Einfach) ⭐

1. **PWA online hosten**
   - GitHub Pages (siehe unten)
   - Oder eigener Webserver

2. **PWA Builder öffnen**
   ```
   https://www.pwabuilder.com/
   ```

3. **URL eingeben**
   - Deine PWA-URL eingeben
   - "Start" klicken

4. **Android Package erstellen**
   - "Publish" Tab
   - "Android" wählen
   - Details ausfüllen:
     - Package ID: `de.efsin.inventur`
     - App Name: `ef-sin Inventur`
     - Version: `1.0.0`
   - "Generate Package" klicken

5. **APK herunterladen**
   - Warte auf Build (1-2 Minuten)
   - Download APK
   - Fertig! 🎉

### Methode 2: Bubblewrap CLI (Fortgeschritten)

```bash
# Installation
npm install -g @bubblewrap/cli

# Projekt initialisieren
cd inventur-pwa
bubblewrap init --manifest https://DEINE-URL/manifest.json

# APK bauen
bubblewrap build

# APK finden
# → app-release-signed.apk
```

### APK auf Android installieren

1. APK auf Gerät kopieren (USB, E-Mail, Cloud)
2. Datei antippen
3. "Aus unbekannten Quellen installieren" erlauben
4. Installation bestätigen
5. App öffnen! ✅

---

## GitHub Pages Hosting (Kostenlos)

### Setup

```bash
# Git initialisieren
cd inventur-pwa
git init

# Dateien hinzufügen
git add .
git commit -m "Initial commit"

# GitHub Repository erstellen (im Browser)
# Dann:
git remote add origin https://github.com/DEINNAME/inventur.git
git branch -M main
git push -u origin main
```

### GitHub Pages aktivieren

1. Repository → Settings
2. Pages (linke Sidebar)
3. Source: `main` branch
4. Save

### URL merken
```
https://DEINNAME.github.io/inventur/
```

Diese URL für PWA Builder verwenden!

---

## Icons erstellen (Optional)

Die App verwendet `icon.svg` als Platzhalter. Für professionelle Icons:

### Online-Generator (Einfach)
1. Besuche: https://realfavicongenerator.net/
2. Lade `icon.svg` hoch
3. Generiere alle Größen
4. Download und ersetze Icons

### Mit ImageMagick (Lokal)
```bash
# 192x192 PNG
convert -density 300 icon.svg -resize 192x192 icon-192.png

# 512x512 PNG
convert -density 300 icon.svg -resize 512x512 icon-512.png
```

### Mit Inkscape
```bash
inkscape icon.svg --export-png=icon-192.png --export-width=192
inkscape icon.svg --export-png=icon-512.png --export-width=512
```

---

## Erster Start - Checkliste

Nach Installation:

### 1. Kamera-Zugriff testen
- Scanner-Tab öffnen
- "Scanner starten" klicken
- Kamera-Berechtigung erlauben

### 2. Ersten Artikel anlegen
- "+" Button (orange, unten rechts)
- Beispiel-Daten eingeben:
  ```
  Name: Buchenholz 40mm
  SKU: BH-40-001
  Kategorie: Holz
  Bestand: 25
  Einheit: m
  Mindestbestand: 10
  Lagerort: Regal A3
  ```
- Speichern

### 3. Offline-Test
- Flugmodus aktivieren
- App öffnen
- Artikel anlegen/bearbeiten
- Sollte alles funktionieren! ✅

### 4. Export-Test
- Menü (☰) öffnen
- "Daten exportieren"
- JSON-Datei sollte downloaden

---

## Häufige Probleme

### ❌ "Service Worker Fehler"
**Lösung:**
- HTTPS oder localhost verwenden
- Service Worker deregistrieren:
  ```
  Chrome DevTools → Application → Service Workers → Unregister
  ```

### ❌ "Kamera funktioniert nicht"
**Lösung:**
- HTTPS erforderlich (außer localhost)
- Kamera-Berechtigung prüfen
- Chrome/Edge Browser verwenden

### ❌ "App installiert sich nicht"
**Lösung:**
- `manifest.json` prüfen
- Mindestens ein Icon vorhanden?
- Service Worker aktiv?

### ❌ "Daten verschwinden"
**Lösung:**
- Browser-Daten nicht löschen
- Regelmäßig exportieren
- IndexedDB prüfen:
  ```
  Chrome DevTools → Application → IndexedDB
  ```

---

## Empfohlene Server-Konfiguration

### Apache (.htaccess)
```apache
# HTTPS erzwingen
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Service Worker MIME Type
AddType application/javascript .js
AddType application/manifest+json .json

# Cache Headers
<FilesMatch "\.(html|css|js)$">
    Header set Cache-Control "max-age=3600, must-revalidate"
</FilesMatch>

<FilesMatch "service-worker.js">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>
```

### Nginx
```nginx
server {
    listen 443 ssl;
    server_name inventur.efsin.de;

    root /var/www/inventur-pwa;
    index index.html;

    # Service Worker
    location /service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Content-Type application/javascript;
    }

    # PWA Manifest
    location /manifest.json {
        add_header Content-Type application/manifest+json;
    }

    # Alle anderen Dateien
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Production Deployment

### Vor dem Go-Live:

1. **Icons erstellen** (192x192, 512x512)
2. **App-Name anpassen** in `manifest.json`
3. **Farben anpassen** in `styles.css`
4. **Kategorien anpassen** in `app.js`
5. **HTTPS aktivieren** (zwingend!)
6. **Service Worker testen**
7. **Alle Geräte testen**

### Performance-Optimierung:

```bash
# CSS minimieren
npx clean-css-cli -o styles.min.css styles.css

# JS minimieren
npx uglify-js app.js -o app.min.js
npx uglify-js scanner.js -o scanner.min.js

# HTML minimieren
npx html-minifier index.html -o index.min.html
```

---

## Support & Updates

### Updates installieren
1. Neue Dateien hochladen
2. Service Worker Version erhöhen
3. Browser-Cache leeren
4. App neu laden

### Fehler melden
- Browser Console öffnen (F12)
- Fehler-Screenshot machen
- GitHub Issue erstellen

### Community
- GitHub Discussions
- E-Mail Support: kontakt@ef-sin.de

---

## Lizenz & Nutzung

**Für internen Gebrauch entwickelt**
© 2024 ef-sin Schreinerei
Marios Karampas / Holzbau Karampas

Bei Fragen: kontakt@ef-sin.de

---

**Viel Erfolg mit der App! 🚀**
