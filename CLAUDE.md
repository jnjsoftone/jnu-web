# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**jnu-web** is a TypeScript utility library for web automation and HTTP requests, providing:
- **HTTP request utilities** (axios-based with SSL bypass)
- **Chrome automation** via Selenium WebDriver
- **Web scraping support** with Cheerio integration
- **HTML to Markdown conversion** using Turndown

This is part of the JnJ custom packages ecosystem and depends on `jnu-abc` for core utilities.

## Build System & Architecture

### Dual-Build System
The project uses **SWC** for fast compilation to both module formats:
- **CommonJS** (`cjs/`) - optimized and minified
- **ESM** (`esm/`) - ES6 modules
- **TypeScript declarations** (`types/`) - generated via `tsc`

Build configurations:
- `/cjs/.swcrc` - CommonJS build with minification
- `/esm/.swcrc` - ES6 modules build with minification
- `tsconfig.json` - TypeScript declarations only

### Module Export Strategy
```javascript
// package.json exports field provides dual module support
"exports": {
  ".": {
    "import": "./esm/index.js",
    "require": "./cjs/index.js",
    "types": "./types/index.d.ts"
  }
}
```

## Common Development Commands

### Building
```bash
# Full build (types → cjs → esm)
npm run build

# Watch mode for development
npm run build:watch

# Individual builds
npm run build:types    # TypeScript declarations
npm run build:cjs      # CommonJS build
npm run build:esm      # ES modules build

# Clean artifacts
npm run clean:mac      # macOS/Linux
npm run clean:win      # Windows
```

### Testing
```bash
# All tests with VM modules support
npm run test

# Test categories
npm run test:unit
npm run test:integration
npm run test:e2e

# Development testing
npm run test:watch
npm run test:coverage
```

### Publishing
```bash
# Automated versioning and publishing
./publish.sh patch      # Bug fixes (0.0.X)
./publish.sh minor      # New features (0.X.0)
./publish.sh major      # Breaking changes (X.0.0)

# Options
./publish.sh --dry-run         # Preview changes
./publish.sh --skip-tests      # Skip test execution
./publish.sh --auto-commit     # Auto-commit changes
./publish.sh --force           # Override safety checks
```

## Core Architecture

### Module Organization (following .cursorrules)
```typescript
// Import AREA
import { ... } from '...';

// Functions AREA
const functionName = () => { ... };

// Export AREA
export { fun1, fun2, fun3 };
```

### Key Modules

#### 1. HTTP Request Module (`src/request.ts`)
```typescript
// SSL-bypassed HTTP client functions
reqGet(url, { params, config })
reqPost(url, { data, config })
reqPatch(url, { data, config })
reqDelete(url, { config })
reqUpsert(url, { data, config })    // PUT requests
reqGql(url, { query, values, config })  // GraphQL with template substitution
```

#### 2. Chrome Automation (`src/chrome.ts`)
```typescript
// Full-featured Chrome automation class
class Chrome {
  // Profile management with email lookup
  // Anti-detection measures built-in
  // Full page screenshot with dynamic content loading
  // Element interaction (click, text, attributes)
  // Waiting strategies (located, clickable, visible, etc.)
}

getProfileByEmail(email, userDataDir)  // Find Chrome profile by email
```

#### 3. Basic Chrome (`src/chromeBasic.ts`)
```typescript
// Lightweight Chrome automation
class ChromeBasic {
  // Simple initialization with basic options
}

goChrome(url)  // Quick Chrome instance for URL
```

## Dependencies & Integration

### Core Dependencies
- **axios** - HTTP client with SSL bypass configuration
- **selenium-webdriver** - Chrome automation engine
- **cheerio** - Server-side jQuery for HTML parsing
- **turndown** - HTML to Markdown conversion
- **jnu-abc** - Core utilities (file operations, JSON handling, async helpers)

### Build Dependencies
- **SWC** - Fast TypeScript compilation and minification
- **TypeScript** - Type checking and declaration generation
- **Jest** - Testing with experimental VM modules for ESM support

## Testing Architecture

Jest configuration supports multiple test environments:
- `jest.config.js` - Main configuration with ts-jest preset
- `jest.unit.js` - Unit test specific configuration
- `jest.integration.js` - Integration test configuration
- `jest.e2e.js` - End-to-end test configuration

All tests run with `--experimental-vm-modules` for ESM compatibility.

## Code Guidelines (from .cursorrules)

### TypeScript Conventions
- **File structure**: Import Area → Functions Area → Export Area
- **Functions**: Use arrow functions with camelCase naming
- **Constants**: UPPER_CASE naming
- **Files**: kebab-case naming
- **Types**: Centralized in `src/types.ts` (currently empty)
- **Exports**: Group at file bottom: `export { fun1, fun2, fun3 }`
- **Type usage**: `any` type is acceptable when needed

### Chrome Automation Patterns
- **Anti-detection**: Built-in user agent spoofing, automation flag removal
- **Profile management**: Automatic profile detection by email address
- **Full page capture**: Dynamic content loading with scroll-based detection
- **Waiting strategies**: Multiple wait conditions (located, clickable, visible, etc.)

### HTTP Request Patterns
- **SSL bypass**: All requests configured to ignore certificate validation
- **GraphQL support**: Template variable substitution (`${variable}` syntax)
- **Error handling**: Comprehensive error logging for debugging
- **Configuration**: Extensible config object for custom headers/options

## Development Environment

- **Node.js** with **TypeScript** and **ESM** support
- **SWC** for fast compilation and minification
- **Jest** with experimental VM modules for testing
- **Prettier** formatting (120 char width, 2-space tabs, single quotes)
- **Cursor.ai** and **VSCode** development environment
- **npm** package manager

## Publish Strategy

The `publish.sh` script provides comprehensive publishing automation:
- Pre-flight checks (git config, remote connectivity, npm auth)
- Automated testing and building
- Version bumping with git tagging
- Multi-step error handling with detailed troubleshooting guides
- Dry-run capability for testing publish workflows