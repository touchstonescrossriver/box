# Lightweight Fitness Tracker

A lightweight, responsive web app for logging workouts, estimating calories, and tracking body weight. Data is stored in the browser (localStorage) and can be exported for further analysis.

## Features
- Quick workout logging with set/rep or duration inputs plus notes.
- Auto calorie estimates per exercise using MET values with daily and weekly summaries.
- Weight logging with trend and weekly calorie charts powered by Chart.js.
- Goal-based plan generator (fat loss, cardio, balanced) with editable templates.
- CSV export for workouts and weight; local storage first with a stub for future cloud sync.
- Mobile-friendly layout optimized for fast loading.

## Usage
Open `index.html` directly in a browser or serve the folder locally, e.g.:

```bash
python -m http.server 8000
```

Your data stays in local storage. Use the export button to download CSV files for Excel/Sheets.
