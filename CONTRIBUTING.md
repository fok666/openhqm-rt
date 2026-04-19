# Contributing to OpenHQM Router Manager

Thank you for your interest in contributing to OpenHQM Router Manager! This document provides guidelines and information to help you contribute effectively.

## 👋 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- A modern code editor (VS Code recommended)
- Basic knowledge of React, TypeScript, and JQ

## 🛠️ Development Setup

### 1. Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/openhqm-rt.git
   cd openhqm-rt
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The app will open automatically at [http://localhost:5173](http://localhost:5173).

### 4. Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:all
```

## 📜 Development Guidelines

### Code Style

- **Strict TypeScript** - No `any` types without justification
- **Functional Components** - Use hooks, avoid class components
- **Maximum line length** - 100 characters
- **Formatting** - Use Prettier: `npm run format`
- **Linting** - Use ESLint: `npm run lint`
- **Comments** - Write self-documenting code, add comments for complex logic only

### File Organization

```
src/
├── components/          # React components
│   ├── RouteEditor.tsx
│   ├── Simulator.tsx
│   └── ...
├── services/           # Business logic
│   ├── jqEngine.ts
│   ├── routeMatcher.ts
│   └── storage.ts
├── store/              # Zustand stores
│   ├── routeStore.ts
│   └── simulationStore.ts
├── types/              # TypeScript types
├── config/             # Configuration
└── test/               # Test utilities
```

### Naming Conventions

- **Components**: PascalCase (e.g., `RouteEditor.tsx`)
- **Functions**: camelCase (e.g., `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ROUTES`)
- **Types/Interfaces**: PascalCase (e.g., `RouteConfig`)

### Component Structure

```typescript
import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import type { Route } from '../types';

interface Props {
  route: Route;
  onSave: (route: Route) => void;
}

export const RouteEditor: React.FC<Props> = ({ route, onSave }) => {
  const [localRoute, setLocalRoute] = useState(route);

  const handleSave = () => {
    onSave(localRoute);
  };

  return (
    <Box>
      {/* Component content */}
    </Box>
  );
};
```

### Testing Guidelines

- **Write tests for new features** - Unit tests are mandatory
- **Maintain coverage** - Keep above 80% for services and stores
- **Test behavior, not implementation** - Focus on what, not how
- **Use descriptive test names** - `should match route when conditions are met`
- **Mock external dependencies** - Use Vitest mocks for services

### Type Safety

- Define types in `src/types/`
- Export from `src/types/index.ts`
- Use proper generics for reusable components
- Avoid `any` - use `unknown` if type is truly unknown
- Document complex types with JSDoc comments

### 🐛 Bug Reports

### Before Submitting

1. **Search existing issues** - Your bug might already be reported
2. **Verify it's a bug** - Ensure it's not expected behavior
3. **Test in the latest version** - Bug might already be fixed

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
Add screenshots if applicable.

**Environment**
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Version: [e.g., 2.0.0]
```

## 💡 Feature Requests

### Proposing Features

1. **Check existing discussions** - Feature might be planned
2. **Explain the use case** - Why is this feature needed?
3. **Provide examples** - Show how it would work
4. **Consider alternatives** - Are there workarounds?

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Describe the problem.

**Describe the solution you'd like**
Clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context or screenshots.
```

## 🔀 Git Workflow

### Branch Naming

```bash
feature/your-feature-name  # New features
fix/bug-description        # Bug fixes
docs/what-you-changed      # Documentation
refactor/what-changed      # Code refactoring
test/what-you-test         # Test additions
chore/maintenance-task     # Chores
```
### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Write/update tests
   - Update documentation as needed

3. **Commit with descriptive messages**:
   ```bash
   git add .
   git commit -m "feat: add route validation"
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide clear description
   - Add screenshots for UI changes

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(editor): add JQ syntax highlighting
fix(simulator): handle empty route list
docs: update README with new features
```

## Pull Request Guidelines

- Link related issues in PR description
- Provide clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed

## Code Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, PR will be merged

## 🏣 Getting Help

- **Documentation** - Read the [SDD](SDD.md) for architecture details
- **GitHub Copilot** - Check [Copilot Instructions](.github/copilot-instructions.md)
- **Issues** - Search or create an issue for questions
- **Discussions** - Join conversations in GitHub Discussions
- **Code Review** - Learn from PR feedback

## ✨ Recognition

All contributors will be:
- Listed in release notes
- Acknowledged in the project
- Given credit for their contributions

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to OpenHQM Router Manager!** 🚀
