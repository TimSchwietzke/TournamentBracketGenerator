# Guidelines for Future Development Sessions

These rules must be adhered to in all future development, refactoring, or expansion sessions for this repository.

## 1. Dual Versioning Requirement
Every web application or feature in this repository must be maintained in **two distinct versions**:
1. **Single-File Version (`/index.html`, `/tournament_generator.html`)**: A self-contained, single-file HTML page containing all styles (CSS), markup (HTML), and logic (JS). This version is intended for quick distribution and running directly in a browser from the local file system.
2. **Clean & Separated Version (`/separated/...`)**: A structured version where concerns are separated:
   - `index.html`: Contains only structural semantic HTML.
   - `style.css`: Contains the CSS design system, layouts, variables, and responsive media queries.
   - `app.js`: Contains JavaScript state management, event listeners, and business logic.

When modifying features, ensure both versions remain in parity.

---

## 2. Responsive & Mobile-First Design
All user interfaces must be fully responsive and optimized for mobile viewports:
- Use `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">` to prevent layout breaks and unwanted zooming on iOS device text fields.
- Form inputs must be at least `16px` font size to prevent iOS safari from auto-zooming.
- Touch targets (buttons, links, slots) must be easily clickable on mobile screens (at least `44x44px` where applicable).
- Keep text and layout structures fluid, and use horizontal scroll layouts (`overflow-x-auto`) for wide data displays (like brackets and lists).

---

## 3. Dynamic Internationalization (i18n)
All tools must be localized and support at least two languages:
- **German (DE)**: The default active language.
- **English (EN)**: Secondary supported language.
- A toggle button (e.g. `DE / EN` or globe icon) must be provided in the header to switch languages instantly without reloading the page.
- User language preference should be saved in `localStorage` so it persists between browser visits.

---

## 4. Fair Tournament BYE Distribution
When the number of participating teams $N$ is not a power of 2 ($N \neq 2^k$):
- Calculate the bracket size $P$ as the next highest power of 2: $P = 2^{\lceil \log_2 N \rceil}$.
- In Round 1, pair $P - N$ teams with BYEs (`null` opponent) and the remaining $2N - P$ teams against each other.
- Highlight the teams receiving BYEs and automatically advance them to Round 2 immediately.
- Ensure Round 2 consists of exactly $P/2$ teams (a perfect power of 2), running standard single-elimination from that point forward.
- Do NOT display empty "BYE vs BYE" or blank match cards in the bracket.

---

## 5. Live Team Roster Editing & Swapping
The live tournament view must allow real-time changes to the roster:
- Clicking on a team name/card in the roster display or within any match slot must open an editor (modal or popup).
- The editor must allow changing the team name and modifying/swapping out the members' list.
- Changes must immediately propagate to all match cards in the bracket containing that team (past, current, or future).
