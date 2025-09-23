# E2E Test Suite - Page Object Model

This directory contains the refactored end-to-end test suite using the Page Object Model (POM) pattern for better maintainability and reusability.

## Structure

```
e2e/
├── pages/                    # Page Object Model classes
│   ├── BasePage.ts          # Base page class with common functionality
│   ├── AuthPage.ts          # Authentication page object
│   ├── HeaderPage.ts        # Header/navigation page object
│   ├── ParentDashboardPage.ts # Parent dashboard page object
│   ├── AdminDashboardPage.ts  # Admin dashboard page object
│   └── AdminSessionsPage.ts  # Admin sessions page object
├── utils/                    # Test utilities and helpers
│   └── helpers.ts           # Common test helper functions
├── data/                     # Test data files
│   └── testData.json        # Centralized test data
├── tests/                    # Refactored test files
│   ├── parent-dashboard.spec.ts
│   ├── admin-sessions-access.spec.ts
│   ├── header-profile.spec.ts
│   └── run-all-refactored.spec.ts
└── README.md                # This file
```

## Page Object Model Benefits

### 1. **Separation of Concerns**
- **Pages**: Encapsulate locators and page-specific actions
- **Tests**: Focus on test logic and assertions
- **Data**: Centralized test data management

### 2. **Reusability**
- Page objects can be reused across multiple tests
- Common actions are abstracted into helper methods
- Consistent interaction patterns

### 3. **Maintainability**
- Changes to UI elements only require updates in page objects
- Tests remain stable when selectors change
- Clear structure makes debugging easier

### 4. **Data-Driven Testing**
- All test data centralized in `testData.json`
- No hardcoded credentials or URLs in tests
- Easy to modify test data without touching test code

## Usage Examples

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { ParentDashboardPage } from '../pages/ParentDashboardPage';
import { TestHelpers } from '../utils/helpers';
import testData from '../data/testData.json';

test.describe('Example Test Suite', () => {
  let authPage: AuthPage;
  let parentDashboardPage: ParentDashboardPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize page objects
    authPage = new AuthPage(page);
    parentDashboardPage = new ParentDashboardPage(page);
    helpers = new TestHelpers(page);

    // Act: Login
    await helpers.loginAs('parent');
    await helpers.waitForNavigation(testData.urls.parentDashboard);
  });

  test('example test', async ({ page }) => {
    // Act: Perform actions using page objects
    await parentDashboardPage.clickPlayerTab();
    
    // Assert: Verify results
    await expect(parentDashboardPage.isPlayersCardVisible()).resolves.toBe(true);
  });
});
```

### Using Page Objects

```typescript
// Instead of raw selectors:
await page.click('[data-testid="user-menu-trigger"]');

// Use page object methods:
await headerPage.openUserMenu();
```

### Using Test Data

```typescript
// Instead of hardcoded values:
await page.fill('input[type="email"]', 'parent@test.com');

// Use test data:
const user = testData.users.parent;
await page.fill('input[type="email"]', user.email);
```

## Page Object Classes

### BasePage
- Common functionality for all pages
- Navigation methods
- Wait utilities
- Base URL management

### AuthPage
- Login functionality
- Form interactions
- Authentication state management

### HeaderPage
- User menu interactions
- Role badge verification
- Navigation actions

### ParentDashboardPage
- Dashboard card interactions
- Tab navigation
- Button actions

### AdminDashboardPage
- Admin-specific dashboard elements
- Management button interactions
- Email banner handling

### AdminSessionsPage
- Session management interface
- Create/edit session actions
- Session list interactions

## Helper Functions

### TestHelpers
- `loginAs(role)`: Login with specified role
- `waitForNavigation(path)`: Wait for URL change
- `generateRandomEmail()`: Generate test email
- `clearLocalStorage()`: Clear browser storage
- Common element interactions

## Test Data Structure

```json
{
  "users": {
    "parent": {
      "email": "parent@test.com",
      "password": "password123",
      "name": "Test Parent",
      "role": "parent"
    },
    "admin": {
      "email": "admin@test.com", 
      "password": "password123",
      "name": "Test Admin",
      "role": "admin"
    }
  },
  "urls": {
    "base": "http://localhost:3000",
    "auth": "/auth",
    "admin": "/admin",
    "parentDashboard": "/dashboard/parent"
  },
  "testIds": {
    "header": {
      "roleBadge": "role-badge",
      "userMenuTrigger": "user-menu-trigger"
    }
  },
  "expectedTexts": {
    "adminDashboard": {
      "title": "Admin Dashboard",
      "subtitle": "Manage your cricket academy operations"
    }
  }
}
```

## Running Tests

### Run All Refactored Tests
```bash
npx playwright test e2e/tests/ --headed
```

### Run Specific Test Suite
```bash
npx playwright test e2e/tests/parent-dashboard.spec.ts --headed
```

### Run with Debug Mode
```bash
npx playwright test e2e/tests/ --debug
```

## Best Practices

### 1. **Arrange-Act-Assert Pattern**
```typescript
test('example', async ({ page }) => {
  // Arrange: Set up test data and page objects
  const authPage = new AuthPage(page);
  
  // Act: Perform the action being tested
  await authPage.loginAs('parent');
  
  // Assert: Verify the expected outcome
  await expect(page).toHaveURL('/dashboard/parent');
});
```

### 2. **Descriptive Method Names**
```typescript
// Good: Descriptive and clear intent
await parentDashboardPage.clickViewFullCalendar();
await headerPage.openUserMenu();

// Avoid: Generic or unclear names
await parentDashboardPage.clickButton();
await headerPage.click();
```

### 3. **Consistent Error Handling**
```typescript
// Use helper methods for common operations
await helpers.waitForNavigation(path, timeout);
await helpers.clearLocalStorage();
```

### 4. **Data-Driven Assertions**
```typescript
// Use test data for assertions
expect(roleText).toContain(testData.users.parent.role);
await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.parentDashboard}`);
```

## Migration Guide

### From Old Tests to Page Object Model

1. **Identify Page Elements**: Extract selectors into page objects
2. **Create Page Classes**: Implement page-specific methods
3. **Update Test Data**: Move hardcoded values to `testData.json`
4. **Refactor Tests**: Use page objects instead of raw selectors
5. **Add Helpers**: Extract common operations into helper functions

### Example Migration

**Before (Raw Selectors):**
```typescript
await page.goto('http://localhost:3000/auth');
await page.fill('input[type="email"]', 'parent@test.com');
await page.fill('input[type="password"]', 'password123');
await page.click('button[type="submit"]');
await page.click('[data-testid="user-menu-trigger"]');
```

**After (Page Object Model):**
```typescript
await helpers.loginAs('parent');
await headerPage.openUserMenu();
```

This refactoring provides better maintainability, reusability, and test reliability while keeping the test code clean and readable.