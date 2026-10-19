# Audio Studio

A planned collaborative, browser-based music production environment from Feeless Records.

## Vision

Build a web-based digital audio workstation (DAW) supporting music composition, editing, audio processing, and real-time project collaboration.

## Proposed technology

- **Frontend:** React, TypeScript, and Web Audio API / AudioWorklet
- **Backend:** Node.js and TypeScript
- **Collaboration:** WebSockets and a conflict-free collaborative data model (to be selected)
- **Audio processing:** Browser AudioWorklets, with an option for native/WASM DSP modules

> This repository currently contains Git configuration only. The application architecture and implementation are not yet committed.

## Proposed repository structure

```text
apps/
  web/       # React application
  server/    # Node.js API and collaboration server
packages/
  audio-engine/  # Audio and DSP modules
  shared/        # Shared types and utilities
docs/             # Architecture and development notes
```

## Getting started

Application setup instructions will be added once the project scaffold is created.

## Contributing

Use feature branches and pull requests. Keep secrets, API keys, generated builds, and local audio renders out of Git.
