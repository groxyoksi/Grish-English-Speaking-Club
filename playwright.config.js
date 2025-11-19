import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Grish English Speaking Club tests
 * 
 * Update the baseURL to your GitHub Pages URL:
 * https://YOUR-USERNAME.github.io/YOUR-REPO/
 */

export default defineConfig({
  testDir: './tests',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Fail fast - stop after first failure
  fullyParallel: false,
  
  // Retry failed tests once
  retries: 1,
  
  // Number of workers (parallel tests)
  workers: 1,
  
  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  // Shared settings for all tests
  use: {
    // Base URL for your app - UPDATE THIS!
    baseURL: 'https://groxyoksi.github.io/Grish-English-Speaking-Club/', // Change to your GitHub Pages URL
    
    // Browser viewport
    viewport: { width: 1280, height: 720 },
    
    // Screenshots on failure
    screenshot: 'only-on-failure',
    
    // Videos on failure
    video: 'retain-on-failure',
    
    // Trace on failure
    trace: 'retain-on-failure',
    
    // Action timeout
    actionTimeout: 10000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Uncomment to test on Firefox
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    
    // Uncomment to test on Safari
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    
    // Mobile tests
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Local dev server (optional - for testing locally)
  // webServer: {
  //   command: 'python -m http.server 8000',
  //   port: 8000,
  //   reuseExistingServer: true,
  // },
});
