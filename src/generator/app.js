/**
 * Tournament Live Generator - Core Logic
 * Purpose: Manages the interactive state, local storage persistence, internationalization (i18n),
 * dynamic tournament bracket compilation, live score updating, and roster editing.
 */

const I18N = {
    de: {
        subTitle: "Setup & Roster",
        setupTitle: "1. Modus & Größe",
        autoPool: "Auto-Pool",
        directEntry: "Direkt",
        teamSize: "Team-Größe",
        peoplePerTeam: "Personen / Team",
        rosterTitle: "2. Teilnehmer",
        poolPlaceholder: "Namen hier eingeben (einer pro Zeile)...",
        addTeam: "+ Hinzufügen",
        createBtn: "Turnier Erstellen",
        rerollBtn: "Mischen",
        setupBtn: "Setup",
        nextGame: "Nächstes Spiel",
        teamsTitle: "Teams & Kader",
        noMembers: "Keine Mitglieder",
        bye: "FREILOS",
        tbd: "TBD",
        pending: "WARTET",
        confirmReroll: "Neu mischen und Teams neu generieren?",
        editTeamTitle: "Team Bearbeiten",
        teamNamePlaceholder: "Team Name",
        membersPlaceholder: "Mitglieder (kommagetrennt)",
        saveBtn: "Speichern",
        cancelBtn: "Abbrechen",
        needTwoNames: "Mind. 2 Namen nötig.",
        needTwoTeams: "Mind. 2 Teams nötig.",
        grandFinals: "Finale",
        roundName: "Runde {n}",
        teamEmptyAlert: "Teamname darf nicht leer sein."
    },
    en: {
        subTitle: "Setup & Roster",
        setupTitle: "1. Mode & Size",
        autoPool: "Auto-Pool",
        directEntry: "Direct",
        teamSize: "Team Size",
        peoplePerTeam: "People / Team",
        rosterTitle: "2. Roster",
        poolPlaceholder: "Enter names here (one per line)...",
        addTeam: "+ Add Entry",
        createBtn: "Create Tournament",
        rerollBtn: "Reroll",
        setupBtn: "Setup",
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
        needTwoNames: "At least 2 names required.",
        needTwoTeams: "At least 2 teams required.",
        grandFinals: "Grand Finals",
        roundName: "Round {n}",
        teamEmptyAlert: "Team name cannot be empty."
    }
};

const App = {
    // Application state
    state: {
        mode: 'auto',
        size: 1,
        manualEntries: [
            { id: 1, name: 'Team Alpha', members: 'S1, S2' },
            { id: 2, name: 'Team Beta', members: 'S3, S4' }
        ],
        teams: [],
        bracket: null,
        lang: 'de',
        editingTeamId: null
    },

    /**
     * Initialisiert die Anwendung, stellt den gespeicherten Zustand wieder her und setzt die Sprache.
     */
    init() {
        const savedLang = localStorage.getItem('tbg_lang') || 'de';
        this.state.lang = savedLang;

        this.restoreSavedState();
        this.setLanguage(this.state.lang);
    },

    /**
     * Stellt den Anwendungszustand aus dem LocalStorage wieder her, falls vorhanden.
     */
    restoreSavedState() {
        const saved = localStorage.getItem('tbg_state_v2');
        if (!saved) return;

        const parsed = JSON.parse(saved);
        this.state.mode = parsed.mode || 'auto';
        this.state.size = parsed.size || 1;
        this.state.manualEntries = parsed.manualEntries || this.state.manualEntries;
        this.state.lang = parsed.lang || this.state.lang;
        
        document.getElementById('pool-input').value = parsed.poolInput || '';
        
        if (parsed.view === 'tournament' && parsed.bracket && parsed.teams) {
            this.state.teams = parsed.teams;
            this.state.bracket = parsed.bracket;
            
            // Verknüpfe Objekt-Referenzen wieder
            this.state.bracket.rounds.forEach(round => {
                round.matches.forEach(match => {
                    if (match.team1) match.team1 = this.state.teams.find(t => t.id === match.team1.id) || match.team1;
                    if (match.team2) match.team2 = this.state.teams.find(t => t.id === match.team2.id) || match.team2;
                    if (match.winner) match.winner = this.state.teams.find(t => t.id === match.winner.id) || match.winner;
                });
            });
            
            document.getElementById('setup-view').classList.add('hidden');
            document.getElementById('tournament-view').classList.remove('hidden');
        }
    },

    /**
     * Hilfsfunktion zum Aktualisieren aller Sprachelemente in den views.
     * @param {object} t - Das i18n Übersetzungsobjekt.
     */
    updateLanguageLabels(t) {
        document.getElementById('brand-sub').innerText = t.subTitle;
        document.getElementById('setup-title').innerText = t.setupTitle;
        document.getElementById('tab-auto').innerText = t.autoPool;
        document.getElementById('tab-manual').innerText = t.directEntry;
        document.getElementById('size-title').innerText = t.teamSize;
        document.getElementById('size-sub').innerText = t.peoplePerTeam;
        document.getElementById('roster-title').innerText = t.rosterTitle;
        document.getElementById('pool-input').placeholder = t.poolPlaceholder;
        document.getElementById('btn-add-manual').innerText = t.addTeam;
        document.getElementById('btn-generate').innerText = t.createBtn;
        
        document.getElementById('btn-reroll').innerText = t.rerollBtn;
        document.getElementById('btn-setup').innerText = t.setupBtn;
        document.getElementById('teams-title').innerText = t.teamsTitle;
        document.getElementById('next-game-label').innerText = t.nextGame;
    },

    /**
     * Hilfsfunktion zum Aktualisieren der modal-spezifischen i18n-Beschriftungen.
     * @param {object} t - Das i18n Übersetzungsobjekt.
     */
    updateModalLabels(t) {
        document.getElementById('modal-title').innerText = t.editTeamTitle;
        document.getElementById('modal-label-name').innerText = t.teamNamePlaceholder;
        document.getElementById('modal-label-members').innerText = t.membersPlaceholder;
        document.getElementById('edit-team-name').placeholder = t.teamNamePlaceholder;
        document.getElementById('edit-team-members').placeholder = t.membersPlaceholder;
        document.getElementById('modal-btn-cancel').innerText = t.cancelBtn;
        document.getElementById('modal-btn-save').innerText = t.saveBtn;
    },

    /**
     * Setzt die aktive Sprache der App und aktualisiert die Benutzeroberfläche.
     * @param {string} lang - Gewählte Sprache ('de' oder 'en').
     */
    setLanguage(lang) {
        this.state.lang = lang;
        localStorage.setItem('tbg_lang', lang);
        
        const t = I18N[lang];
        this.updateLanguageLabels(t);
        this.updateModalLabels(t);
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.innerText = lang === 'de' ? 'EN' : 'DE';
        });

        if (this.state.bracket) {
            this.renderTournament();
        } else {
            this.renderSetup();
        }
    },

    /**
     * Wechselt die Sprache zwischen DE und EN und speichert die Auswahl.
     */
    toggleLang() {
        this.setLanguage(this.state.lang === 'de' ? 'en' : 'de');
        this.save();
    },

    /**
     * Sichert den aktuellen Zustand der Anwendung im LocalStorage.
     */
    save() {
        const data = {
            mode: this.state.mode,
            size: this.state.size,
            manualEntries: this.state.manualEntries,
            poolInput: document.getElementById('pool-input').value,
            teams: this.state.teams,
            bracket: this.state.bracket,
            view: this.state.bracket ? 'tournament' : 'setup',
            lang: this.state.lang
        };
        localStorage.setItem('tbg_state_v2', JSON.stringify(data));
    },

    /**
     * Ändert den Eingabemodus für Teams.
     * @param {string} m - Der ausgewählte Modus ('auto' oder 'manual').
     */
    setMode(m) {
        this.state.mode = m;
        document.getElementById('tab-auto').classList.toggle('active', m === 'auto');
        document.getElementById('tab-manual').classList.toggle('active', m === 'manual');
        document.getElementById('view-auto').classList.toggle('hidden', m !== 'auto');
        document.getElementById('view-manual').classList.toggle('hidden', m !== 'manual');
        this.save();
    },

    /**
     * Ändert die Größe der Teams für die automatische Einteilung.
     * @param {number} d - Differenzwert.
     */
    changeSize(d) {
        this.state.size = Math.max(1, this.state.size + d);
        document.getElementById('size-display').innerText = this.state.size;
        this.save();
    },

    /**
     * Fügt einen neuen manuellen Teameintrag im Setup hinzu.
     */
    addManualEntry() {
        this.state.manualEntries.push({ 
            id: Date.now(), 
            name: `Team ${(this.state.manualEntries.length + 1)}`, 
            members: '' 
        });
        this.renderSetup();
        this.save();
    },

    /**
     * Aktualisiert den Wert eines manuellen Teameintrags.
     * @param {number} id - Eintrags-ID.
     * @param {string} field - Feld ('name' oder 'members').
     * @param {string} value - Neuer Wert.
     */
    updateManual(id, field, value) {
        const entry = this.state.manualEntries.find(e => e.id === id);
        if (entry) entry[field] = value;
        this.save();
    },

    /**
     * Entfernt einen manuellen Teameintrag im Setup.
     * @param {number} id - Eintrags-ID.
     */
    removeManual(id) {
        this.state.manualEntries = this.state.manualEntries.filter(e => e.id !== id);
        this.renderSetup();
        this.save();
    },

    /**
     * Rendert die Liste der manuellen Einträge im Setup-Bereich.
     */
    renderSetup() {
        document.getElementById('size-display').innerText = this.state.size;
        const list = document.getElementById('manual-list');
        list.innerHTML = '';
        this.state.manualEntries.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'manual-entry-row flex gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800';
            div.innerHTML = `
                <input type="text" value="${entry.name}" placeholder="${I18N[this.state.lang].teamNamePlaceholder}" class="input-field flex-1 p-2 text-xs font-black uppercase" oninput="App.updateManual(${entry.id}, 'name', this.value)">
                <input type="text" value="${entry.members}" placeholder="${I18N[this.state.lang].membersPlaceholder}" class="input-field flex-[2] p-2 text-xs" oninput="App.updateManual(${entry.id}, 'members', this.value)">
                <button onclick="App.removeManual(${entry.id})" class="text-red-500 px-2 font-black text-lg">×</button>
            `;
            list.appendChild(div);
        });
    },

    /**
     * Mischt ein Array nach dem Fisher-Yates-Prinzip.
     * @param {Array} array - Eingabe-Array.
     * @returns {Array} Gemischtes Array.
     */
    shuffle(array) {
        let curr = array.length, rand;
        while (curr != 0) {
            rand = Math.floor(Math.random() * curr);
            curr--;
            [array[curr], array[rand]] = [array[rand], array[curr]];
        }
        return array;
    },

    /**
     * Hilfsfunktion zum Einlesen der Teams aus der Benutzeroberfläche.
     * @returns {Array|null} Liste der Teams oder null bei Fehlern.
     */
    getTeamsFromInput() {
        const t = I18N[this.state.lang];
        if (this.state.mode === 'auto') {
            const raw = document.getElementById('pool-input').value.split('\n').map(n => n.trim()).filter(n => n);
            if (raw.length < 2) {
                alert(t.needTwoNames);
                return null;
            }
            const shuffled = this.shuffle([...raw]);
            const teams = [];
            for (let i = 0; i < shuffled.length; i += this.state.size) {
                teams.push({ 
                    id: `t-${i}`, 
                    name: `Team ${teams.length + 1}`, 
                    members: shuffled.slice(i, i + this.state.size) 
                });
            }
            return teams;
        } else {
            const teams = this.state.manualEntries
                .filter(e => e.name.trim())
                .map((e, index) => ({ 
                    id: `tm-${index}`, 
                    name: e.name, 
                    members: e.members.split(',').map(m => m.trim()).filter(m => m) 
                }));
            if (teams.length < 2) {
                alert(t.needTwoTeams);
                return null;
            }
            return teams;
        }
    },

    /**
     * Generiert das Turnier und wechselt in die Live-Turnieransicht.
     */
    generateTournament() {
        this.save();
        const teams = this.getTeamsFromInput();
        if (!teams) return;

        this.state.teams = teams;
        this.state.bracket = this.buildBracket(this.shuffle([...teams]));
        
        document.getElementById('setup-view').classList.add('hidden');
        document.getElementById('tournament-view').classList.remove('hidden');
        
        this.save();
        this.renderTournament();
    },

    /**
     * Setzt das Turnier zurück und mischt die Teams neu, falls vom User bestätigt.
     */
    reroll() { 
        if (confirm(I18N[this.state.lang].confirmReroll)) {
            this.generateTournament(); 
        }
    },

    /**
     * Kehrt aus der Turnier-Ansicht zur Setup-Ansicht zurück.
     */
    backToSetup() {
        this.state.bracket = null;
        this.state.teams = [];
        document.getElementById('tournament-view').classList.add('hidden');
        document.getElementById('setup-view').classList.remove('hidden');
        this.save();
        this.renderSetup();
    },

    /**
     * Berechnet die Bracket-Parameter (Runden, Zweierpotenz-Größe, aktive Erstrundenteams).
     * @param {number} count - Team-Anzahl.
     */
    calculateBracketParams(count) {
        const rCount = Math.ceil(Math.log2(count));
        const bSize = Math.pow(2, rCount);
        const activeTeamsCount = 2 * count - bSize;
        return { rCount, bSize, activeTeamsCount };
    },

    /**
     * Baut die erste Runde des Brackets unter Berücksichtigung von Freilosen.
     * @param {Array} teams - Die gemischten Teams.
     * @param {number} bSize - Größe der ersten Runde (Zweierpotenz).
     * @param {number} activeTeamsCount - Anzahl aktiv spielender Teams.
     * @param {number} count - Reale Team-Anzahl.
     */
    buildRound1(teams, bSize, activeTeamsCount, count) {
        const r1 = [];
        let teamIndex = 0;
        for (let i = 0; i < bSize / 2; i++) {
            let team1 = null;
            let team2 = null;
            let winner = null;

            if (teamIndex < activeTeamsCount) {
                team1 = teams[teamIndex++];
                team2 = teams[teamIndex++];
            } else if (teamIndex < count) {
                team1 = teams[teamIndex++];
                team2 = null; // BYE
                winner = team1; // Automatisch weiter
            }

            r1.push({ id: `r0-m${i}`, team1, team2, winner });
        }
        return r1;
    },

    /**
     * Baut die nachfolgenden Runden (Runde 2 bis Finale) mit leeren Match-Slots auf.
     * @param {Array} rounds - Runden-Array.
     * @param {number} rCount - Rundenanzahl.
     * @param {number} bSize - Bracket-Größe.
     */
    buildSubsequentRounds(rounds, rCount, bSize) {
        for (let r = 1; r < rCount; r++) {
            const matches = [];
            const matchesInRound = bSize / Math.pow(2, r + 1);
            for (let m = 0; m < matchesInRound; m++) {
                const match = { id: `r${r}-m${m}`, team1: null, team2: null, winner: null };
                const p1 = rounds[r-1].matches[m*2];
                const p2 = rounds[r-1].matches[m*2 + 1];
                
                if (p1.winner) match.team1 = p1.winner;
                if (p2.winner) match.team2 = p2.winner;

                matches.push(match);
            }
            rounds.push({ matches });
        }
    },

    /**
     * Generiert die Turnierstruktur (Runden und leere Paarungen) aus der Team-Liste.
     * @param {Array} teams - Turnierteilnehmer.
     * @returns {object|null} Turniertree-Objekt.
     */
    buildBracket(teams) {
        const count = teams.length;
        if (count < 2) return null;

        const { rCount, bSize, activeTeamsCount } = this.calculateBracketParams(count);
        const r1 = this.buildRound1(teams, bSize, activeTeamsCount, count);
        const rounds = [{ matches: r1 }];
        
        this.buildSubsequentRounds(rounds, rCount, bSize);
        return { rounds };
    },

    /**
     * Öffnet das Editor-Modal für Teamname und Spielerliste.
     * @param {string|number} teamId - Team-ID.
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
     * Schließt das Editor-Modal ohne Speicherung.
     */
    closeEditModal() {
        this.state.editingTeamId = null;
        document.getElementById('edit-modal').classList.add('hidden');
    },

    /**
     * Speichert Änderungen aus dem Editor-Modal und rendert die Ansicht neu.
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
            
            this.save();
            this.renderTournament();
        }
        this.closeEditModal();
    },

    /**
     * Rendert die Liste der Teams mit deren Mitgliedern am Kopf der Seite.
     * @param {object} t - i18n Übersetzungswörterbuch.
     */
    renderTeams(t) {
        const teamsDiv = document.getElementById('teams-display');
        teamsDiv.innerHTML = '';
        this.state.teams.forEach(teamObj => {
            const b = document.createElement('div');
            b.className = 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-xl flex flex-col min-w-[140px] shadow-sm flex-shrink-0 cursor-pointer hover:border-blue-500 transition-colors';
            b.onclick = () => this.openEditModal(teamObj.id);
            
            const members = teamObj.members.join(', ') || t.noMembers;
            b.innerHTML = `
                <span class="text-[10px] font-black uppercase text-slate-800 dark:text-slate-100 truncate">${members}</span>
                <div class="flex justify-between items-center mt-1">
                    <span class="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">${teamObj.name}</span>
                    <span class="text-[8px] opacity-40">✏️</span>
                </div>
            `;
            teamsDiv.appendChild(b);
        });
    },

    /**
     * Baut das Bracket (die Spalten und Match-Boxen) visuell auf.
     * @param {object} t - i18n Übersetzungswörterbuch.
     * @param {object|null} nextMatchInfo - Infos zum nächsten aktiven Match.
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
     * Erstellt eine Spalte für eine bestimmte Runde im Bracket.
     * @param {object} round - Das Runden-Datenobjekt.
     * @param {number} rIdx - Rundenindex.
     * @param {object} t - i18n Übersetzungswörterbuch.
     * @param {object|null} nextMatchInfo - Nächstes Match.
     */
    renderRoundCol(round, rIdx, t, nextMatchInfo) {
        const col = document.createElement('div');
        col.className = 'round-col';
        
        let roundName = '';
        const totalRounds = this.state.bracket.rounds.length;
        if (rIdx === totalRounds - 1) {
            roundName = t.grandFinals;
        } else {
            roundName = t.roundName.replace('{n}', rIdx + 1);
        }
        col.innerHTML = `<div class="text-center font-black text-slate-400 uppercase text-[8px] tracking-widest mb-4">${roundName}</div>`;
        
        round.matches.forEach((match, mIdx) => {
            const box = this.renderMatchBox(match, mIdx, rIdx, t, nextMatchInfo);
            col.appendChild(box);
        });
        return col;
    },

    /**
     * Erstellt eine Match-Kachel.
     * @param {object} match - Das Match-Datenobjekt.
     * @param {number} mIdx - Match-Index.
     * @param {number} rIdx - Runden-Index.
     * @param {object} t - i18n Übersetzungswörterbuch.
     * @param {object|null} nextMatchInfo - Nächstes Match.
     */
    renderMatchBox(match, mIdx, rIdx, t, nextMatchInfo) {
        const box = document.createElement('div');
        const isNext = nextMatchInfo && nextMatchInfo.match.id === match.id;
        box.className = `match ${isNext ? 'highlight-next' : ''}`;
        
        [match.team1, match.team2].forEach((team, tIdx) => {
            const slot = this.renderSlot(match, mIdx, rIdx, team, tIdx, t);
            box.appendChild(slot);
        });
        return box;
    },

    /**
     * Erstellt einen Team-Slot innerhalb einer Match-Kachel.
     * @param {object} match - Das Match-Datenobjekt.
     * @param {number} mIdx - Match-Index.
     * @param {number} rIdx - Runden-Index.
     * @param {object|null} team - Das Team in diesem Slot.
     * @param {number} tIdx - Slot-Index (0 für oben, 1 für unten).
     * @param {object} t - i18n Übersetzungswörterbuch.
     */
    renderSlot(match, mIdx, rIdx, team, tIdx, t) {
        const isSecondSlot = tIdx === 1;
        const isByeSlot = !team && (rIdx === 0 && ((isSecondSlot && match.team1 && !match.team2) || (!isSecondSlot && !match.team1 && match.team2)));
        const win = match.winner && team && match.winner.id === team.id;
        const slot = document.createElement('div');
        slot.className = `slot ${win ? 'winner' : ''}`;
        
        const nameLabel = team ? team.name : (isByeSlot ? t.bye : t.tbd);
        const membersLabel = team ? team.members.join(', ') : '';

        slot.innerHTML = `
            <div class="flex justify-between items-center relative pr-4">
                <div class="flex flex-col truncate">
                    <span class="text-[10px] font-black uppercase truncate ${team ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 italic'}">${membersLabel || nameLabel}</span>
                    ${team ? `<span class="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">${nameLabel}</span>` : ''}
                </div>
                ${team ? `<button onclick="event.stopPropagation(); App.openEditModal('${team.id}')" class="text-slate-400 hover:text-blue-500 text-[8px] absolute right-0">✏️</button>` : ''}
            </div>
        `;
        
        if (team && !match.winner) {
            slot.onclick = () => this.setWinner(rIdx, mIdx, team);
        } else if (win) {
            slot.onclick = () => this.setWinner(rIdx, mIdx, null);
        }
        return slot;
    },

    /**
     * Hauptmethode zum Rendern des gesamten Turniers (Teams, Nächstes Spiel, Bracket).
     */
    renderTournament() {
        const t = I18N[this.state.lang];
        this.renderTeams(t);
        
        const nextMatchInfo = this.findNextMatch();
        this.renderNextGame(nextMatchInfo);
        this.renderBracket(t, nextMatchInfo);
    },

    /**
     * Ermittelt das nächste anstehende aktive Spiel.
     * @returns {object|null} Match-Informationen oder null.
     */
    findNextMatch() {
        for (let r = 0; r < this.state.bracket.rounds.length; r++) {
            const round = this.state.bracket.rounds[r];
            for (const match of round.matches) {
                if (!match.winner && match.team1 && match.team2) {
                    return { roundName: I18N[this.state.lang].roundName.replace('{n}', r + 1), match };
                }
            }
        }
        return null;
    },

    /**
     * Rendert das Info-Banner des nächsten aktiven Spiels.
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
     * Setzt oder löscht den Sieger eines Matches und aktualisiert Folge-Slots rekursiv.
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
        this.save();
        this.renderTournament();
    },

    /**
     * Rekursive Löschung von nachfolgenden Slots bei Sieger-Rücknahme.
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
