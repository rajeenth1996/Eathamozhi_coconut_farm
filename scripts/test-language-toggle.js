// Automated Test for Tamil/English Language Toggle & Localization System
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('======================================================');
console.log('  TESTING LANGUAGE TOGGLE & LOCALIZATION SYSTEM       ');
console.log('======================================================');

let passed = 0;
let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc} -> ${err.message}`);
    failed++;
  }
}

// 1. Verify translations file exists and is valid TypeScript
check('translations.ts exists and contains en and ta dictionaries', () => {
  const translationsPath = path.join(__dirname, '..', 'src', 'lib', 'translations.ts');
  assert(fs.existsSync(translationsPath), 'src/lib/translations.ts does not exist');
  const content = fs.readFileSync(translationsPath, 'utf8');
  assert(content.includes('en: {'), 'en dictionary missing');
  assert(content.includes('ta: {'), 'ta dictionary missing');
  assert(content.includes('தமிழ்'), 'Tamil label missing');
  assert(content.includes('English'), 'English label missing');
});

// 2. Verify LanguageContext.tsx exists and exports LanguageProvider, useLanguage, and Trans
check('LanguageContext.tsx exports LanguageProvider, useLanguage, and Trans', () => {
  const contextPath = path.join(__dirname, '..', 'src', 'context', 'LanguageContext.tsx');
  assert(fs.existsSync(contextPath), 'src/context/LanguageContext.tsx does not exist');
  const content = fs.readFileSync(contextPath, 'utf8');
  assert(content.includes('export function LanguageProvider'), 'LanguageProvider missing');
  assert(content.includes('export function useLanguage'), 'useLanguage missing');
  assert(content.includes('export function Trans'), 'Trans component missing');
  assert(content.includes("localStorage.getItem('eathamozhi_lang')"), 'localStorage integration missing');
  assert(content.includes("document.documentElement.lang"), 'HTML lang attribute update missing');
});

// 3. Verify LanguageToggle.tsx component exists and provides accessible toggle
check('LanguageToggle.tsx renders accessible EN and தமிழ் options', () => {
  const togglePath = path.join(__dirname, '..', 'src', 'components', 'LanguageToggle.tsx');
  assert(fs.existsSync(togglePath), 'src/components/LanguageToggle.tsx does not exist');
  const content = fs.readFileSync(togglePath, 'utf8');
  assert(content.includes('setLanguage(\'en\')'), 'EN toggle action missing');
  assert(content.includes('setLanguage(\'ta\')'), 'Tamil toggle action missing');
  assert(content.includes('தமிழ்'), 'Tamil label missing in toggle');
  assert(content.includes('bi-translate'), 'Translate icon missing');
});

// 4. Verify Navbar.tsx incorporates LanguageToggle in desktop and mobile view
check('Navbar.tsx incorporates LanguageToggle in desktop and mobile navigation', () => {
  const navPath = path.join(__dirname, '..', 'src', 'components', 'Navbar.tsx');
  const content = fs.readFileSync(navPath, 'utf8');
  assert(content.includes('<LanguageToggle'), 'LanguageToggle missing in Navbar');
  assert(content.includes('useLanguage'), 'useLanguage hook missing in Navbar');
  assert(content.includes("t('nav.home')"), 'Translated home link missing');
  assert(content.includes("t('nav.batches')"), 'Translated batches link missing');
  assert(content.includes("t('nav.motherTrees')"), 'Translated mother trees link missing');
});

// 5. Verify layout.tsx wraps application with LanguageProvider
check('layout.tsx wraps children with LanguageProvider and uses Footer', () => {
  const layoutPath = path.join(__dirname, '..', 'src', 'app', 'layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');
  assert(content.includes('<LanguageProvider>'), 'LanguageProvider wrapper missing in RootLayout');
  assert(content.includes('</LanguageProvider>'), 'LanguageProvider closing tag missing');
  assert(content.includes('<Footer'), 'Footer component missing in layout');
});

// 6. Verify Footer.tsx has LanguageToggle and localized labels
check('Footer.tsx provides language toggle and Tamil support', () => {
  const footerPath = path.join(__dirname, '..', 'src', 'components', 'Footer.tsx');
  assert(fs.existsSync(footerPath), 'src/components/Footer.tsx does not exist');
  const content = fs.readFileSync(footerPath, 'utf8');
  assert(content.includes('<LanguageToggle'), 'LanguageToggle missing in Footer');
  assert(content.includes('useLanguage'), 'useLanguage missing in Footer');
  assert(content.includes('isTamil'), 'isTamil conditional missing in Footer');
});

// 7. Verify LiveStockTerminal and BatchesClientList support Tamil
check('LiveStockTerminal and BatchesClientList support Tamil toggling', () => {
  const terminalPath = path.join(__dirname, '..', 'src', 'components', 'LiveStockTerminal.tsx');
  const terminalContent = fs.readFileSync(terminalPath, 'utf8');
  assert(terminalContent.includes('useLanguage'), 'useLanguage missing in LiveStockTerminal');
  assert(terminalContent.includes('நேரடி நாற்றுப்பண்ணை இருப்பு'), 'Tamil terminal title missing');
  assert(terminalContent.includes('விவசாயிகள் பார்த்துள்ளனர்'), 'Tamil farmer count missing');

  const batchesPath = path.join(__dirname, '..', 'src', 'components', 'BatchesClientList.tsx');
  const batchesContent = fs.readFileSync(batchesPath, 'utf8');
  assert(batchesContent.includes('useLanguage'), 'useLanguage missing in BatchesClientList');
  assert(batchesContent.includes('கிடைக்கும் நாற்றுகள்'), 'Tamil available filter missing');
  assert(batchesContent.includes('அனைத்து தொகுப்புகள்'), 'Tamil all filter missing');
});

console.log('======================================================');
console.log(`  LANGUAGE SYSTEM TESTS COMPLETE: ${passed} passed, ${failed} failed`);
console.log('======================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
