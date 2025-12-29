# Brainrot Scroller

A small React + Vite project that displays scrolling memes with optional face-tracking and sound.

## Quick start

Prerequisites: Node 16+ and npm or Yarn.

Install dependencies and run the dev server:

```
npm install
npm run dev
```

Build for production and preview the build:

```
npm run build
npm run preview
```

## Overview

- **Framework:** React with Vite (fast HMR)
- **Source:** `src/` contains the app code
- **Key files:** `src/App.jsx`, `src/MemeCanvas.jsx`, `src/FaceTracker.jsx`, `src/main.jsx`, `src/worker.js`
- **Styles:** `src/index.css`, `src/Brainrot.css`
- **Public assets:** `public/memes/` (images), `public/sounds/` (audio)

## Features

- Scrolling meme display and rendering via `MemeCanvas.jsx`.
- Optional face-tracking integration in `FaceTracker.jsx`.
- Background work (audio/processing) handled in `worker.js`.

## Project structure

- `index.html` — app entry
- `src/` — React components and styles
- `public/` — static assets served as-is

## Contributing

Feel free to open issues or pull requests. Keep changes focused and include brief testing notes.

## See also

For details about Vite and React setup, refer to the Vite documentation.
