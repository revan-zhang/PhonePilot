<h1 align="center">PhonePilot</h1>

<p align="center">
  <strong>Enable AI Agents to Physically Control Your Phone</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue" alt="Platform"></a>
  <a href="#"><img src="https://img.shields.io/badge/Electron-28.x-47848F?logo=electron&logoColor=white" alt="Electron"></a>
  <a href="#"><img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white" alt="React"></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="#"><img src="https://img.shields.io/badge/MCP-1.x-8B5CF6" alt="MCP"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green" alt="License"></a>
</p>

---

## About

**PhonePilot** is an innovative desktop application that enables AI agents to physically control smartphones through a mechanical arm. Using the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), AI agents (such as Claude, Cursor, etc.) can directly operate the mechanical arm to perform taps, swipes, and other touch interactions on the phone screen, while observing the results in real-time through a camera feed.

This opens up a new dimension of physical interaction for AI "Computer Use" capabilities — allowing AI to not only control computers but also operate real mobile devices.

<p align="center">
  <img src="docs/assets/arm-hardware.png" alt="Mechanical Arm Hardware" width="600">
  <br>
  <em>Mechanical Arm Hardware Setup</em>
</p>

## Features

### 🤖 Native MCP Protocol Support

Built-in MCP Server supporting both Streamable HTTP and SSE transport protocols, seamlessly integrating with any MCP-compatible AI client.

| Tool | Description |
|------|-------------|
| `arm-connect` | Connect to the mechanical arm controller |
| `arm-disconnect` | Disconnect from the mechanical arm |
| `arm-move` | Move the arm to a specified position |
| `arm-click` | Perform a click at the current position |
| `capture-frame` | Capture the current camera frame |

### 📷 Real-time Visual Feedback

HD camera with live phone screen preview, featuring:
- Auto-detection and connection to DECXIN cameras
- Manual focus mode to prevent autofocus hunting
- Crosshair and grid overlay assistants
- 90° auto-rotation to match phone portrait display

<p align="center">
  <img src="docs/assets/control-software.png" alt="Control Software Interface" width="700">
  <br>
  <em>PhonePilot Control Interface</em>
</p>

### 🎮 Precision Mechanical Control

- Millimeter-accurate X/Y axis movement
- Adjustable step size (1-50mm)
- Adjustable touch depth (Z-axis)
- Real-time operation logging

### 🖥️ Cross-Platform Desktop App

Built with Electron, natively supporting:
- macOS (Intel & Apple Silicon)
- Windows (x64)
- Linux (AppImage, deb)

## Demo

<p align="center">
  <a href="docs/assets/showcase.mov">
    <img src="docs/assets/points.png" alt="Point Calibration" width="600">
    <br>
    <em>📹 Click to watch the full demo video</em>
  </a>
</p>

## How It Works

```
┌─────────────────┐     MCP Protocol      ┌──────────────────┐
│                 │◄────────────────────►│                  │
│   AI Agent      │   arm-move, click    │   PhonePilot     │
│  (Claude, etc)  │   capture-frame      │   Desktop App    │
│                 │                       │                  │
└─────────────────┘                       └────────┬─────────┘
                                                   │
                                          ┌────────┴─────────┐
                                          │                  │
                                    ┌─────▼─────┐     ┌──────▼─────┐
                                    │ Mechanical│     │   Camera   │
                                    │    Arm    │     │  (DECXIN)  │
                                    └─────┬─────┘     └──────┬─────┘
                                          │                  │
                                          ▼                  ▼
                                    ┌──────────────────────────┐
                                    │      Smartphone          │
                                    │    (Physical Device)     │
                                    └──────────────────────────┘
```

1. **AI Agent** connects to PhonePilot via MCP protocol
2. **PhonePilot** translates MCP commands into mechanical arm control instructions
3. **Mechanical Arm** performs physical touch operations on the phone screen
4. **Camera** captures the screen and returns the frame to the AI agent
5. **AI Agent** analyzes the frame and decides on the next action

## Getting Started

### Prerequisites

- Node.js 20.x or later
- Yarn package manager
- Compatible mechanical arm controller (via COM port)
- USB camera (DECXIN recommended)

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/your-username/PhonePilot.git
cd PhonePilot

# Install dependencies
yarn install

# Start development environment
yarn electron:dev
```

### Building for Production

```bash
# Build for current platform
yarn electron:build

# Build for specific platforms
yarn build:mac     # macOS
yarn build:win     # Windows
yarn build:linux   # Linux
```

## MCP Integration

PhonePilot provides a complete MCP Server implementation that integrates with any MCP-compatible AI client.

### Endpoints

| Endpoint | Protocol | Purpose |
|----------|----------|---------|
| `POST /mcp` | Streamable HTTP | Modern MCP clients |
| `GET /sse` | SSE | Legacy MCP clients |
| `GET /health` | HTTP | Health check |

### Configuration Example

Configure the MCP Server in your AI client:

```json
{
  "mcpServers": {
    "phonepilot": {
      "url": "http://localhost:3847/sse"
    }
  }
}
```

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <sub>Made with ❤️ for the AI-powered future</sub>
</p>
