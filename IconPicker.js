// =============================================================================
// ICON PICKER COMPONENT
// Version 3.0 - Mit TEXT-basierten Icons für Schreinerei-Produkte
// =============================================================================

class IconPicker {
    constructor() {
        this.iconDatabase = {
            'Holz & Schreinerei': [
                { icon: '🪵', name: 'Holzstamm', tags: ['holz', 'log', 'stamm', 'wood'] },
                { icon: '🌲', name: 'Nadelholz', tags: ['holz', 'baum', 'fichte', 'kiefer'] },
                { icon: '🌳', name: 'Laubholz', tags: ['holz', 'baum', 'eiche', 'buche'] },
                { icon: '🪚', name: 'Säge', tags: ['werkzeug', 'säge', 'holz', 'schneiden'] },
                { icon: '🔨', name: 'Hammer', tags: ['werkzeug', 'hammer', 'nagel'] },
                { icon: '🪓', name: 'Axt', tags: ['werkzeug', 'axt', 'holz', 'spalten'] },
                { icon: '📏', name: 'Lineal', tags: ['messen', 'lineal', 'länge'] },
                { icon: '📐', name: 'Winkel', tags: ['messen', 'winkel', '90', 'grad'] },
                { icon: '✏️', name: 'Bleistift', tags: ['zeichnen', 'bleistift', 'skizze'] },
                { icon: '🪑', name: 'Stuhl', tags: ['möbel', 'stuhl', 'sitzen'] },
                { icon: '🛋️', name: 'Sofa', tags: ['möbel', 'sofa', 'couch'] },
                { icon: '🚪', name: 'Tür', tags: ['möbel', 'tür', 'eingang'] },
                { icon: '🪟', name: 'Fenster', tags: ['fenster', 'glas', 'rahmen'] },
                { icon: '🗄️', name: 'Schrank', tags: ['möbel', 'schrank', 'lager'] },
                // Plattenwerkstoffe - mit Text
                { icon: 'SP', name: 'Spanplatte', tags: ['platte', 'spanplatte', 'span'] },
                { icon: 'MP', name: 'Multiplex', tags: ['platte', 'multiplex', 'sperrholz'] },
                { icon: 'ST', name: 'Stäbchenplatte', tags: ['platte', 'stäbchen', 'tischler'] },
                { icon: 'MDF', name: 'MDF-Platte', tags: ['platte', 'mdf', 'faserplatte'] },
                { icon: 'OSB', name: 'OSB-Platte', tags: ['platte', 'osb', 'grobspan'] },
                { icon: 'FU', name: 'Furnier', tags: ['furnier', 'blatt', 'edelholz'] },
                { icon: 'MH', name: 'Massivholz', tags: ['massiv', 'vollholz', 'brett'] },
                { icon: 'LH', name: 'Leimholz', tags: ['leimholz', 'bsh', 'balken'] }
            ],
            'Platten & Material': [
                { icon: '📋', name: 'Platte', tags: ['platte', 'material', 'brett'] },
                { icon: '📄', name: 'Blatt', tags: ['platte', 'blatt', 'dünn'] },
                { icon: '🟫', name: 'Braun', tags: ['farbe', 'holz', 'braun'] },
                { icon: '⬜', name: 'Weiß', tags: ['farbe', 'weiß', 'hell'] },
                { icon: '⬛', name: 'Schwarz', tags: ['farbe', 'schwarz', 'dunkel'] },
                { icon: '🟨', name: 'Gelb', tags: ['farbe', 'gelb'] },
                { icon: '🟩', name: 'Grün', tags: ['farbe', 'grün'] },
                { icon: '🟦', name: 'Blau', tags: ['farbe', 'blau'] },
                { icon: '🟥', name: 'Rot', tags: ['farbe', 'rot'] },
                { icon: '🟧', name: 'Orange', tags: ['farbe', 'orange'] },
                { icon: '🟪', name: 'Lila', tags: ['farbe', 'lila', 'violett'] }
            ],
            'Metall & Beschläge': [
                { icon: '🔩', name: 'Schraube', tags: ['metall', 'schraube', 'befestigung'] },
                { icon: '⚙️', name: 'Zahnrad', tags: ['metall', 'zahnrad', 'mechanik'] },
                { icon: '🔗', name: 'Kette', tags: ['metall', 'kette', 'verbindung'] },
                { icon: '🔒', name: 'Schloss', tags: ['metall', 'schloss', 'sicherheit'] },
                { icon: '🔑', name: 'Schlüssel', tags: ['metall', 'schlüssel', 'öffnen'] },
                { icon: '🪝', name: 'Haken', tags: ['metall', 'haken', 'aufhängen'] },
                { icon: '🧲', name: 'Magnet', tags: ['metall', 'magnet', 'anziehen'] },
                { icon: '⛓️', name: 'Ketten', tags: ['metall', 'kette', 'glied'] },
                { icon: '🛡️', name: 'Schild', tags: ['metall', 'schutz', 'schild'] },
                { icon: '⚡', name: 'Blitz', tags: ['metall', 'elektro', 'strom'] },
                { icon: '🔧', name: 'Schraubenschlüssel', tags: ['werkzeug', 'schlüssel', 'metall'] },
                { icon: '🪛', name: 'Schraubenzieher', tags: ['werkzeug', 'schraubenzieher'] },
                // Spezifische Beschläge - mit Text
                { icon: 'HS', name: 'Holzschraube', tags: ['schraube', 'holzschraube', 'spax'] },
                { icon: 'MU', name: 'Mutter', tags: ['mutter', 'sechskant', 'gewinde'] },
                { icon: 'GS', name: 'Gewindestange', tags: ['gewindestange', 'stange', 'gewinde'] },
                { icon: 'TB', name: 'Topfband', tags: ['topfband', 'scharnier', 'türband'] },
                { icon: 'SA', name: 'Schubladenauszug', tags: ['auszug', 'schublade', 'vollauszug'] },
                { icon: 'WK', name: 'Winkel', tags: ['winkel', 'metallwinkel', 'verbinder'] },
                { icon: 'EX', name: 'Exzenter', tags: ['exzenter', 'verbinder', 'möbel'] },
                { icon: 'VB', name: 'Verbinder', tags: ['verbinder', 'möbelverbinder', 'korpus'] },
                { icon: 'GR', name: 'Griff', tags: ['griff', 'möbelgriff', 'knopf'] },
                { icon: 'EM', name: 'Einschlagmutter', tags: ['einschlagmutter', 'gewindeeinsatz'] },
                { icon: 'DB', name: 'Dübel', tags: ['dübel', 'holzdübel', 'verbindung'] }
            ],
            'Schrauben & Befestigung': [
                { icon: '🔩', name: 'Schraube & Mutter', tags: ['schraube', 'mutter', 'befestigung'] },
                { icon: '📌', name: 'Reißzwecke', tags: ['pin', 'befestigung', 'zwecke'] },
                { icon: '📍', name: 'Pin', tags: ['pin', 'markierung'] },
                { icon: '🔗', name: 'Verbindung', tags: ['verbindung', 'kette', 'link'] },
                { icon: '⚓', name: 'Anker', tags: ['anker', 'befestigung', 'halt'] },
                { icon: '🪢', name: 'Knoten', tags: ['knoten', 'seil', 'verbindung'] }
            ],
            'Werkzeuge': [
                { icon: '🔨', name: 'Hammer', tags: ['werkzeug', 'hammer', 'schlagen'] },
                { icon: '🪚', name: 'Säge', tags: ['werkzeug', 'säge', 'schneiden'] },
                { icon: '🪓', name: 'Axt', tags: ['werkzeug', 'axt', 'spalten'] },
                { icon: '⛏️', name: 'Spitzhacke', tags: ['werkzeug', 'hacke', 'graben'] },
                { icon: '🪛', name: 'Schraubenzieher', tags: ['werkzeug', 'schraubenzieher'] },
                { icon: '🔧', name: 'Schraubenschlüssel', tags: ['werkzeug', 'schlüssel'] },
                { icon: '🗜️', name: 'Schraubstock', tags: ['werkzeug', 'stock', 'spannen'] },
                { icon: '⚒️', name: 'Hammer & Pick', tags: ['werkzeug', 'hammer', 'spitzhacke'] },
                { icon: '🛠️', name: 'Werkzeug', tags: ['werkzeug', 'allgemein', 'reparatur'] },
                { icon: '⚡', name: 'Elektrowerkzeug', tags: ['werkzeug', 'elektro', 'strom'] },
                { icon: '🔩', name: 'Mechanik', tags: ['werkzeug', 'mechanik', 'technik'] },
                { icon: '📏', name: 'Messen', tags: ['werkzeug', 'messen', 'lineal'] },
                // Sägeblätter & Bohrer - mit Text
                { icon: 'HM', name: 'Sägeblatt HM', tags: ['sägeblatt', 'kreissäge', 'hartmetall', 'hm'] },
                { icon: 'CV', name: 'Sägeblatt CV', tags: ['sägeblatt', 'kreissäge', 'chrom', 'cv'] },
                { icon: 'WZ', name: 'Wechselzahn', tags: ['sägeblatt', 'wechselzahn', 'kreissäge'] },
                { icon: 'ST', name: 'Stichsägeblatt', tags: ['stichsäge', 'sägeblatt', 'kurve'] },
                { icon: 'HB', name: 'Holzbohrer', tags: ['bohrer', 'holzbohrer', 'spiralbohrer'] },
                { icon: 'MB', name: 'Metallbohrer', tags: ['bohrer', 'metallbohrer', 'hss'] },
                { icon: 'FB', name: 'Forstnerbohrer', tags: ['bohrer', 'forstner', 'topfbohrer'] },
                { icon: 'BK', name: 'Bohrkrone', tags: ['bohrkrone', 'lochsäge', 'dosenbohrer'] },
                { icon: 'FR', name: 'Fräser', tags: ['fräser', 'oberfräse', 'nutfräser'] },
                { icon: 'SP', name: 'Schleifpapier', tags: ['schleifpapier', 'sandpapier', 'schleifen'] },
                { icon: 'BF', name: 'Bohrfutter', tags: ['bohrfutter', 'spannfutter', 'bohrmaschine'] }
            ],
            'Farben & Lacke': [
                { icon: '🎨', name: 'Farbpalette', tags: ['farbe', 'palette', 'malen'] },
                { icon: '🖌️', name: 'Pinsel', tags: ['farbe', 'pinsel', 'streichen'] },
                { icon: '🖍️', name: 'Wachsmalstift', tags: ['farbe', 'stift', 'wachs'] },
                { icon: '💧', name: 'Tropfen', tags: ['farbe', 'flüssig', 'tropfen'] },
                { icon: '🪣', name: 'Eimer', tags: ['farbe', 'eimer', 'behälter'] },
                { icon: '🌈', name: 'Regenbogen', tags: ['farbe', 'bunt', 'spektrum'] },
                { icon: '✨', name: 'Glitzer', tags: ['farbe', 'glanz', 'glitzer'] },
                { icon: '💫', name: 'Funkeln', tags: ['farbe', 'glanz', 'stern'] },
                { icon: '🎭', name: 'Masken', tags: ['farbe', 'theater', 'kunst'] },
                { icon: '🖼️', name: 'Bild', tags: ['farbe', 'bild', 'rahmen'] },
                // Gebindegrößen - mit Text
                { icon: '0.5L', name: 'Lack 0,5L', tags: ['lack', 'farbe', '0.5', 'halber'] },
                { icon: '1L', name: 'Lack 1L', tags: ['lack', 'farbe', '1l', 'liter'] },
                { icon: '2.5L', name: 'Lack 2,5L', tags: ['lack', 'farbe', '2.5', 'eimer'] },
                { icon: '5L', name: 'Lack 5L', tags: ['lack', 'farbe', '5l', 'kanister'] },
                { icon: 'DOSE', name: 'Dose Farbe', tags: ['farbe', 'dose', 'spray'] },
                { icon: 'ÖL', name: 'Öl', tags: ['öl', 'holzöl', 'leinöl', 'hartöl'] },
                { icon: 'LAS', name: 'Lasur', tags: ['lasur', 'holzlasur', 'schutzlasur'] },
                { icon: 'BZ', name: 'Beize', tags: ['beize', 'holzbeize', 'färben'] },
                { icon: 'WAX', name: 'Wachs', tags: ['wachs', 'holzwachs', 'möbelwachs'] },
                { icon: 'GR', name: 'Grundierung', tags: ['grundierung', 'primer', 'vorlack'] }
            ],
            'Klebstoffe': [
                // Kartuschen - mit Text
                { icon: 'KK', name: 'Kartusche Kleber', tags: ['kartusche', 'kleber', 'montagekleber'] },
                { icon: 'KS', name: 'Kartusche Silikon', tags: ['kartusche', 'silikon', 'fugenmasse'] },
                { icon: 'KA', name: 'Kartusche Acryl', tags: ['kartusche', 'acryl', 'dichtmasse'] },
                { icon: 'D3', name: 'Holzleim D3', tags: ['holzleim', 'eimer', 'd3', 'weißleim'] },
                { icon: 'D4', name: 'Holzleim D4', tags: ['holzleim', 'flasche', 'd4', 'express'] },
                { icon: 'PU', name: 'PU-Kleber', tags: ['pu', 'kleber', 'polyurethan'] },
                { icon: '2K', name: '2K-Kleber', tags: ['2k', 'kleber', 'epoxid', 'zwei'] },
                { icon: 'CA', name: 'Sekundenkleber', tags: ['sekundenkleber', 'cyanacrylat', 'ca'] },
                { icon: 'KT', name: 'Kontaktkleber', tags: ['kontaktkleber', 'kontaktklebstoff'] },
                { icon: 'MK', name: 'Montagekleber', tags: ['montagekleber', 'baukleber', 'kraft'] },
                { icon: 'BSH', name: 'Leimholzkleber', tags: ['leimholz', 'kleber', 'bsh', 'konstruktion'] },
                { icon: 'SPR', name: 'Sprühkleber', tags: ['sprühkleber', 'spray', 'kontaktspray'] }
            ],
            'Büro & Verwaltung': [
                { icon: '📁', name: 'Ordner', tags: ['büro', 'ordner', 'ablage'] },
                { icon: '📂', name: 'Ordner offen', tags: ['büro', 'ordner', 'geöffnet'] },
                { icon: '📋', name: 'Klemmbrett', tags: ['büro', 'klemmbrett', 'liste'] },
                { icon: '📄', name: 'Dokument', tags: ['büro', 'dokument', 'papier'] },
                { icon: '📝', name: 'Notiz', tags: ['büro', 'notiz', 'schreiben'] },
                { icon: '📊', name: 'Balkendiagramm', tags: ['büro', 'statistik', 'diagramm'] },
                { icon: '📈', name: 'Aufwärtstrend', tags: ['büro', 'trend', 'steigend'] },
                { icon: '📉', name: 'Abwärtstrend', tags: ['büro', 'trend', 'fallend'] },
                { icon: '🖊️', name: 'Stift', tags: ['büro', 'stift', 'schreiben'] },
                { icon: '✏️', name: 'Bleistift', tags: ['büro', 'bleistift', 'zeichnen'] },
                { icon: '📌', name: 'Reißzwecke', tags: ['büro', 'pin', 'befestigen'] },
                { icon: '📍', name: 'Pin', tags: ['büro', 'markierung', 'ort'] },
                { icon: '🗄️', name: 'Aktenschrank', tags: ['büro', 'schrank', 'archiv'] },
                { icon: '📚', name: 'Bücher', tags: ['büro', 'bücher', 'bibliothek'] },
                { icon: '💼', name: 'Aktenkoffer', tags: ['büro', 'koffer', 'geschäft'] },
                { icon: '🗂️', name: 'Karteikasten', tags: ['büro', 'kartei', 'index'] },
                { icon: '📇', name: 'Karteikarten', tags: ['büro', 'karten', 'index'] },
                { icon: '🗓️', name: 'Kalender', tags: ['büro', 'kalender', 'termin'] },
                { icon: '📅', name: 'Datum', tags: ['büro', 'datum', 'kalender'] },
                { icon: '🔖', name: 'Lesezeichen', tags: ['büro', 'lesezeichen', 'markierung'] }
            ],
            'Lager & Transport': [
                { icon: '📦', name: 'Paket', tags: ['lager', 'paket', 'karton'] },
                { icon: '📫', name: 'Briefkasten', tags: ['lager', 'post', 'briefkasten'] },
                { icon: '🎁', name: 'Geschenk', tags: ['lager', 'geschenk', 'paket'] },
                { icon: '🛒', name: 'Einkaufswagen', tags: ['lager', 'wagen', 'einkauf'] },
                { icon: '🏪', name: 'Laden', tags: ['lager', 'laden', 'geschäft'] },
                { icon: '🏭', name: 'Fabrik', tags: ['lager', 'fabrik', 'produktion'] },
                { icon: '🚚', name: 'LKW', tags: ['transport', 'lkw', 'lieferung'] },
                { icon: '🚛', name: 'Container-LKW', tags: ['transport', 'container', 'lkw'] },
                { icon: '📐', name: 'Vermessung', tags: ['messen', 'geometrie', 'winkel'] },
                { icon: '⚖️', name: 'Waage', tags: ['messen', 'waage', 'gewicht'] },
                { icon: '🏷️', name: 'Etikett', tags: ['lager', 'etikett', 'kennzeichnung'] },
                { icon: '🔢', name: 'Zahlen', tags: ['lager', 'zahlen', 'inventar'] }
            ],
            'Sonstiges': [
                { icon: '⭐', name: 'Stern', tags: ['sonstiges', 'stern', 'favorit'] },
                { icon: '💡', name: 'Glühbirne', tags: ['sonstiges', 'idee', 'licht'] },
                { icon: '🔍', name: 'Lupe', tags: ['sonstiges', 'suchen', 'finden'] },
                { icon: '⚠️', name: 'Warnung', tags: ['sonstiges', 'warnung', 'achtung'] },
                { icon: '✅', name: 'Häkchen', tags: ['sonstiges', 'ok', 'erledigt'] },
                { icon: '❌', name: 'Kreuz', tags: ['sonstiges', 'fehler', 'nein'] },
                { icon: '🎯', name: 'Zielscheibe', tags: ['sonstiges', 'ziel', 'treffer'] },
                { icon: '🔔', name: 'Glocke', tags: ['sonstiges', 'alarm', 'benachrichtigung'] },
                { icon: '💰', name: 'Geldsack', tags: ['sonstiges', 'geld', 'kosten'] },
                { icon: '💶', name: 'Euro', tags: ['sonstiges', 'euro', 'währung'] },
                { icon: '🔒', name: 'Geschlossen', tags: ['sonstiges', 'sicher', 'verschlossen'] },
                { icon: '🔓', name: 'Offen', tags: ['sonstiges', 'offen', 'zugänglich'] },
                { icon: '🆕', name: 'Neu', tags: ['sonstiges', 'neu', 'frisch'] },
                { icon: '🔥', name: 'Feuer', tags: ['sonstiges', 'heiß', 'wichtig'] },
                { icon: '⏰', name: 'Wecker', tags: ['sonstiges', 'zeit', 'alarm'] }
            ]
        };
        
        this.selectedIcon = null;
        this.onSelectCallback = null;
        this.currentCategory = 'Holz & Schreinerei';
    }

    open(currentIcon, onSelect) {
        this.selectedIcon = currentIcon || '📦';
        this.onSelectCallback = onSelect;
        this.render();
        document.getElementById('iconPickerModal').classList.add('active');
    }

    close() {
        document.getElementById('iconPickerModal').classList.remove('active');
    }

    select(icon) {
        this.selectedIcon = icon;
        if (this.onSelectCallback) {
            this.onSelectCallback(icon);
        }
        this.close();
    }

    render() {
        // Tabs rendern
        const tabsContainer = document.getElementById('iconPickerTabs');
        tabsContainer.innerHTML = Object.keys(this.iconDatabase).map(category => 
            `<button class="icon-tab ${category === this.currentCategory ? 'active' : ''}" 
                     data-category="${category}">${category}</button>`
        ).join('');

        // Event Listeners für Tabs
        tabsContainer.querySelectorAll('.icon-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.currentCategory = e.target.dataset.category;
                tabsContainer.querySelectorAll('.icon-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.renderCategory(this.currentCategory);
            });
        });

        // Erste Kategorie anzeigen
        this.renderCategory(this.currentCategory);
    }

    renderCategory(category) {
        const container = document.getElementById('iconPickerGrid');
        const icons = this.iconDatabase[category] || [];
        
        if (icons.length === 0) {
            container.innerHTML = '<div class="icon-picker-empty">Keine Icons in dieser Kategorie</div>';
            return;
        }
        
        container.innerHTML = icons.map(item => `
            <div class="icon-item ${this.selectedIcon === item.icon ? 'selected' : ''}" 
                 data-icon="${item.icon}"
                 title="${item.name}">
                <span class="icon-display">${item.icon}</span>
                <span class="icon-name">${item.name}</span>
            </div>
        `).join('');

        // Event Listeners für Icons
        container.querySelectorAll('.icon-item').forEach(item => {
            item.addEventListener('click', () => {
                this.select(item.dataset.icon);
            });
        });
    }

    search(query) {
        const results = [];
        query = query.toLowerCase();

        Object.entries(this.iconDatabase).forEach(([category, icons]) => {
            icons.forEach(item => {
                if (item.name.toLowerCase().includes(query) || 
                    item.tags.some(tag => tag.toLowerCase().includes(query))) {
                    results.push({ ...item, category });
                }
            });
        });

        return results;
    }
}

// Export für globale Verwendung
if (typeof window !== 'undefined') {
    window.IconPicker = IconPicker;
}
