# PhonePilot

A modern desktop application built with Electron, React, and TypeScript.

## Features

- Cross-platform support (macOS, Windows, Linux)
- Modern React 18 with TypeScript
- Fast development with Vite
- CI/CD with GitHub Actions
- Beautiful, modern UI

## Development

### Prerequisites

- Node.js 20.x or later
- Yarn package manager

### Setup

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Or run with Electron
yarn electron:dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start Vite dev server |
| `yarn electron:dev` | Start Electron with hot reload |
| `yarn build` | Build for production |
| `yarn build:mac` | Build for macOS |
| `yarn build:win` | Build for Windows |
| `yarn build:linux` | Build for Linux |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Fix ESLint errors |
| `yarn typecheck` | Run TypeScript type check |

## Project Structure

```
PhonePilot/
├── electron/           # Electron main process
│   ├── main.ts        # Main entry point
│   ├── preload.ts     # Preload script for IPC
│   └── electron-env.d.ts
├── src/               # React renderer process
│   ├── main.tsx       # React entry point
│   ├── App.tsx        # Root component
│   ├── styles/        # CSS styles
│   └── vite-env.d.ts
├── .github/workflows/ # CI/CD pipelines
├── index.html         # HTML template
├── vite.config.ts     # Vite configuration
├── electron-builder.yml # Electron Builder config
└── package.json
```

## Building

### Local Build

```bash
# Build for your current platform
yarn electron:build

# Build for all platforms (requires respective OS or CI)
yarn electron:build:all
```

### CI/CD

The project uses GitHub Actions for automated builds. All builds skip code signing and notarization for simplicity.

- **PR Check**: Runs on every pull request to validate code quality (lint & typecheck)
- **Build & Release**: Builds unsigned packages for all platforms

Builds are uploaded as artifacts and can be downloaded from the Actions tab.

To create a release:

```bash
# Update version in package.json, then:
git tag v1.0.0
git push origin v1.0.0
```

This will trigger a build and create a GitHub Release with the artifacts attached.

## License

MIT License - see [LICENSE](LICENSE) for details.
