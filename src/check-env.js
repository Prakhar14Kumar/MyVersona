#!/usr/bin/env node

/**
 * VerSona Environment Configuration Checker
 * Validates that all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Required environment variables
const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

// Optional but recommended
const OPTIONAL_VARS = [
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_BACKEND_URL',
];

// Demo/placeholder values that should be replaced
const DEMO_VALUES = [
  'your_api_key_here',
  'your_actual_api_key_here',
  'your-project.firebaseapp.com',
  'your-project-id',
  'your-project.appspot.com',
  'AIzaSyDEMO_PlaceholderKey_ReplaceWithReal',
  'versona-demo',
  'G-DEMO123456',
];

console.log(`\n${colors.cyan}${colors.bright}🔍 VerSona Environment Configuration Checker${colors.reset}\n`);

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log(`${colors.red}❌ Error: .env file not found${colors.reset}`);
  console.log(`\n${colors.yellow}To fix this:${colors.reset}`);
  console.log(`1. Copy the example file: ${colors.cyan}cp .env.example .env${colors.reset}`);
  console.log(`2. Edit .env and add your Firebase credentials`);
  console.log(`3. Run this checker again: ${colors.cyan}npm run check-env${colors.reset}\n`);
  process.exit(1);
}

console.log(`${colors.green}✓${colors.reset} .env file found\n`);

// Parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Validation results
let hasErrors = false;
let hasWarnings = false;
const issues = {
  missing: [],
  demo: [],
  optional: [],
};

// Check required variables
console.log(`${colors.bright}Required Configuration:${colors.reset}`);
REQUIRED_VARS.forEach(varName => {
  const value = envVars[varName];
  
  if (!value || value === '') {
    console.log(`  ${colors.red}✗ ${varName}${colors.reset} - Missing`);
    issues.missing.push(varName);
    hasErrors = true;
  } else if (DEMO_VALUES.some(demo => value.includes(demo))) {
    console.log(`  ${colors.yellow}⚠ ${varName}${colors.reset} - Using demo/placeholder value`);
    issues.demo.push(varName);
    hasWarnings = true;
  } else {
    // Mask the value for security (show first 10 chars)
    const maskedValue = value.length > 10 ? `${value.substring(0, 10)}...` : value;
    console.log(`  ${colors.green}✓ ${varName}${colors.reset} - ${colors.cyan}${maskedValue}${colors.reset}`);
  }
});

// Check optional variables
console.log(`\n${colors.bright}Optional Configuration:${colors.reset}`);
OPTIONAL_VARS.forEach(varName => {
  const value = envVars[varName];
  
  if (!value || value === '') {
    console.log(`  ${colors.yellow}○ ${varName}${colors.reset} - Not set (optional)`);
    issues.optional.push(varName);
  } else if (DEMO_VALUES.some(demo => value.includes(demo))) {
    console.log(`  ${colors.yellow}⚠ ${varName}${colors.reset} - Using demo/placeholder value`);
    hasWarnings = true;
  } else {
    const maskedValue = value.length > 10 ? `${value.substring(0, 10)}...` : value;
    console.log(`  ${colors.green}✓ ${varName}${colors.reset} - ${colors.cyan}${maskedValue}${colors.reset}`);
  }
});

// Summary
console.log(`\n${colors.bright}Summary:${colors.reset}`);

if (!hasErrors && !hasWarnings) {
  console.log(`${colors.green}${colors.bright}✓ All checks passed!${colors.reset} Your environment is properly configured.\n`);
  process.exit(0);
}

if (hasErrors) {
  console.log(`\n${colors.red}${colors.bright}❌ Configuration Errors Found${colors.reset}`);
  
  if (issues.missing.length > 0) {
    console.log(`\n${colors.red}Missing required variables:${colors.reset}`);
    issues.missing.forEach(varName => {
      console.log(`  • ${varName}`);
    });
  }
  
  console.log(`\n${colors.yellow}How to fix:${colors.reset}`);
  console.log(`1. Open your .env file`);
  console.log(`2. Add the missing variables with your Firebase credentials`);
  console.log(`3. Get credentials from: ${colors.cyan}https://console.firebase.google.com/${colors.reset}`);
  console.log(`4. Run ${colors.cyan}npm run check-env${colors.reset} again\n`);
  
  process.exit(1);
}

if (hasWarnings) {
  console.log(`\n${colors.yellow}${colors.bright}⚠ Configuration Warnings${colors.reset}`);
  
  if (issues.demo.length > 0) {
    console.log(`\n${colors.yellow}Using demo/placeholder values:${colors.reset}`);
    issues.demo.forEach(varName => {
      console.log(`  • ${varName}`);
    });
    
    console.log(`\n${colors.yellow}These demo values will NOT work in production!${colors.reset}`);
    console.log(`Replace them with your actual Firebase credentials.`);
    console.log(`Get credentials from: ${colors.cyan}https://console.firebase.google.com/${colors.reset}\n`);
  }
  
  if (issues.optional.length > 0) {
    console.log(`\n${colors.yellow}Optional variables not set:${colors.reset}`);
    issues.optional.forEach(varName => {
      console.log(`  • ${varName}`);
    });
    console.log(`\nThese are optional but recommended for full functionality.\n`);
  }
  
  // For development, we allow warnings
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${colors.yellow}Proceeding with warnings (development mode)${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}Cannot proceed in production mode with warnings${colors.reset}\n`);
    process.exit(1);
  }
}
