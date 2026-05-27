/**
 * Tournament Bracket Builder - Core Computational Logic
 * Purpose: Decoupled library responsible for calculating round sizes, arranging
 * round 1 matches with fair BYE distribution, and generating downstream empty bracket match cards.
 */

const BracketGenerator = {
    /**
     * Berechnet die Parameter für das Turniertree (z. B. Rundenanzahl, Freilos-Kanzahl).
     * @param {number} count - Anzahl der teilnehmenden Teams.
     * @returns {object} Ein Objekt mit rCount (Runden), bSize (nächste Zweierpotenz) und activeTeamsCount.
     */
    calculateBracketParams(count) {
        const rCount = Math.ceil(Math.log2(count));
        const bSize = Math.pow(2, rCount);
        const activeTeamsCount = 2 * count - bSize;
        return { rCount, bSize, activeTeamsCount };
    },

    /**
     * Baut die erste Runde des Turniers inklusive Freilosverteilung (BYE).
     * @param {Array} teams - Die gemischte Liste der Teams.
     * @param {number} bSize - Theoretische Turniertree-Größe (Zweierpotenz).
     * @param {number} activeTeamsCount - Anzahl der Teams, die in Runde 1 aktiv spielen.
     * @param {number} count - Reale Anzahl der Teams.
     * @returns {Array} Liste der Matches für Runde 1.
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
     * Generiert die nachfolgenden Runden (Runde 2 bis Finale) mit leeren Match-Slots.
     * @param {Array} rounds - Das Array der Runden, beginnend mit Runde 1.
     * @param {number} rCount - Gesamtanzahl der Runden.
     * @param {number} bSize - Turniertree-Größe.
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
     * Erstellt die vollständige Turnier-Struktur (Runden und Match-Paarungen).
     * @param {Array} teams - Die Liste der teilnehmenden Teams.
     * @returns {object|null} Das Turniertree mit allen Runden oder null.
     */
    build(teams) {
        const count = teams.length;
        if (count < 2) return null;

        const { rCount, bSize, activeTeamsCount } = this.calculateBracketParams(count);
        const r1 = this.buildRound1(teams, bSize, activeTeamsCount, count);
        const rounds = [{ matches: r1 }];
        this.buildSubsequentRounds(rounds, rCount, bSize);
        
        return { rounds };
    }
};

window.BracketGenerator = BracketGenerator;
