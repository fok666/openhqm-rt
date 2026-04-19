# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Batch testing with multiple test cases
- Route templates library
- Keyboard shortcuts
- Dark mode theme
- Route import from OpenAPI specs

## [2.0.0] - 2026-02-08

### 🎉 Initial Release

This is the first production-ready release of OpenHQM Router Manager, a client-side web application for creating, testing, and managing OpenHQM routing rules.

### ✨ Added Features

#### Core Functionality
- **Visual Route Editor** - Intuitive interface for creating and managing routing rules
- **Route Simulation** - Test routes against sample payloads with detailed execution traces
- **JQ Playground** - Interactive environment for testing JQ transformations
- **ConfigMap Management** - Export/import routes as Kubernetes ConfigMaps (YAML/JSON)
- **Local Persistence** - Automatic saving to browser localStorage

#### Route Configuration
- Multiple condition types: Payload, Headers, Metadata, JQ expressions
- Condition operators: Equals, Contains, Regex, Exists
- AND/OR condition operators for complex logic
- Priority-based route matching (configurable 0-1000)
- Enable/disable routes without deletion
- Route duplication for quick setup
- Optional JQ transformation per route
- Multiple destination types: Endpoint, Queue, Webhook

#### Developer Experience
- Zero installation required (browser-based)
- Privacy-first architecture (all processing client-side)
- Material-UI responsive interface
- Real-time validation and error messages
- Comprehensive execution traces with metrics
- Auto-save functionality

### \ud83d\udee0\ufe0f Technical Implementation

#### Architecture
- **Frontend**: React 18 + TypeScript (strict mode)
- **Build Tool**: Vite 5.x
- **State Management**: Zustand
- **UI Framework**: Material-UI (MUI) 5.x
- **Code Editor**: Monaco Editor (VS Code editor)
- **JQ Engine**: @jqlang/jq-web (WebAssembly)
- **YAML Processing**: js-yaml
- **Testing**: Vitest + Playwright
- **Deployment**: GitHub Pages via GitHub Actions

#### Quality Assurance
- Comprehensive unit test suite (85%+ coverage on business logic)
- End-to-end testing with Playwright
- TypeScript strict mode for type safety
- ESLint + Prettier for code quality
- Automated CI/CD pipeline

#### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

### \ud83d\udcdd Documentation
- Complete Software Design Document (SDD)
- Contributing guidelines
- GitHub Copilot instructions for AI pairing
- Comprehensive inline code documentation

### \ud83d\ude80 Deployment
- Automatic deployment to GitHub Pages
- Live demo: https://fok666.github.io/openhqm-rt/
- CDN-backed static hosting
- Offline-capable after initial load

---

## Version History

- **2.0.0** (2026-02-08) - Initial production release
