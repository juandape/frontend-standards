/* eslint-disable import/no-unused-modules */
/**
 * @fileoverview Configuration file for checkFrontendStandards.mjs
 *
 * **Rule Structure:**
 * Each rule must have:
 * - `name`: Unique identifier (string)
 * - `check`: Function that returns true for violations (content, filePath) => boolean | number[]
 * - `message`: Error message shown to users (string)
 * - `category`: Optional grouping ('structure', 'naming', 'content', 'style', 'documentation', etc.)
 * - `severity`: Optional level ('error', 'warning', 'info')
 *
 * **Configuration Options:**
 * - `merge`: Boolean to control if custom rules merge with defaults
 * - `onlyChangedFiles`: Boolean to only check files staged for commit (default: true)
 * - `zones`: Object to configure which directories to validate
 * - `rules`: Array of custom validation rules
 *
 * @author Juan David Peña
 * @license MIT
 */

export default {
  // ==========================================
  // ⚙️ SYSTEM CONFIGURATION
  // ==========================================

  // Merge custom rules with default rules (default: true)
  merge: true,

  // Only check files staged for commit (default: true)
  // If set to false, all project files will be checked
  onlyChangedFiles: true,

  zones: {
    // Whether to include 'packages' directory in validation (default: false)
    includePackages: false,

    // Validate only one specific zone
    // onlyZone: 'auth', // Example: 'auth', 'src', 'components', 'pages', etc.
    // onlyZone: 'src/auth', // For zone within src
    // onlyZone: 'app/(auth)', // For Next.js App Router
    // onlyZone: 'packages/ui', // For monorepos

    // Custom zones to include in validation (ignored if onlyZone is defined)
    // If customZones are specified, all files in those zones will be checked
    // ignoring the onlyChangedFiles option
    customZones: [
      // 'custom-folder',
      // 'another-folder'
    ],
  },

  // ==========================================
  // 📋 RULES CONFIGURATION
  // ==========================================
  rules: function (defaultRules) {
    // ==========================================
    // 🚫 DISABLE EXISTING RULES
    // ==========================================
    // Filter out rules you want to disable from the 64 available default rules:
    // Choose from the complete list of available rules:
    //
    // 🏗️ STRUCTURE RULES (12 rules):
    // 'Folder structure', 'Src structure', 'Component size limit',
    // 'No circular dependencies', 'Missing test files', 'Test file naming convention',
    // 'Missing index.ts in organization folders', 'GitFlow branch naming convention',
    // 'Environment-specific configuration', 'Proper release versioning',
    // 'Platform-specific code organization', 'Sync branch validation'
    //
    // 🏷️ NAMING RULES (12 rules):
    // 'Component naming', 'Hook naming', 'Type naming', 'Constants naming',
    // 'Helper naming', 'Style naming', 'Assets naming', 'Folder naming convention',
    // 'Directory naming convention', 'Interface naming with I prefix',
    // 'Constant export naming UPPERCASE', 'Next.js app router naming'
    //
    // 💻 CONTENT RULES (10 rules):
    // 'No console.log', 'No var', 'No any type', 'No inline styles',
    // 'No alert', 'No hardcoded URLs', 'Must use async/await', 'No jQuery',
    // 'No merge conflicts markers', 'No committed credentials'
    //
    // ⚛️ REACT RULES (7 rules):
    // 'Client component directive', 'Proper hook dependencies',
    // 'Component props interface', 'Avoid React.FC', 'Proper key prop in lists',
    // 'Styled components naming', 'Tailwind CSS preference'
    //
    // 🔷 TYPESCRIPT RULES (3 rules):
    // 'Prefer type over interface for unions', 'Explicit return types for functions',
    // 'Proper generic naming'
    //
    // 📦 IMPORT RULES (5 rules):
    // 'Direct imports for sibling files', 'Import order', 'Use absolute imports',
    // 'No default and named imports mixed', 'No unused imports'
    //
    // ⚡ PERFORMANCE RULES (5 rules):
    // 'Next.js Image optimization', 'Avoid inline functions in JSX',
    // 'Missing React.memo for pure components', 'Large bundle imports',
    // 'Avoid re-renders with object literals'
    //
    // ♿ ACCESSIBILITY RULES (6 rules):
    // 'Button missing accessible name', 'Form inputs missing labels',
    // 'Image alt text', 'Links missing accessible names',
    // 'Missing focus management', 'Color contrast considerations'
    //
    // 📖 DOCUMENTATION RULES (4 rules):
    // 'Missing comment in complex function', 'Should have TSDoc comments',
    // 'JSDoc for complex functions', 'English-only comments'

    // Examples of commonly disabled rules (CORRECT METHOD):
    const disabledRules = [
      // 'No console.log',           // Allow console.log statements
      // 'No any type',             // Allow TypeScript any type
      // 'English-only comments',   // Allow non-English comments
      // 'Component naming',        // Disable component naming rules
      // 'Missing test files',      // Don't require test files
    ];

    const filteredRules = defaultRules.filter(
      (rule) => !disabledRules.includes(rule.name)
    );

    // ==========================================
    // 🔄 MODIFY EXISTING RULES
    // ==========================================
    const modifiedRules = filteredRules.map((rule) => {
      // Example: Change rule severity
      // if (rule.name === 'No any type') {
      //   return { ...rule, severity: 'warning' }; // Change from error to warning
      // }

      // Example: Customize rule message
      // if (rule.name === 'Component naming') {
      //   return {
      //     ...rule,
      //     message: 'Components should use PascalCase naming convention.',
      //   };
      // }

      return rule;
    });

    // ==========================================
    // 🎯 CUSTOM CONTENT RULES
    // ==========================================
    const customRules = [
      // {
      //   name: 'No hardcoded URLs',
      //   category: 'content',
      //   severity: 'warning',
      //   check: (content) => /https?:\/\/[^\s'"]+/.test(content),
      //   message: 'Use environment variables for URLs.',
      // },
      // {
      //   name: 'Custom hook naming',
      //   category: 'naming',
      //   severity: 'error',
      //   check: (content, filePath) => {
      //     if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return false;
      //     return /const\s+\w+\s*=\s*use\w+/.test(content) && !/const\s+use\w+/.test(content);
      //   },
      //   message: 'Custom hooks should start with "use".',
      // },
      // {
      //   name: 'No pending tasks',
      //   category: 'content',
      //   severity: 'warning',
      //   check: (content) => content.includes('TASK'),
      //   message: 'Resolve pending tasks before committing.',
      // },
      // ==========================================
      // 🔍 ADVANCED REGEX RULES
      // ==========================================
      // {
      //   name: 'No debug statements',
      //   category: 'content',
      //   severity: 'error',
      //   check: (content) => {
      //     const debugRegex = /(?:^|[^\/\*])(?:console\.(?:debug|trace)|debugger)/gm;
      //     return debugRegex.test(content);
      //   },
      //   message: 'Remove debug statements from production code.',
      // },
      // {
      //   name: 'No hardcoded secrets',
      //   category: 'security',
      //   severity: 'error',
      //   check: (content) => {
      //     const secretPatterns = [
      //       /(?:password|secret|key|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      //       /(?:api[_-]?key|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/gi,
      //     ];
      //     return secretPatterns.some(pattern => pattern.test(content));
      //   },
      //   message: 'Use environment variables for secrets.',
      // },
      // ==========================================
      // 📁 FILE-SPECIFIC RULES
      // ==========================================
      // {
      //   name: 'Component prop types',
      //   category: 'typescript',
      //   severity: 'error',
      //   check: (content, filePath) => {
      //     if (!filePath.includes('/components/') || !filePath.endsWith('.tsx')) {
      //       return false;
      //     }
      //     const hasProps = /(?:function|const)\s+\w+.*\(\s*\{\s*\w+/.test(content);
      //     const hasInterface = /interface\s+\w+Props/.test(content);
      //     const hasType = /type\s+\w+Props/.test(content);
      //     return hasProps && !hasInterface && !hasType;
      //   },
      //   message: 'React components with props must define TypeScript interfaces.',
      // },
      // ==========================================
      // 🔒 SECURITY RULES
      // ==========================================
      // {
      //   name: 'Unsafe HTML injection',
      //   category: 'security',
      //   severity: 'error',
      //   check: (content) => {
      //     const dangerousHTML = /dangerouslySetInnerHTML\s*=\s*{\s*{?\s*__html:/g;
      //     const hasSanitization = /DOMPurify|sanitize|xss/gi;
      //     return dangerousHTML.test(content) && !hasSanitization.test(content);
      //   },
      //   message: 'Sanitize HTML content before using dangerouslySetInnerHTML.',
      // },
      // ==========================================
      // 🚀 PERFORMANCE RULES
      // ==========================================
      // {
      //   name: 'React performance',
      //   category: 'performance',
      //   severity: 'warning',
      //   check: (content, filePath) => {
      //     if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) {
      //       return false;
      //     }
      //     const inlineFunctionRegex = /\w+\s*=\s*{\s*\([^)]*\)\s*=>/g;
      //     return inlineFunctionRegex.test(content);
      //   },
      //   message: 'Avoid inline functions in JSX props to prevent re-renders.',
      // },
      // ==========================================
      // 🎯 QUICK START EXAMPLES
      // ==========================================
      // {
      //   name: 'No hardcoded URLs',
      //   category: 'content',
      //   severity: 'warning',
      //   check: (content) => /https?:\/\/[^\s'"]+/.test(content),
      //   message: 'Use environment variables for URLs.',
      // },
      // {
      //   name: 'React hooks naming',
      //   category: 'naming',
      //   severity: 'error',
      //   check: (content, filePath) => {
      //     if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return false;
      //     return /const\s+\w+\s*=\s*use\w+/.test(content) && !/const\s+use\w+/.test(content);
      //   },
      //   message: 'Custom hooks should start with "use".',
      // },
    ];

    return [...modifiedRules, ...customRules];
  },
};
