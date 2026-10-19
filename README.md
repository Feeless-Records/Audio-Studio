# Feeless Records Audio Studio
Browser-based audio studio prototype, using native JavaScript modules, Web Audio, and a WASM text renderer.
Run locally with Node.js: `node server.js`, then open http://localhost:4173.
Run checks: `node --test tests/*.test.mjs`.
GitHub Pages publishes the root of main at https://feeless-records.github.io/Audio-Studio/.
Current UI: sample playback, polyphonic saw keyboard, tuning, chord display, FFT and circle-of-fifths reference.
See DEVICE-FAMILIES.md for responsive families and WORKFLOW-SYSTEMS.md for the new workflow classes and their implementation boundaries.
Real-time collaboration and complete DAW editing are future work.
