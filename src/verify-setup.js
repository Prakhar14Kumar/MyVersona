#!/usr/bin/env node

/**
 * VerSona - Setup Verification Script
 * 
 * Verifies that all infrastructure is correctly configured
 * Run: node verify-setup.js
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`),
};

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;

function check(condition, successMsg, errorMsg, isWarning = false) {
  totalChecks++;
  if (condition) {
    log.success(successMsg);
    passedChecks++;
    return true;
  } else {
    if (isWarning) {
      log.warning(errorMsg);
      warnings++;
    } else {
      log.error(errorMsg);
      failedChecks++;
    }
    return false;
  }
}

function fileExists(filePath) {
  return existsSync(join(__dirname, filePath));
}

function fileContains(filePath, searchString) {
  try {
    const content = readFileSync(join(__dirname, filePath), 'utf8');
    return content.includes(searchString);
  } catch {
    return false;
  }
}

async function verifySetup() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         VerSona - Setup Verification Script              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Section 1: Core Files
  log.header('Section 1: Core Build Files');
  check(
    fileExists('package.json'),
    'package.json exists',
    'package.json is missing'
  );
  check(
    fileExists('vite.config.ts'),
    'vite.config.ts exists',
    'vite.config.ts is missing'
  );
  check(
    fileExists('tsconfig.json'),
    'tsconfig.json exists',
    'tsconfig.json is missing'
  );
  check(
    fileExists('tsconfig.node.json'),
    'tsconfig.node.json exists',
    'tsconfig.node.json is missing'
  );
  check(
    fileExists('index.html'),
    'index.html exists',
    'index.html is missing'
  );
  check(
    fileExists('main.tsx'),
    'main.tsx exists',
    'main.tsx is missing'
  );
  check(
    fileExists('App.tsx'),
    'App.tsx exists',
    'App.tsx is missing'
  );

  // Section 2: Styling
  log.header('Section 2: Styling Configuration');
  check(
    fileExists('tailwind.config.js'),
    'tailwind.config.js exists',
    'tailwind.config.js is missing'
  );
  check(
    fileExists('postcss.config.js'),
    'postcss.config.js exists',
    'postcss.config.js is missing'
  );
  check(
    fileExists('styles/globals.css'),
    'styles/globals.css exists',
    'styles/globals.css is missing'
  );
  check(
    fileContains('styles/globals.css', '@import "tailwindcss"'),
    'globals.css contains Tailwind import',
    'globals.css missing Tailwind import',
    true
  );

  // Section 3: Environment
  log.header('Section 3: Environment Configuration');
  check(
    fileExists('.env.example'),
    '.env.example exists',
    '.env.example is missing'
  );
  check(
    fileContains('.env.example', 'VITE_FIREBASE_API_KEY'),
    '.env.example has Firebase config',
    '.env.example missing Firebase variables'
  );
  check(
    fileExists('.gitignore'),
    '.gitignore exists',
    '.gitignore is missing'
  );
  check(
    fileContains('.gitignore', '.env'),
    '.gitignore ignores .env files',
    '.gitignore not protecting .env files'
  );

  // Section 4: Package.json
  log.header('Section 4: Package.json Verification');
  check(
    fileContains('package.json', '"dev"'),
    'dev script exists',
    'dev script missing in package.json'
  );
  check(
    fileContains('package.json', '"build"'),
    'build script exists',
    'build script missing in package.json'
  );
  check(
    fileContains('package.json', '"preview"'),
    'preview script exists',
    'preview script missing in package.json'
  );
  check(
    fileContains('package.json', '"node": ">=18'),
    'Node version locked (>=18)',
    'Node version not specified'
  );
  check(
    fileContains('package.json', '"type": "module"'),
    'ESM module type set',
    'Module type not set to ESM',
    true
  );

  // Section 5: Dependencies
  log.header('Section 5: Critical Dependencies');
  check(
    fileContains('package.json', 'react'),
    'React dependency listed',
    'React not in dependencies'
  );
  check(
    fileContains('package.json', 'react-dom'),
    'React DOM dependency listed',
    'React DOM not in dependencies'
  );
  check(
    fileContains('package.json', 'vite'),
    'Vite dependency listed',
    'Vite not in devDependencies'
  );
  check(
    fileContains('package.json', 'tailwindcss'),
    'Tailwind CSS dependency listed',
    'Tailwind CSS not in devDependencies'
  );
  check(
    fileContains('package.json', 'typescript'),
    'TypeScript dependency listed',
    'TypeScript not in devDependencies'
  );
  check(
    fileContains('package.json', 'lucide-react'),
    'lucide-react dependency listed',
    'lucide-react not in dependencies',
    true
  );
  check(
    fileContains('package.json', 'firebase'),
    'Firebase dependency listed',
    'Firebase not in dependencies'
  );

  // Section 6: Component Files
  log.header('Section 6: Core Components');
  check(
    fileExists('components/ui/button.tsx'),
    'UI Button component exists',
    'UI Button component missing',
    true
  );
  check(
    fileExists('lib/config.ts'),
    'Config utility exists',
    'Config utility missing'
  );
  check(
    fileExists('lib/firebase.ts'),
    'Firebase service exists',
    'Firebase service missing',
    true
  );
  check(
    fileExists('contexts/AppContext.tsx'),
    'AppContext exists',
    'AppContext missing',
    true
  );

  // Section 7: Documentation
  log.header('Section 7: Documentation');
  check(
    fileExists('SETUP_INSTRUCTIONS.md'),
    'Setup instructions exist',
    'Setup instructions missing',
    true
  );
  check(
    fileExists('INFRASTRUCTURE_SETUP_COMPLETE.md'),
    'Infrastructure docs exist',
    'Infrastructure docs missing',
    true
  );
  check(
    fileExists('README.md'),
    'README exists',
    'README missing',
    true
  );

  // Summary
  log.header('Verification Summary');
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`${colors.green}✅ Passed: ${passedChecks}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failedChecks}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}`);

  console.log('\n' + '═'.repeat(60) + '\n');

  if (failedChecks === 0) {
    log.success('All critical checks passed! ✨');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run: npm install');
    console.log('   2. Copy .env.example to .env and add Firebase credentials');
    console.log('   3. Run: npm run dev');
    console.log('   4. Open: http://localhost:5173\n');
    process.exit(0);
  } else {
    log.error(`${failedChecks} critical check(s) failed`);
    console.log('\n📋 Action Required:');
    console.log('   Review the errors above and fix missing files\n');
    process.exit(1);
  }
}

verifySetup();
