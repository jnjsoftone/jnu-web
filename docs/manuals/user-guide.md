# JNU-Web User Guide

A comprehensive TypeScript utility library for web automation and HTTP requests, providing advanced Chrome automation, HTTP request handling, and web scraping capabilities.

## Table of Contents

1. [Installation and Setup](#installation-and-setup)
2. [Package Overview](#package-overview)
3. [HTTP Request Module](#http-request-module)
4. [Chrome Automation](#chrome-automation)
5. [Basic Chrome Automation](#basic-chrome-automation)
6. [Configuration and Environment](#configuration-and-environment)
7. [Real-World Examples](#real-world-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

## Installation and Setup

### Prerequisites

- Node.js 16+ with TypeScript support
- Chrome browser installed on your system
- ChromeDriver (automatically managed by Selenium WebDriver)

### Installation

```bash
npm install jnu-web
```

### Required Dependencies

The package automatically installs these dependencies:

```bash
# Core dependencies (automatically installed)
npm install axios cheerio selenium-webdriver turndown jnu-abc

# TypeScript definitions (for development)
npm install --save-dev @types/selenium-webdriver @types/cheerio
```

### Environment Setup

Create environment-specific configuration files:

**.env.linux**
```env
CHROME_USER_DATA_DIR=/home/user/.config/google-chrome
```

**.env.mac**
```env
CHROME_USER_DATA_DIR=/Users/user/Library/Application Support/Google/Chrome
```

**.env.win**
```env
CHROME_USER_DATA_DIR=C:\Users\user\AppData\Local\Google\Chrome\User Data
```

## Package Overview

JNU-Web provides three main modules:

- **HTTP Request Module** (`request.ts`) - Axios-based HTTP client with SSL bypass
- **Chrome Automation** (`chrome.ts`) - Full-featured Chrome automation with anti-detection
- **Basic Chrome** (`chromeBasic.ts`) - Lightweight Chrome automation for simple tasks

### Module Import Examples

```typescript
// ES6 Module imports
import { reqGet, reqPost, reqGql, Chrome, ChromeBasic, goChrome } from 'jnu-web';

// CommonJS imports
const { reqGet, reqPost, reqGql, Chrome, ChromeBasic, goChrome } = require('jnu-web');

// Selective imports
import { Chrome } from 'jnu-web';
import { reqGet, reqPost } from 'jnu-web';
```

## HTTP Request Module

The HTTP request module provides SSL-bypassed HTTP operations with comprehensive error handling.

### Basic HTTP Operations

#### GET Requests

```typescript
import { reqGet } from 'jnu-web';

// Simple GET request
const data = await reqGet('https://api.example.com/users');

// GET with query parameters
const users = await reqGet('https://api.example.com/users', {
  params: {
    page: 1,
    limit: 10,
    search: 'john'
  }
});

// GET with custom headers
const response = await reqGet('https://api.example.com/protected', {
  config: {
    headers: {
      'Authorization': 'Bearer token123',
      'User-Agent': 'MyApp/1.0'
    }
  }
});
```

#### POST Requests

```typescript
import { reqPost } from 'jnu-web';

// Simple POST request
const newUser = await reqPost('https://api.example.com/users', {
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  }
});

// POST with custom headers
const result = await reqPost('https://api.example.com/upload', {
  data: formData,
  config: {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': 'Bearer token123'
    },
    timeout: 30000
  }
});
```

#### PATCH Requests

```typescript
import { reqPatch } from 'jnu-web';

// Update user data
const updatedUser = await reqPatch('https://api.example.com/users/123', {
  data: {
    name: 'Jane Doe',
    email: 'jane@example.com'
  }
});
```

#### DELETE Requests

```typescript
import { reqDelete } from 'jnu-web';

// Delete a resource
await reqDelete('https://api.example.com/users/123');

// Delete with authentication
await reqDelete('https://api.example.com/users/123', {
  config: {
    headers: {
      'Authorization': 'Bearer token123'
    }
  }
});
```

#### UPSERT (PUT) Requests

```typescript
import { reqUpsert } from 'jnu-web';

// Create or update a resource
const user = await reqUpsert('https://api.example.com/users/123', {
  data: {
    id: 123,
    name: 'John Smith',
    email: 'johnsmith@example.com',
    role: 'admin'
  }
});
```

### GraphQL Support

The package includes built-in GraphQL support with template variable substitution:

```typescript
import { reqGql } from 'jnu-web';

// GraphQL query with variables
const query = `
  query GetUser($userId: ID!) {
    user(id: $userId) {
      id
      name
      email
      posts {
        title
        content
        createdAt
      }
    }
  }
`;

const result = await reqGql('https://api.example.com/graphql', {
  query: query,
  values: {
    userId: '123'
  }
});

// Template-style GraphQL queries
const dailyQuery = `
  {
    dailys(date: ${date}) {
      id
      state
      patientInfo {
        name
        age
        sex
      }
    }
  }
`;

const dailyData = await reqGql('https://api.example.com/graphql', {
  query: dailyQuery,
  values: {
    date: "20240418"
  }
});
```

### SSL Certificate Bypass

All HTTP requests automatically bypass SSL certificate validation, making it suitable for development environments with self-signed certificates:

```typescript
// SSL bypass is automatic - no additional configuration needed
const data = await reqGet('https://self-signed.example.com/api');
```

## Chrome Automation

The Chrome class provides comprehensive browser automation with anti-detection features.

### Basic Initialization

```typescript
import { Chrome } from 'jnu-web';

// Basic initialization
const chrome = new Chrome();
await chrome.goto('https://example.com');

// Headless mode
const chromeHeadless = new Chrome({ headless: true });

// With custom arguments
const chromeCustom = new Chrome({
  headless: false,
  arguments: [
    '--window-size=1920,1080',
    '--disable-extensions',
    '--incognito'
  ]
});
```

### Profile Management

```typescript
import { Chrome, getProfileByEmail } from 'jnu-web';

// Find profile by email
const userDataDir = '/Users/username/Library/Application Support/Google/Chrome';
const profileName = getProfileByEmail('user@example.com', userDataDir);

// Use specific profile
const chrome = new Chrome({
  profileName: profileName,
  userDataDir: userDataDir
});

// Auto-detect profile by email
const chromeWithEmail = new Chrome({
  email: 'user@example.com',
  userDataDir: userDataDir
});
```

### Navigation and Page Interaction

```typescript
const chrome = new Chrome();

// Navigate to URL
await chrome.goto('https://example.com');

// Wait for elements
await chrome.wait('#login-button', { timeout: 10000, until: 'clickable' });
await chrome.wait('.content', { until: 'visible' });
await chrome.wait('.loading', { until: 'invisible' });

// Find elements
const button = await chrome.findElement('#submit-btn');
const inputs = await chrome.findElements('input[type="text"]');

// Element interactions
await chrome.click('#login-button');
await chrome.sendKeys('#username', 'myusername');
await chrome.sendKeys('#password', 'mypassword');

// Get element text and attributes
const text = await chrome.getText('.welcome-message');
const href = await chrome.getAttribute('a.link', 'href');
const html = await chrome.getElementHtml('.content');
```

### Screenshot Capabilities

```typescript
const chrome = new Chrome();
await chrome.goto('https://example.com');

// Full page screenshot (automatically closes browser)
const screenshotData = await chrome.getFullScreenshot();

// Save screenshot to file (automatically closes browser)
await chrome.saveScreenshot('/path/to/screenshot.png');

// Element-specific screenshots
await chrome.saveElementScreenshot('.header', '/path/to/header.png');

// Manual screenshot workflow
const chrome2 = new Chrome();
await chrome2.goto('https://example.com');
const screenshot = await chrome2._getFullScreenshot(); // Doesn't close browser
await chrome2.close(); // Manual cleanup
```

### Advanced Features

```typescript
const chrome = new Chrome();

// Execute custom JavaScript
const result = await chrome.executeScript(`
  return document.title + ' - ' + window.location.href;
`);

// Get page source
const html = await chrome.getPageSource();

// Scroll element into view
const element = await chrome.findElement('.far-down-element');
await chrome.scrollIntoView(element);

// Wait strategies
await chrome.wait('#dynamic-content', { until: 'located' });
await chrome.wait('#button', { until: 'clickable' });
await chrome.wait('#modal', { until: 'visible' });
await chrome.wait('#loading', { until: 'invisible' });
```

### Anti-Detection Features

The Chrome class includes built-in anti-detection measures:

- User agent spoofing (latest Chrome version)
- Automation flag removal
- Navigator.webdriver property hiding
- Chrome automation artifacts cleanup
- Realistic browser configuration

```typescript
// Anti-detection is automatic
const chrome = new Chrome({
  // Additional stealth arguments
  arguments: [
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--no-first-run'
  ]
});
```

## Basic Chrome Automation

For simple automation tasks, use ChromeBasic:

```typescript
import { ChromeBasic, goChrome } from 'jnu-web';

// Simple Chrome instance
const chrome = new ChromeBasic();
await chrome.initialize({ headless: false });
await chrome.goto('https://example.com');
await chrome.close();

// Quick navigation helper
const driver = await goChrome('https://example.com');
// driver is a selenium WebDriver instance
// Remember to close: await driver.quit();
```

## Configuration and Environment

### Chrome User Data Directory Setup

```typescript
// Platform-specific setup
const getUserDataDir = () => {
  const platform = process.platform;

  switch (platform) {
    case 'darwin': // macOS
      return `/Users/${process.env.USER}/Library/Application Support/Google/Chrome`;
    case 'win32': // Windows
      return `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Google\\Chrome\\User Data`;
    case 'linux': // Linux
      return `/home/${process.env.USER}/.config/google-chrome`;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};

const chrome = new Chrome({
  userDataDir: getUserDataDir(),
  email: 'user@example.com'
});
```

### Environment Variables

```typescript
// Using dotenv for configuration
import dotenv from 'dotenv';
dotenv.config();

const chrome = new Chrome({
  userDataDir: process.env.CHROME_USER_DATA_DIR,
  email: process.env.CHROME_USER_EMAIL,
  headless: process.env.NODE_ENV === 'production'
});
```

## Real-World Examples

### Web Scraping with Chrome and HTTP Requests

```typescript
import { Chrome, reqGet } from 'jnu-web';
import * as cheerio from 'cheerio';

async function scrapeProductData(productUrl: string) {
  const chrome = new Chrome({ headless: true });

  try {
    // Navigate to product page
    await chrome.goto(productUrl);

    // Wait for content to load
    await chrome.wait('.product-info', { timeout: 15000 });

    // Get page HTML
    const html = await chrome.getPageSource();
    const $ = cheerio.load(html);

    // Extract product data
    const product = {
      title: $('.product-title').text().trim(),
      price: $('.price').text().trim(),
      description: $('.description').text().trim(),
      images: $('.product-images img').map((i, el) => $(el).attr('src')).get(),
      availability: $('.availability').text().trim()
    };

    // Get additional data via API if available
    const productId = product.title.match(/id:(\d+)/)?.[1];
    if (productId) {
      const apiData = await reqGet(`https://api.example.com/products/${productId}`);
      product.reviews = apiData.reviews;
      product.ratings = apiData.ratings;
    }

    return product;
  } finally {
    await chrome.close();
  }
}
```

### Automated Form Submission

```typescript
import { Chrome } from 'jnu-web';

async function submitContactForm(formData: {
  name: string;
  email: string;
  message: string;
}) {
  const chrome = new Chrome();

  try {
    await chrome.goto('https://example.com/contact');

    // Fill form fields
    await chrome.wait('#contact-form', { timeout: 10000 });
    await chrome.sendKeys('#name', formData.name);
    await chrome.sendKeys('#email', formData.email);
    await chrome.sendKeys('#message', formData.message);

    // Submit form
    await chrome.click('#submit-button');

    // Wait for success message
    await chrome.wait('.success-message', { timeout: 15000 });

    const successText = await chrome.getText('.success-message');
    return { success: true, message: successText };

  } catch (error) {
    const errorText = await chrome.getText('.error-message').catch(() => 'Unknown error');
    return { success: false, message: errorText };
  } finally {
    await chrome.close();
  }
}
```

### API Testing with HTTP Requests

```typescript
import { reqPost, reqGet, reqPatch, reqDelete } from 'jnu-web';

async function testUserAPI() {
  // Create user
  const newUser = await reqPost('https://api.example.com/users', {
    data: {
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    },
    config: {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    }
  });

  console.log('Created user:', newUser);

  // Get user
  const user = await reqGet(`https://api.example.com/users/${newUser.id}`, {
    config: {
      headers: { 'Authorization': 'Bearer test-token' }
    }
  });

  console.log('Retrieved user:', user);

  // Update user
  const updatedUser = await reqPatch(`https://api.example.com/users/${newUser.id}`, {
    data: { name: 'Updated Test User' },
    config: {
      headers: { 'Authorization': 'Bearer test-token' }
    }
  });

  console.log('Updated user:', updatedUser);

  // Delete user
  await reqDelete(`https://api.example.com/users/${newUser.id}`, {
    config: {
      headers: { 'Authorization': 'Bearer test-token' }
    }
  });

  console.log('User deleted successfully');
}
```

### GraphQL Data Fetching

```typescript
import { reqGql } from 'jnu-web';

async function fetchUserPosts(userId: string) {
  const query = `
    query GetUserPosts($userId: ID!, $limit: Int) {
      user(id: $userId) {
        id
        name
        email
        posts(limit: $limit) {
          id
          title
          content
          publishedAt
          tags {
            name
            color
          }
          comments {
            id
            content
            author {
              name
            }
          }
        }
      }
    }
  `;

  const result = await reqGql('https://api.example.com/graphql', {
    query: query,
    values: {
      userId: userId,
      limit: 10
    },
    config: {
      headers: {
        'Authorization': 'Bearer token123',
        'Content-Type': 'application/json'
      }
    }
  });

  return result.data.user;
}
```

## Best Practices

### Resource Management

```typescript
// Always close Chrome instances
const chrome = new Chrome();
try {
  await chrome.goto('https://example.com');
  // ... automation tasks
} finally {
  await chrome.close(); // Essential for cleanup
}

// Use try-finally for guaranteed cleanup
async function automateTask() {
  const chrome = new Chrome();
  try {
    // automation logic
    return result;
  } finally {
    await chrome.close();
  }
}
```

### Error Handling

```typescript
import { reqGet, Chrome } from 'jnu-web';

// HTTP request error handling
async function safeApiCall(url: string) {
  try {
    const data = await reqGet(url);
    return { success: true, data };
  } catch (error) {
    console.error('API call failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Chrome automation error handling
async function safeAutomation() {
  const chrome = new Chrome();
  try {
    await chrome.goto('https://example.com');

    // Wait with timeout to prevent hanging
    await chrome.wait('#content', { timeout: 15000 });

    return await chrome.getText('#result');
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.error('Element not found within timeout');
    } else {
      console.error('Automation failed:', error.message);
    }
    throw error;
  } finally {
    await chrome.close();
  }
}
```

### Performance Optimization

```typescript
// Use headless mode for production
const isProduction = process.env.NODE_ENV === 'production';
const chrome = new Chrome({
  headless: isProduction,
  arguments: isProduction ? [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ] : []
});

// Batch HTTP requests
async function batchApiCalls(urls: string[]) {
  const promises = urls.map(url => reqGet(url).catch(err => ({ error: err.message })));
  return await Promise.all(promises);
}

// Reuse Chrome instances when possible
class ChromeManager {
  private chrome: Chrome | null = null;

  async getChrome() {
    if (!this.chrome) {
      this.chrome = new Chrome({ headless: true });
    }
    return this.chrome;
  }

  async cleanup() {
    if (this.chrome) {
      await this.chrome.close();
      this.chrome = null;
    }
  }
}
```

### Security Considerations

```typescript
// Sanitize user inputs
function sanitizeInput(input: string): string {
  return input.replace(/[<>\"']/g, '');
}

// Use environment variables for sensitive data
const apiKey = process.env.API_KEY;
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'X-API-Key': process.env.X_API_KEY
};

await reqGet('https://api.example.com/secure', {
  config: { headers }
});

// Validate URLs before navigation
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

if (isValidUrl(targetUrl)) {
  await chrome.goto(targetUrl);
}
```

## Troubleshooting

### Common Chrome Issues

**Issue: ChromeDriver version mismatch**
```bash
# Update ChromeDriver
npm update selenium-webdriver
```

**Issue: Chrome not found**
```typescript
// Specify Chrome binary path
const chrome = new Chrome({
  arguments: ['--chrome-binary=/path/to/chrome']
});
```

**Issue: Timeout errors**
```typescript
// Increase timeout values
await chrome.wait('#element', { timeout: 30000 });

// Use explicit waits
await chrome.driver.sleep(2000);
```

### HTTP Request Issues

**Issue: SSL certificate errors**
```typescript
// SSL bypass is automatic, but you can add custom agents
const customConfig = {
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    secureProtocol: 'TLSv1_2_method'
  })
};

await reqGet(url, { config: customConfig });
```

**Issue: Request timeouts**
```typescript
await reqGet(url, {
  config: {
    timeout: 30000, // 30 seconds
    maxRedirects: 5
  }
});
```

### Memory and Performance Issues

**Issue: High memory usage**
```typescript
// Enable garbage collection
const chrome = new Chrome({
  arguments: [
    '--max_old_space_size=4096',
    '--gc-interval=100'
  ]
});
```

**Issue: Slow automation**
```typescript
// Disable images and CSS for faster loading
const chrome = new Chrome({
  arguments: [
    '--disable-images',
    '--disable-css',
    '--disable-javascript' // Only if JS not needed
  ]
});
```

### Debugging Tips

```typescript
// Enable verbose logging
process.env.DEBUG = 'selenium-webdriver';

// Take screenshots for debugging
await chrome.saveScreenshot('/tmp/debug-screenshot.png');

// Log HTTP requests
axios.interceptors.request.use(request => {
  console.log('Starting Request:', request.url);
  return request;
});
```

## API Reference

### HTTP Request Functions

#### `reqGet(url: string, options?: ReqGetParams): Promise<any>`
Performs GET request with SSL bypass.

**Parameters:**
- `url`: Target URL
- `options.params`: Query parameters object
- `options.config`: Axios configuration object

#### `reqPost(url: string, options?: ReqPostParams): Promise<any>`
Performs POST request with SSL bypass.

**Parameters:**
- `url`: Target URL
- `options.data`: Request body data
- `options.config`: Axios configuration object

#### `reqPatch(url: string, options?: ReqPostParams): Promise<any>`
Performs PATCH request with SSL bypass.

#### `reqDelete(url: string, options?: { config?: any }): Promise<any>`
Performs DELETE request with SSL bypass.

#### `reqUpsert(url: string, options?: ReqPostParams): Promise<any>`
Performs PUT request (upsert) with SSL bypass.

#### `reqGql(url: string, options?: ReqGqlParams): Promise<any>`
Performs GraphQL request with template variable substitution.

**Parameters:**
- `url`: GraphQL endpoint URL
- `options.query`: GraphQL query string
- `options.values`: Template variable values
- `options.config`: Axios configuration object

### Chrome Class Methods

#### Constructor
```typescript
new Chrome(options?: {
  headless?: boolean;
  profileName?: string;
  email?: string;
  userDataDir?: string;
  arguments?: string[];
})
```

#### Navigation Methods
- `goto(url: string): Promise<void>` - Navigate to URL
- `getPageSource(): Promise<string>` - Get HTML source

#### Element Methods
- `findElement(selector: string): Promise<WebElement>` - Find single element by CSS
- `findElements(selector: string): Promise<WebElement[]>` - Find multiple elements
- `wait(selector: string, options?: WaitOptions): Promise<WebElement>` - Wait for element

#### Interaction Methods
- `click(selector: string): Promise<void>` - Click element
- `sendKeys(selector: string, text: string): Promise<void>` - Type text
- `getText(selector: string): Promise<string>` - Get element text
- `getAttribute(selector: string, attribute: string): Promise<string>` - Get attribute

#### Screenshot Methods
- `getFullScreenshot(): Promise<string>` - Get full page screenshot (closes browser)
- `saveScreenshot(path: string): Promise<void>` - Save screenshot to file (closes browser)
- `saveElementScreenshot(selector: string, path: string): Promise<void>` - Save element screenshot

#### Utility Methods
- `executeScript(script: string, ...args: any[]): Promise<any>` - Execute JavaScript
- `scrollIntoView(element: WebElement): Promise<void>` - Scroll element into view
- `close(): Promise<void>` - Close browser and cleanup

### ChromeBasic Class Methods

#### `initialize(options: { headless?: boolean; arguments?: string[] }): Promise<void>`
Initialize basic Chrome instance.

#### `goto(url: string): Promise<void>`
Navigate to URL.

#### `close(): Promise<void>`
Close browser.

### Utility Functions

#### `getProfileByEmail(email: string, userDataDir: string): string | null`
Find Chrome profile directory by email address.

#### `goChrome(url: string): Promise<WebDriver>`
Quick helper to create Chrome instance and navigate to URL.

---

This user guide provides comprehensive coverage of the jnu-web package capabilities. For additional examples and advanced usage patterns, refer to the package's test files and source code documentation.