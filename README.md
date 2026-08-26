# Smart Attendance Tracker

Phase II is in progress and working: this repository contains the standalone attendance calculation engine, tests, and a static dashboard that uses the engine.

Open `index.html` directly in a browser to try the dashboard.

## Run Tests

```bash
npm test
```

## Structure

```text
js/
  app.js
  calculations.js
test/
  calculations.test.js
index.html
package.json
style.css
```

The calculation functions are pure and UI-independent so the interface can reuse them without duplicating attendance formulas.
