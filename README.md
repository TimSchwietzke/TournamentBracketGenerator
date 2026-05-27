# Tournament Bracket Generator

[Deutsch](#deutsch) | [English](#english)

---

## Deutsch

Ein moderner, interaktiver Turnierplan-Generator, der für mobile Geräte optimiert ist und mehrere Sprachen (Deutsch/Englisch) unterstützt. Dieses Repository enthält zwei verschiedene Tools zur Verwaltung von Turnieren.

### Repository-Struktur
Das Projekt ist in zwei Versionen aufgeteilt, um eine einfache Nutzung bei gleichzeitiger sauberer Code-Struktur zu gewährleisten:
1. **Single-File-Versionen (Hauptverzeichnis)**: Vollständig autarke HTML-Dateien. Alle Stile (CSS) und Skripte (JS) sind in der HTML-Datei eingebettet. Ideal zum direkten Öffnen im Browser ohne Webserver.
   - `index.html`: Der Turnier-Baukasten (Builder), mit dem Teams zusammengestellt und eine eigenständige Turnierseite heruntergeladen werden können.
   - `tournament_generator.html`: Die interaktive Live-Turnier-App zur direkten Durchführung und Verwaltung von Turnieren im Browser.
2. **Saubere, getrennte Versionen (`/separated`)**: Hier ist der Code sauber in HTML, CSS und JavaScript aufgeteilt. Dies ist die empfohlene Version für Entwickler zur Weiterentwicklung.
   - `separated/builder/`: Quellcode des Baukastens.
   - `separated/generator/`: Quellcode des interaktiven Live-Generators.

### Hauptfunktionen
- **Zwei Modi**: *Auto-Pool* (Spieler eingeben und automatisch in Teams einteilen lassen) oder *Direkt* (Teams und deren Mitglieder manuell eintragen).
- **Zwei Sprachen**: Dynamischer Sprachwechsel zwischen Deutsch und Englisch direkt in der Oberfläche. Die bevorzugte Sprache wird im Browser gespeichert.
- **Faires BYE-Verfahren**: Bei einer ungeraden/nicht-idealen Anzahl von Teams (keine Zweierpotenz) teilt der Algorithmus Freilose (BYEs) in Runde 1 fair auf. Die entsprechenden Teams rücken automatisch in Runde 2 vor, sodass ab Runde 2 eine perfekte Zweierpotenz an Teams verbleibt.
- **Live-Bearbeitung der Teams**: Teams und deren Mitglieder können auch während des laufenden Turniers bearbeitet werden. Namen und Spieler-Änderungen werden sofort im gesamten Turnierbaum aktualisiert.
- **Mobil-Optimiert**: Die Benutzeroberfläche passt sich automatisch an Smartphones und Tablets an. Der Turnierbaum ist horizontal scrollbar und Touch-Gesten-optimiert.

---

## English

A modern, interactive tournament bracket generator optimized for mobile viewports, featuring multi-language support (German/English). This repository contains two distinct tools to manage tournaments.

### Repository Structure
The project is split into two formats to ensure easy usage while maintaining clean code hygiene:
1. **Single-File Versions (Root)**: Self-contained HTML files with embedded CSS and JS. Ideal for double-clicking and running directly in a browser without setting up a server.
   - `index.html`: The Tournament Builder, allowing users to configure rosters and download a self-contained interactive tournament engine page.
   - `tournament_generator.html`: The Interactive Live Generator, designed to host and play through tournaments directly in the browser.
2. **Clean & Separated Versions (`/separated`)**: Code is cleanly separated into HTML, CSS, and JS files. This is the recommended structure for developers wanting to modify the codebase.
   - `separated/builder/`: Source files for the Builder.
   - `separated/generator/`: Source files for the Interactive Live Generator.

### Key Features
- **Dual Mode Entry**: *Auto-Pool* (input player names to automatically form teams based on squad capacity) or *Direct Entry* (manually enter team names and members).
- **Multi-Language Support**: Instantly toggle between German and English. Selected language settings persist across page reloads.
- **Fair BYE Distribution**: Handles non-power-of-2 team counts by placing all BYEs in Round 1. Teams receiving a BYE automatically advance to Round 2, ensuring standard single-elimination play for subsequent rounds.
- **Live Roster Modifications**: Edit team names or swap/replace players directly from the tournament dashboard, with changes instantly reflected across the entire active bracket.
- **Mobile First Design**: Fully responsive layout with touch-friendly controls. The bracket display supports smooth horizontal scrolling on smaller screens.