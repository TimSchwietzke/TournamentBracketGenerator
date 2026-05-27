/**
 * Tournament Bracket Builder - Core Logic
 * Purpose: Manages state, event handlers, and input parsing for the setup view.
 * Compiles and downloads a standalone tournament live-engine with embedded data.
 * References: window.I18N and window.BracketGenerator
 */

const App = {
    // Application state
    state: { 
        mode: 'auto', 
        size: 1, 
        manual: [
            { id: 1, name: 'TEAM-01', members: '' }, 
            { id: 2, name: 'TEAM-02', members: '' }
        ],
        lang: 'de'
    },
    
    /**
     * Initialisiert die Anwendung, lädt die Spracheinstellung und wendet sie an.
     */
    init() { 
        const savedLang = localStorage.getItem('tbg_lang') || 'de';
        this.state.lang = savedLang;
        this.setLanguage(this.state.lang);
    },

    /**
     * Setzt die aktive Sprache der Benutzeroberfläche und speichert die Auswahl.
     * @param {string} lang - Die gewählte Sprache ('de' oder 'en').
     */
    setLanguage(lang) {
        this.state.lang = lang;
        localStorage.setItem('tbg_lang', lang);
        
        const t = I18N[lang];
        document.getElementById('brand-sub').innerText = t.subTitle;
        document.getElementById('setup-title').innerText = t.setupTitle;
        document.getElementById('tab-auto').innerText = t.autoPool;
        document.getElementById('tab-manual').innerText = t.directEntry;
        document.getElementById('size-title').innerText = t.teamSize;
        document.getElementById('size-sub').innerText = t.peoplePerTeam;
        document.getElementById('roster-title').innerText = t.rosterTitle;
        document.getElementById('pool-input').placeholder = t.poolPlaceholder;
        document.getElementById('btn-add-manual').innerText = t.addTeam;
        document.getElementById('step3-title').innerText = t.step3Title;
        document.getElementById('btn-download').innerText = t.downloadBtn;
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.innerText = lang === 'de' ? 'EN' : 'DE';
        });

        this.render();
    },

    /**
     * Wechselt zwischen den unterstützten Sprachen (Deutsch/Englisch).
     */
    toggleLang() {
        this.setLanguage(this.state.lang === 'de' ? 'en' : 'de');
    },

    /**
     * Ändert den Eingabemodus für Teams (Auto-Pool vs. Direkt).
     * @param {string} m - Der ausgewählte Modus ('auto' oder 'manual').
     */
    setMode(m) {
        this.state.mode = m;
        document.getElementById('tab-auto').classList.toggle('active', m === 'auto');
        document.getElementById('tab-manual').classList.toggle('active', m === 'manual');
        document.getElementById('view-auto').classList.toggle('hidden', m !== 'auto');
        document.getElementById('view-manual').classList.toggle('hidden', m !== 'manual');
        if (m === 'manual') this.render();
    },

    /**
     * Ändert die Gruppengröße für die automatische Teamgenerierung.
     * @param {number} d - Differenzwert (in der Regel +1 oder -1).
     */
    changeSize(d) {
        this.state.size = Math.max(1, this.state.size + d);
        document.getElementById('size-display').innerText = this.state.size;
    },

    /**
     * Fügt ein neues leeres Team-Objekt zur manuellen Liste hinzu.
     */
    add() {
        this.state.manual.push({ 
            id: Date.now(), 
            name: `TEAM-${(this.state.manual.length+1).toString().padStart(2,'0')}`, 
            members: '' 
        });
        this.render();
    },

    /**
     * Aktualisiert den Wert eines bestimmten Feldes eines manuellen Teams.
     * @param {number} id - ID des zu aktualisierenden Teams.
     * @param {string} f - Name des Feldes ('name' oder 'members').
     * @param {string} v - Neuer Wert.
     */
    update(id, f, v) {
        const t = this.state.manual.find(x => x.id === id);
        if (t) t[f] = v;
    },

    /**
     * Entfernt ein Team aus der manuellen Liste.
     * @param {number} id - ID des zu entfernenden Teams.
     */
    remove(id) {
        this.state.manual = this.state.manual.filter(x => x.id !== id);
        this.render();
    },

    /**
     * Rendert die Liste der manuell erstellten Teams in der Benutzeroberfläche.
     */
    render() {
        const c = document.getElementById('manual-list');
        if (!c) return;
        c.innerHTML = '';
        this.state.manual.forEach(t => {
            const d = document.createElement('div');
            d.className = 'flex gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800';
            d.innerHTML = `
                <input type="text" value="${t.name}" placeholder="${I18N[this.state.lang].teamPlaceholder}" class="input-field flex-1 p-2 text-xs font-black uppercase" oninput="App.update(${t.id}, 'name', this.value)">
                <input type="text" value="${t.members}" placeholder="${I18N[this.state.lang].membersPlaceholder}" class="input-field flex-[2] p-2 text-xs" oninput="App.update(${t.id}, 'members', this.value)">
                <button onclick="App.remove(${t.id})" class="text-red-500 px-2 font-black text-lg">×</button>
            `;
            c.appendChild(d);
        });
    },

    /**
     * Mischt ein Array nach dem Fisher-Yates-Algorithmus (3 Durchgänge für optimale Durchmischung).
     * @param {Array} a - Das zu mischende Array.
     * @returns {Array} Das gemischte Array.
     */
    shuffle(a) {
        for (let p=0; p<3; p++) {
            for (let i=a.length-1; i>0; i--) {
                const j = Math.floor(Math.random()*(i+1));
                [a[i], a[j]] = [a[j], a[i]];
            }
        }
        return a;
    },

    /**
     * Generiert Teams automatisch aus der eingegebenen Namensliste.
     * @param {Array} raw - Bereinigte Namensliste.
     * @returns {Array} Array von Team-Objekten.
     */
    createTeamsFromPool(raw) {
        const s = this.shuffle([...raw]);
        const teams = [];
        for (let i = 0; i < s.length; i += this.state.size) {
            teams.push({
                id: `t-${i}`,
                name: `TEAM-${(teams.length + 1).toString().padStart(2, '0')}`,
                members: s.slice(i, i + this.state.size)
            });
        }
        return teams;
    },

    /**
     * Liest die Teams basierend auf dem gewählten Modus ein.
     * @returns {Array|null} Array von Team-Objekten oder null bei Validierungsfehlern.
     */
    getTeamsFromInput() {
        const t = I18N[this.state.lang];
        if (this.state.mode === 'auto') {
            const raw = document.getElementById('pool-input').value.split('\n').map(n => n.trim()).filter(n => n);
            if (raw.length < 2) {
                alert(t.needTwoNames);
                return null;
            }
            return this.createTeamsFromPool(raw);
        }
        const teams = this.state.manual
            .filter(x => x.name.trim() && x.members.trim())
            .map((x, i) => ({
                id: `tm-${i}`,
                name: x.name,
                members: x.members.split(',').map(m => m.trim()).filter(m => m)
            }));
        if (teams.length < 2) {
            alert(t.needTwoTeams);
            return null;
        }
        return teams;
    },

    /**
     * Startet den Download der fertig compilierten eigenständigen HTML-Datei.
     * Generiert das Turniertree und bettet es in das HTML-Template ein.
     */
    download() {
        const teams = this.getTeamsFromInput();
        if (!teams) return;

        const shuffledTeams = this.shuffle([...teams]);
        const bracket = BracketGenerator.build(shuffledTeams);
        const jsonTeams = JSON.stringify(shuffledTeams);
        const jsonBracket = JSON.stringify(bracket);

        const html = this.getEmbeddedTemplate(jsonTeams, jsonBracket);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tournament_pro.html';
        a.click();
    },

    /**
     * Gibt das HTML-Template für die eigenständige Live-Turnier-App zurück.
     * @param {string} jsonTeams - Teams als JSON-String.
     * @param {string} jsonBracket - Turniertree als JSON-String.
     * @returns {string} Das komplette compilierte HTML.
     */
    getEmbeddedTemplate(jsonTeams, jsonBracket) {
        return `<!DOCTYPE html>
<html lang="${this.state.lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Tournament Pro - Bracket</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script>
        tailwind.config = { darkMode: 'class' }
    <\/script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #f8fafc;
            --card: #ffffff;
            --text: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --accent: #3b82f6;
            --input-bg: #f1f5f9;
        }
        .dark {
            --bg: #020617;
            --card: #0f172a;
            --text: #f1f5f9;
            --text-muted: #94a3b8;
            --border: #1e293b;
            --accent: #60a5fa;
            --input-bg: #1e293b;
        }

        body { 
            background-color: var(--bg); 
            color: var(--text);
            font-family: 'Inter', sans-serif;
            transition: background 0.3s ease, color 0.3s ease;
            min-height: 100vh;
            margin: 0;
            -webkit-tap-highlight-color: transparent;
        }

        h1, h2, h3, h4, p, span, div, textarea, input { color: var(--text); }
        .label-text { color: var(--text-muted) !important; }
        .accent-text { color: var(--accent) !important; }

        .card {
            background-color: var(--card);
            border: 1px solid var(--border);
            border-radius: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .input-field {
            background-color: var(--input-bg);
            border: 2px solid transparent;
            border-radius: 0.75rem;
            color: var(--text) !important;
            padding: 0.75rem;
            outline: none;
            width: 100%;
            font-size: 16px;
        }
        .input-field:focus { background-color: var(--card); border-color: var(--accent); }

        .theme-toggle {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            z-index: 100;
            background-color: var(--card);
            border: 1px solid var(--border);
            padding: 0.75rem;
            border-radius: 99px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            cursor: pointer;
        }

        /* Next Game Display */
        .next-game-banner {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white !important;
            border-radius: 1rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
        }
        .next-game-banner * { color: white !important; }

        /* Bracket Styles */
        .match {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            margin-bottom: 1rem;
            overflow: hidden;
            width: 200px;
            flex-shrink: 0;
            transition: border-color 0.3s;
        }
        .match.highlight-next {
            border: 2px solid var(--accent);
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
        }
        .slot {
            padding: 0.6rem;
            cursor: pointer;
            border-left: 3px solid transparent;
            transition: all 0.2s;
        }
        .slot.winner {
            background-color: rgba(59, 130, 246, 0.1);
            border-left-color: var(--accent);
        }
        .round-col {
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            padding: 0 1rem;
            min-width: 220px;
        }
        .bracket-container {
            display: flex;
            overflow-x: auto;
            padding: 1rem;
            min-height: 400px;
            align-items: center;
            -webkit-overflow-scrolling: touch;
        }

        /* Mobile adjustments */
        @media (max-width: 640px) {
            .round-col { padding: 0 0.5rem; min-width: 180px; }
            .match { width: 170px; }
            .theme-toggle { bottom: 1rem; right: 1rem; }
        }

        .bg-glow {
            position: fixed;
            width: 100vw;
            height: 100vw;
            background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
            opacity: 0.03;
            filter: blur(60px);
            z-index: -1;
            pointer-events: none;
        }
        .hidden { display: none !important; }
    </style>
</head>
<body class="dark flex flex-col min-h-screen">
    <div class="bg-glow" style="top: -20%; left: -20%;"></div>

    <!-- THEME TOGGLE -->
    <button class="theme-toggle" onclick="App.toggleTheme()">
        <svg id="sun-icon" class="w-5 h-5 hidden" fill="currentColor" viewBox="0 0 20 20" style="color: #fbbf24;"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
        <svg id="moon-icon" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style="color: #818cf8;"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
    </button>

    <header class="p-4 sm:p-5 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg sticky top-0 z-50">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h1 class="text-lg font-black uppercase tracking-tighter">Live<span class="accent-text">Bracket</span></h1>
        </div>
        <div>
            <button onclick="App.toggleLang()" class="lang-btn p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-slate-200">DE / EN</button>
        </div>
    </header>

    <main class="flex-1 overflow-hidden flex flex-col p-4 sm:p-6 space-y-4">
        <!-- Next Game Display -->
        <div id="next-game-container" class="hidden">
            <div class="next-game-banner">
                <div class="flex justify-between items-center mb-2">
                    <span id="next-game-label" class="text-[10px] font-black uppercase tracking-widest opacity-80">Nächstes Spiel</span>
                    <span id="next-game-round" class="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">Runde 1</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <div class="flex-1 text-center">
                        <p id="next-team1-name" class="font-black text-sm uppercase truncate">Team A</p>
                        <p id="next-team1-members" class="text-[9px] opacity-70 truncate">Spieler...</p>
                    </div>
                    <div class="font-black text-xl italic opacity-50">VS</div>
                    <div class="flex-1 text-center">
                        <p id="next-team2-name" class="font-black text-sm uppercase truncate">Team B</p>
                        <p id="next-team2-members" class="text-[9px] opacity-70 truncate">Spieler...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Teams Section -->
        <section class="card p-4 overflow-hidden">
            <h2 id="teams-title" class="text-[9px] font-black uppercase tracking-[0.2em] label-text mb-3">Teams & Kader</h2>
            <div id="teams-display" class="flex overflow-x-auto gap-3 pb-2 scrollbar-hide"></div>
        </section>

        <!-- Bracket Section -->
        <div id="bracket-scroller" class="flex-1 overflow-auto rounded-3xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800">
            <div id="bracket-root" class="bracket-container"></div>
        </div>
    </main>

    <!-- EDIT TEAM MODAL -->
    <div id="edit-modal" class="hidden fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <div class="card p-6 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 class="text-sm font-black uppercase tracking-wider mb-4" id="modal-title">Team Bearbeiten</h3>
            <div class="space-y-4">
                <div>
                    <label class="text-[10px] font-black uppercase label-text mb-1 block" id="modal-label-name">Team Name</label>
                    <input type="text" id="edit-team-name" class="input-field w-full text-xs font-black uppercase">
                </div>
                <div>
                    <label class="text-[10px] font-black uppercase label-text mb-1 block" id="modal-label-members">Mitglieder</label>
                    <input type="text" id="edit-team-members" class="input-field w-full text-xs">
                </div>
                <div class="flex gap-3 mt-6">
                    <button onclick="App.closeEditModal()" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs uppercase" id="modal-btn-cancel">Abbrechen</button>
                    <button onclick="App.saveTeamEdit()" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase" id="modal-btn-save">Speichern</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        /**
         * Standalone Tournament Live Engine - Javascript Logic
         * Purpose: Manages live tournament execution, scoring, roster swapping, and view updates.
         */

        const I18N = {
            de: {
                nextGame: "Nächstes Spiel",
                teamsTitle: "Teams & Kader",
                noMembers: "Keine Mitglieder",
                bye: "FREILOS",
                tbd: "TBD",
                pending: "WARTET",
                editTeamTitle: "Team Bearbeiten",
                teamNamePlaceholder: "Team Name",
                membersPlaceholder: "Mitglieder (kommagetrennt)",
                saveBtn: "Speichern",
                cancelBtn: "Abbrechen",
                grandFinals: "Finale",
                roundName: "Runde {n}",
                teamEmptyAlert: "Teamname darf nicht leer sein."
            },
            en: {
                nextGame: "Next Game",
                teamsTitle: "Teams & Roster",
                noMembers: "No members",
                bye: "BYE",
                tbd: "TBD",
                pending: "PENDING",
                editTeamTitle: "Edit Team",
                teamNamePlaceholder: "Team Name",
                membersPlaceholder: "Members (comma separated)",
                saveBtn: "Save",
                cancelBtn: "Cancel",
                grandFinals: "Grand Finals",
                roundName: "Round {n}",
                teamEmptyAlert: "Team name cannot be empty."
            }
        };

        const App = {
            // Live-Engine state containing imported parameters
            state: {
                teams: ${jsonTeams},
                bracket: ${jsonBracket},
                lang: "${this.state.lang}",
                editingTeamId: null
            },

            /**
             * Initialisiert die Live-Engine und verknüpft Team-Referenzen.
             */
            init() {
                this.state.bracket.rounds.forEach(round => {
                    round.matches.forEach(match => {
                        if (match.team1) match.team1 = this.state.teams.find(t => t.id === match.team1.id) || match.team1;
                        if (match.team2) match.team2 = this.state.teams.find(t => t.id === match.team2.id) || match.team2;
                        if (match.winner) match.winner = this.state.teams.find(t => t.id === match.winner.id) || match.winner;
                    });
                });
                
                this.setLanguage(this.state.lang);
            },

            /**
             * Setzt die aktive Sprache der Live-Engine.
             * @param {string} lang - Gewählte Sprache ('de' oder 'en').
             */
            setLanguage(lang) {
                this.state.lang = lang;
                const t = I18N[lang];
                
                document.getElementById('teams-title').innerText = t.teamsTitle;
                document.getElementById('next-game-label').innerText = t.nextGame;
                document.getElementById('modal-title').innerText = t.editTeamTitle;
                document.getElementById('modal-label-name').innerText = t.teamNamePlaceholder;
                document.getElementById('modal-label-members').innerText = t.membersPlaceholder;
                document.getElementById('edit-team-name').placeholder = t.teamNamePlaceholder;
                document.getElementById('edit-team-members').placeholder = t.membersPlaceholder;
                document.getElementById('modal-btn-cancel').innerText = t.cancelBtn;
                document.getElementById('modal-btn-save').innerText = t.saveBtn;
                
                document.querySelectorAll('.lang-btn').forEach(btn => {
                    btn.innerText = lang === 'de' ? 'EN' : 'DE';
                });

                this.renderTournament();
            },

            /**
             * Wechselt die Sprache zwischen DE und EN.
             */
            toggleLang() {
                this.setLanguage(this.state.lang === 'de' ? 'en' : 'de');
            },

            /**
             * Öffnet das Modal zum Bearbeiten eines Teams.
             * @param {string|number} teamId - ID des zu bearbeitenden Teams.
             */
            openEditModal(teamId) {
                const team = this.state.teams.find(t => t.id === teamId);
                if (!team) return;
                this.state.editingTeamId = teamId;
                
                document.getElementById('edit-team-name').value = team.name;
                document.getElementById('edit-team-members').value = team.members.join(', ');
                
                document.getElementById('edit-modal').classList.remove('hidden');
            },

            /**
             * Schließt das Modal zum Bearbeiten.
             */
            closeEditModal() {
                this.state.editingTeamId = null;
                document.getElementById('edit-modal').classList.add('hidden');
            },

            /**
             * Speichert die Änderungen am Namen und der Besetzung des Teams.
             */
            saveTeamEdit() {
                const teamId = this.state.editingTeamId;
                if (!teamId) return;
                const team = this.state.teams.find(t => t.id === teamId);
                if (team) {
                    const newName = document.getElementById('edit-team-name').value.trim();
                    const newMembers = document.getElementById('edit-team-members').value.split(',').map(m => m.trim()).filter(m => m);
                    
                    if (!newName) return alert(I18N[this.state.lang].teamEmptyAlert);
                    
                    team.name = newName;
                    team.members = newMembers;
                    this.renderTournament();
                }
                this.closeEditModal();
            },

            /**
             * Rendert die Team-Kacheln in der Kader-Sektion.
             * @param {object} t - Übersetzungs-Wörterbuch.
             */
            renderTeams(t) {
                const teamsDiv = document.getElementById('teams-display');
                teamsDiv.innerHTML = '';
                this.state.teams.forEach(teamObj => {
                    const b = document.createElement('div');
                    b.className = 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-xl flex flex-col min-w-[140px] shadow-sm flex-shrink-0 cursor-pointer hover:border-blue-500 transition-colors';
                    b.onclick = () => this.openEditModal(teamObj.id);
                    
                    const members = teamObj.members.join(', ') || t.noMembers;
                    b.innerHTML = \`
                        <span class="text-[10px] font-black uppercase text-slate-800 dark:text-slate-100 truncate">\${members}</span>
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">\${teamObj.name}</span>
                            <span class="text-[8px] opacity-40">✏️</span>
                        </div>
                    \`;
                    teamsDiv.appendChild(b);
                });
            },

            /**
             * Hilfsfunktion zum Rendern des gesamten Turniertrees.
             * @param {object} t - Übersetzungs-Wörterbuch.
             * @param {object|null} nextMatchInfo - Meta-Daten zum nächsten anstehenden Match.
             */
            renderBracket(t, nextMatchInfo) {
                const root = document.getElementById('bracket-root');
                root.innerHTML = '';
                this.state.bracket.rounds.forEach((round, rIdx) => {
                    const col = this.renderRoundCol(round, rIdx, t, nextMatchInfo);
                    root.appendChild(col);
                });
            },

            /**
             * Hilfsfunktion zum Erstellen einer Spalte (Runde) im Bracket.
             * @param {object} round - Runden-Objekt mit Matches.
             * @param {number} rIdx - Runden-Index.
             * @param {object} t - Übersetzungs-Wörterbuch.
             * @param {object|null} nextMatchInfo - Nächstes Match.
             * @returns {HTMLElement} Die erstellte Spalte.
             */
            renderRoundCol(round, rIdx, t, nextMatchInfo) {
                const col = document.createElement('div');
                col.className = 'round-col';
                
                let roundName = rIdx === this.state.bracket.rounds.length - 1 
                    ? t.grandFinals 
                    : t.roundName.replace('{n}', rIdx + 1);
                
                col.innerHTML = \`<div class="text-center font-black text-slate-400 uppercase text-[8px] tracking-widest mb-4">\${roundName}</div>\`;
                
                round.matches.forEach((match, mIdx) => {
                    const box = this.renderMatchBox(match, mIdx, rIdx, t, nextMatchInfo);
                    col.appendChild(box);
                });
                return col;
            },

            /**
             * Hilfsfunktion zum Erstellen einer einzelnen Match-Kachel (Box).
             * @param {object} match - Match-Objekt.
             * @param {number} mIdx - Match-Index innerhalb der Runde.
             * @param {number} rIdx - Runden-Index.
             * @param {object} t - Übersetzungs-Wörterbuch.
             * @param {object|null} nextMatchInfo - Nächstes Match.
             * @returns {HTMLElement} Der Match-Container.
             */
            renderMatchBox(match, mIdx, rIdx, t, nextMatchInfo) {
                const box = document.createElement('div');
                const isNext = nextMatchInfo && nextMatchInfo.match.id === match.id;
                box.className = \`match \${isNext ? 'highlight-next' : ''}\`;
                
                [match.team1, match.team2].forEach((team, tIdx) => {
                    const slot = this.renderSlot(match, mIdx, rIdx, team, tIdx, t);
                    box.appendChild(slot);
                });
                return box;
            },

            /**
             * Erstellt einen Team-Slot (Zeile) innerhalb eines Matches.
             * @param {object} match - Das Match.
             * @param {number} mIdx - Match-Index.
             * @param {number} rIdx - Runden-Index.
             * @param {object|null} team - Team in diesem Slot.
             * @param {number} tIdx - Slot-Index (0 für Team 1, 1 für Team 2).
             * @param {object} t - Übersetzungs-Wörterbuch.
             * @returns {HTMLElement} Der Slot-Container.
             */
            renderSlot(match, mIdx, rIdx, team, tIdx, t) {
                const isSecondSlot = tIdx === 1;
                const isByeSlot = !team && (rIdx === 0 && ((isSecondSlot && match.team1 && !match.team2) || (!isSecondSlot && !match.team1 && match.team2)));
                const win = match.winner && team && match.winner.id === team.id;
                const slot = document.createElement('div');
                slot.className = \`slot \${win ? 'winner' : ''}\`;
                
                const nameLabel = team ? team.name : (isByeSlot ? t.bye : t.tbd);
                const membersLabel = team ? team.members.join(', ') : '';

                slot.innerHTML = \`
                    <div class="flex justify-between items-center relative pr-4">
                        <div class="flex flex-col truncate">
                            <span class="text-[10px] font-black uppercase truncate \${team ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 italic'\}">\${membersLabel || nameLabel}</span>
                            \${team ? \`<span class="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">\${nameLabel}</span>\` : ''}
                        </div>
                        \${team ? \`<button onclick="event.stopPropagation(); App.openEditModal('\${team.id}')" class="text-slate-400 hover:text-blue-500 text-[8px] absolute right-0">✏️</button>\` : ''}
                    </div>
                \`;
                
                if (team && !match.winner) {
                    slot.onclick = () => this.setWinner(rIdx, mIdx, team);
                } else if (win) {
                    slot.onclick = () => this.setWinner(rIdx, mIdx, null);
                }
                return slot;
            },

            /**
             * Haupt-Rendermethode für das gesamte Live-Turnier.
             */
            renderTournament() {
                const t = I18N[this.state.lang];
                this.renderTeams(t);
                const nextMatchInfo = this.findNextMatch();
                this.renderNextGame(nextMatchInfo);
                this.renderBracket(t, nextMatchInfo);
            },

            /**
             * Ermittelt das nächste anstehende aktive Spiel (beide Teams gesetzt, kein Gewinner).
             * @returns {object|null} Match-Infos oder null.
             */
            findNextMatch() {
                for (let r = 0; r < this.state.bracket.rounds.length; r++) {
                    const round = this.state.bracket.rounds[r];
                    for (const match of round.matches) {
                        if (!match.winner && match.team1 && match.team2) {
                            return { 
                                roundName: I18N[this.state.lang].roundName.replace('{n}', r + 1), 
                                match 
                            };
                        }
                    }
                }
                return null;
            },

            /**
             * Rendert das Info-Banner des nächsten anstehenden Spiels.
             * @param {object|null} info - Match-Infos.
             */
            renderNextGame(info) {
                const container = document.getElementById('next-game-container');
                if (!info) {
                    container.classList.add('hidden');
                    return;
                }
                container.classList.remove('hidden');
                
                const t = I18N[this.state.lang];
                document.getElementById('next-game-round').innerText = info.roundName;
                
                document.getElementById('next-team1-name').innerText = info.match.team1.members.join(', ') || t.noMembers;
                document.getElementById('next-team1-members').innerText = info.match.team1.name;
                
                document.getElementById('next-team2-name').innerText = info.match.team2.members.join(', ') || t.noMembers;
                document.getElementById('next-team2-members').innerText = info.match.team2.name;
            },

            /**
             * Setzt oder löscht den Sieger eines Matches und aktualisiert Folge-Slots.
             * @param {number} rIdx - Runden-Index.
             * @param {number} mIdx - Match-Index.
             * @param {object|null} team - Siegerteam oder null zum Zurücksetzen.
             */
            setWinner(rIdx, mIdx, team) {
                const match = this.state.bracket.rounds[rIdx].matches[mIdx];
                match.winner = team;
                if (rIdx + 1 < this.state.bracket.rounds.length) {
                    const nextMatch = this.state.bracket.rounds[rIdx + 1].matches[Math.floor(mIdx / 2)];
                    if (mIdx % 2 === 0) {
                        if (team === null) this.clearDownstream(rIdx + 1, Math.floor(mIdx / 2), true);
                        else nextMatch.team1 = team;
                    } else {
                        if (team === null) this.clearDownstream(rIdx + 1, Math.floor(mIdx / 2), false);
                        else nextMatch.team2 = team;
                    }
                }
                this.renderTournament();
            },

            /**
             * Rekursive Funktion zum Löschen von nachfolgenden Slots bei Sieger-Rücknahme.
             * @param {number} rIdx - Runden-Index des betroffenen Folge-Matches.
             * @param {number} mIdx - Match-Index des betroffenen Folge-Matches.
             * @param {boolean} isT1 - Gibt an, ob Team 1 (true) oder Team 2 (false) gelöscht werden soll.
             */
            clearDownstream(rIdx, mIdx, isT1) {
                const m = this.state.bracket.rounds[rIdx].matches[mIdx];
                if (isT1) m.team1 = null; else m.team2 = null;
                m.winner = null;
                if (rIdx + 1 < this.state.bracket.rounds.length) {
                    this.clearDownstream(rIdx + 1, Math.floor(mIdx / 2), mIdx % 2 === 0);
                }
            },

            /**
             * Toggles dark mode class on the document body and updates icons.
             */
            toggleTheme() {
                document.body.classList.toggle('dark');
                const isDark = document.body.classList.contains('dark');
                document.getElementById('sun-icon').classList.toggle('hidden', !isDark);
                document.getElementById('moon-icon').classList.toggle('hidden', isDark);
            }
        };

        window.App = App;
        window.onload = () => App.init();
        window.toggleTheme = () => App.toggleTheme();
    <\/script>
</body>
</html>`;
    }
};

window.App = App;
window.setMode = (m) => App.setMode(m);
window.changeSize = (d) => App.changeSize(d);
window.addTeam = () => App.add();
window.processAndDownload = () => App.download();
window.toggleLang = () => App.toggleLang();
window.toggleTheme = () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('sun-icon').classList.toggle('hidden', !isDark);
    document.getElementById('moon-icon').classList.toggle('hidden', isDark);
};
window.onload = () => App.init();
