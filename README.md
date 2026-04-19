# OpenHQM Router Manager

> **Client-side web application for creating, testing, and managing OpenHQM routing rules**

[![Deploy to GitHub Pages](https://github.com/fok666/openhqm-rt/actions/workflows/deploy.yml/badge.svg)](https://github.com/fok666/openhqm-rt/actions/workflows/deploy.yml)
[![CI](https://github.com/fok666/openhqm-rt/actions/workflows/ci.yml/badge.svg)](https://github.com/fok666/openhqm-rt/actions/workflows/ci.yml)
[![Tests](https://github.com/fok666/openhqm-rt/actions/workflows/test.yml/badge.svg)](https://github.com/fok666/openhqm-rt/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[**🚀 Live Demo →**](https://fok666.github.io/openhqm-rt/)

## ✨ Features

### Core Capabilities
- 🎯 **Visual Route Editor** - Intuitive interface for creating and managing routing rules
- 🔧 **JQ Transform Simulator** - Real-time payload transformation using JQ (powered by WebAssembly)
- 🧪 **Route Testing & Simulation** - Validate routing logic against test payloads with detailed execution traces
- 📦 **ConfigMap Export/Import** - Download routes as Kubernetes ConfigMaps (YAML/JSON)
- 💾 **Local Storage** - Automatically save work in progress in browser localStorage
- 🌐 **Zero Installation** - Access instantly via web browser - no setup required
- 🔒 **Privacy First** - All processing happens client-side in your browser

### Advanced Features
- Multiple condition types: Payload, Headers, Metadata, JQ expressions
- Condition operators: Equals, Contains, Regex, Exists
- Priority-based route matching
- Enable/disable routes without deletion
- Route duplication for quick setup
- Comprehensive execution trace and metrics

## 🚀 Quick Start

### Online Access (Recommended)

No installation needed! Just visit:

**[https://fok666.github.io/openhqm-rt/](https://fok666.github.io/openhqm-rt/)**

### Local Development

```bash
# Clone the repository
git clone https://github.com/fok666/openhqm-rt.git
cd openhqm-rt

# Install dependencies
npm install

# Start development server (opens automatically at http://localhost:5173)
npm run dev
```

### Prerequisites

- Node.js 18+ and npm 9+ (for local development only)
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## 📖 Usage

### Creating a Route

1. **Create** - Click **"New Route"** in the left sidebar
2. **Configure** - Set basic info:
   - Name and description
   - Priority (higher numbers are evaluated first)
   - Enabled status
3. **Add Conditions** - Define when this route should match:
   - Payload: Match fields in the message body
   - Header: Match HTTP headers
   - Metadata: Match custom metadata
   - JQ: Use JQ expressions for complex logic
4. **Transform** (Optional) - Configure JQ transformation to modify the payload
5. **Set Destination** - Choose where to route:
   - Endpoint: HTTP endpoint URL
   - Queue: Message queue name
   - Webhook: Webhook URL with custom headers
6. **Save** - Click **"Save Route"** to persist

### Testing Routes

1. Navigate to the **"Simulator"** tab
2. Enter test payload (JSON format)
3. Add headers if needed
4. Click **"Simulate Routing"**
5. Review results:
   - Matched route name and priority
   - Transformed payload (if applicable)
   - Destination endpoint
   - Detailed execution trace with timing metrics

### JQ Playground

Perfect for testing JQ expressions before using them in routes:

1. Navigate to the **"JQ Playground"** tab
2. Enter input JSON in the left panel
3. Write JQ expression in the center editor
4. Click **"Test Transform"** to see the output
5. Copy working expressions to route configurations

### Export/Import

**Export:**
1. Navigate to the **"Export/Import"** tab
2. Choose format: YAML (recommended) or JSON
3. Click **"Download ConfigMap"** to save
4. Deploy the ConfigMap to your Kubernetes cluster

**Import:**
1. Click **"Import ConfigMap"**
2. Select a previously exported YAML/JSON file
3. Routes will be loaded into the editor

### Best Practices

- **Name routes descriptively** - Use clear names like "High Priority Orders" instead of "Route 1"
- **Set priorities carefully** - Higher priority routes are evaluated first (200 > 100 > 50)
- **Test thoroughly** - Use the simulator to validate routing logic before deployment
- **Use conditions wisely** - Combine multiple conditions with AND/OR operators
- **Keep JQ expressions simple** - Complex transformations can impact performance
- **Export regularly** - Back up your route configurations

## Project Structure

```
openhqm-rt/
├── src/
│   ├── components/      # React components
│   │   ├── RouteList.tsx
│   │   ├── RouteEditor.tsx
│   │   ├── JQPlayground.tsx
│   │   ├── Simulator.tsx
│   │   └── ConfigMapManager.tsx
│   ├── services/        # Core services
│   │   ├── jqEngine.ts
│   │   ├── storage.ts
│   │   └── routeMatcher.ts
│   ├── store/          # Zustand state management
│   │   ├── routeStore.ts
│   │   └── simulationStore.ts
│   ├── types/          # TypeScript types
│   ├── config/         # Configuration
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages deployment
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Material-UI** - UI components
- **Monaco Editor** - Code editor (VS Code editor)
- **@jqlang/jq-web** - JQ WebAssembly for transformations
- **Zustand** - State management
- **js-yaml** - YAML parsing/generation

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                # Start development server (http://localhost:5173)
npm run build              # Build for production
npm run preview            # Preview production build

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier

# Testing
npm run test               # Run unit tests with Vitest
npm run test:coverage      # Run tests with coverage report
npm run test:e2e           # Run Playwright E2E tests
npm run test:e2e:ui        # Run E2E tests with UI
npm run test:e2e:debug     # Debug E2E tests
npm run test:all           # Run all tests (unit + E2E)
```

### Project Architecture

See [SDD.md](SDD.md) for complete technical specification.

**Key architectural principles:**
- Pure client-side application (no backend required)
- Functional React components with hooks
- Zustand for state management
- TypeScript strict mode for type safety
- Service layer for business logic
- Component-based UI with Material-UI

## 🚢 Deployment

### Automatic Deployment

The application is automatically deployed to GitHub Pages on every push to `main` branch via GitHub Actions.

**Workflow:** `.github/workflows/deploy.yml`

### Manual Deployment

```bash
# Build for production
npm run build

# The dist/ folder contains the static site
# Deploy to any static hosting service:
# - GitHub Pages
# - Netlify
# - Vercel
# - AWS S3 + CloudFront
# - Any static web server
```

### Deployment Configuration

For GitHub Pages, ensure the `base` path in [vite.config.ts](vite.config.ts) matches your repository name:

```typescript
base: mode === 'production' ? '/openhqm-rt/' : '/'
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 🔒 Privacy & Security

### Privacy Guarantees

- ✅ **No Backend** - All processing happens locally in your browser
- ✅ **No Tracking** - No analytics, telemetry, or external API calls
- ✅ **No Data Collection** - Routes never leave your browser unless you explicitly export them
- ✅ **LocalStorage Only** - Data persists only in your browser storage
- ✅ **Offline Capable** - Works without internet connection after initial load

### Security Features

- Client-side only architecture eliminates server-side attack vectors
- No user authentication required (nothing to compromise)
- Open source codebase (audit the code yourself)
- TypeScript for type safety and reduced runtime errors
- Regular dependency updates via Dependabot

### Data Storage

- All routes stored in browser's localStorage
- Clear browser data to delete all stored routes
- Export routes before clearing browser data
- No server-side storage or synchronization

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## Documentation

- [Software Design Document](SDD.md) - Complete technical specification
- [GitHub Copilot Instructions](.github/copilot-instructions.md) - Development guidelines

## License

MIT License - see [LICENSE](LICENSE)

## Related Projects

- [OpenHQM](https://github.com/fok666/openhqm) - Asynchronous HTTP request processing system
- [OpenHQM Dashboard](https://github.com/fok666/openhqm-dashboard) - Monitoring dashboard

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'feat: add amazing feature'`
4. Push to your fork: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Documentation

- [Software Design Document (SDD)](SDD.md) - Complete technical specification
- [Contributing Guidelines](CONTRIBUTING.md) - Development guidelines and workflow
- [Changelog](CHANGELOG.md) - Version history and release notes
- [GitHub Copilot Instructions](.github/copilot-instructions.md) - AI pairing guidelines

## 🆘 Support

Need help? Here are your options:

- 📖 Read the [SDD](SDD.md) for detailed technical documentation
- 🐛 Report bugs via [GitHub Issues](https://github.com/fok666/openhqm-rt/issues)
- 💡 Request features via [GitHub Issues](https://github.com/fok666/openhqm-rt/issues)
- 💬 Ask questions in [GitHub Discussions](https://github.com/fok666/openhqm-rt/discussions)

## 🔗 Related Projects

- **[OpenHQM](https://github.com/fok666/openhqm)** - Asynchronous HTTP request processing system
- **[OpenHQM Dashboard](https://github.com/fok666/openhqm-dashboard)** - Real-time monitoring dashboard

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with 🤖 for the OpenHQM ecosystem**

[Report Bug](https://github.com/fok666/openhqm-rt/issues) · [Request Feature](https://github.com/fok666/openhqm-rt/issues) · [Documentation](SDD.md)

</div>
