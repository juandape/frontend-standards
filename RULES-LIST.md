# 📋 Frontend Standards Checker - Complete Rules List

> **🆕 Compatibility**: Frontend Standards Checker supports both React/Next.js projects and **React Native** apps. It includes specific rules for multiplatform organization (.web.tsx/.native.tsx), platform-specific code separation, and best practices for both environments.

## 🔴 Error Rules (26 total)

_Error rules indicate critical issues that can break the code or prevent compilation._

### 🏷️ Naming (10 rules)

1. **Component naming** `(naming)` - Component files must use PascalCase
2. **Hook naming** `(naming)` - Hooks must follow the "useHookName.hook.ts" pattern with PascalCase after "use"
3. **Type naming** `(naming)` - Type files must be camelCase + .type.ts/.types.ts
4. **Helper naming** `(naming)` - Helpers must be camelCase + .helper.ts/.helper.tsx
5. **Style naming** `(naming)` - Styles must be camelCase + .style.ts
6. **Assets naming** `(naming)` - Assets must use kebab-case
7. **Folder naming convention** `(naming)` - Use plural names: helpers, hooks, types, etc.
8. **Interface naming with I prefix** `(naming)` - Interfaces must use "I" prefix + PascalCase
9. **Test file naming convention** `(naming)` - Tests must follow _.test.tsx or _.spec.tsx
10. **Component function name match** `(naming)` - The main function in index.tsx must match its containing folder name

### 💻 Content/TypeScript (16 rules)

11. **No var** `(content)` - Use let or const instead of var
12. **No any type** `(typescript)` - Avoid "any" type, use specific types
    - ⚠️ For React Native projects this rule is WARNING, not ERROR. "Any" is allowed only in exceptional cases (integration with external libraries, rapid prototyping).
13. **No alert** `(content)` - Do not use alert(), use appropriate notifications
14. **No hardcoded URLs** `(content)` - No hardcoded URLs, use environment variables
15. **No jQuery** `(content)` - Do not use jQuery in modern projects
16. **No circular dependencies** `(content)` - Avoid circular dependencies
17. **No merge conflicts markers** `(content)` - Resolve Git conflict markers
18. **No committed credentials** `(content)` - Do not commit credentials or sensitive data
19. **No console.log** `(content)` - Remove console statements before production
20. **No inline styles** `(content)` - Avoid inline styles, use CSS classes
21. **Direct imports for sibling files** `(imports)` - Files at the same level must be imported directly, not through index
22. **Client component directive** `(react)` - Components with client-side features must include "use client"
23. **Proper key prop in lists** `(react)` - Elements in arrays must have a key prop
24. **Button missing accessible name** `(accessibility)` - Buttons must have accessible names
25. **Form inputs missing labels** `(accessibility)` - Inputs must have associated labels
26. **English-only comments** `(documentation)` - Comments and JSDoc must be written in English only

---

## 🟡 Warning Rules (19 total)

_Warning rules highlight important best practices that should be followed._

### 🏗️ Structure (4 rules)

1. **Folder structure** `(structure)` - Components must follow proper structure in src/
2. **Src structure** `(structure)` - Files must be organized in appropriate src/ structure
3. **Component size limit** `(structure)` - Components must not exceed 200 lines
4. **No circular dependencies** `(structure)` - Detect potential circular dependencies

### 📝 Content/Documentation (4 rules)

5. **Next.js Image optimization** `(performance)` - Use Next.js Image component
6. **Image alt text** `(accessibility)` - Images must have alt text
7. **Must use async/await** `(content)` - Prefer async/await over .then()
8. **Missing comment in complex function** `(documentation)` - Complex functions must have comments

### 🔷 TypeScript (3 rules)

11. **Prefer type over interface for unions** `(typescript)` - Use "type" for true unions
12. **Interface naming convention** `(typescript)` - Interfaces must follow naming conventions
13. **Missing index.ts in organization folders** `(structure)` - Organization folders must have index.ts

### ⚛️ React/Performance (5 rules)

14. **Proper hook dependencies** `(react)` - useEffect/useCallback must include all dependencies
15. **Component props interface** `(react)` - React components must define props with TypeScript interfaces
16. **Avoid React.FC** `(react)` - Avoid React.FC, use regular function declaration
17. **Styled components naming** `(react)` - Styled components must use PascalCase
18. **Avoid inline functions in JSX** `(performance)` - Avoid inline functions in JSX props

### 📦 Imports (3 rules)

19. **Import order** `(structure)` - Imports must be ordered: external, internal, relative
20. **Use absolute imports** `(imports)` - Use absolute imports instead of deep relatives
21. **No unused imports** `(imports)` - Remove unused imports

---

## 🔵 Info Rules (19 total)

_Info rules provide suggestions and optional optimizations._

### 🏗️ Structure/Organization (5 rules)

1. **Missing test files** `(structure)` - Important components should have tests
2. **Constants naming** `(naming)` - Constants must be camelCase + .constant.ts
3. **Directory naming convention** `(naming)` - Directories must follow camelCase or PascalCase
4. **GitFlow branch naming convention** `(structure)` - Branches must follow GitFlow convention
5. **Next.js app router naming** `(naming)` - Next.js app router directories must use kebab-case

### 📖 Documentation (2 rules)

6. **Should have TSDoc comments** `(documentation)` - Exported functions should have TSDoc comments
7. **JSDoc for complex functions** `(documentation)` - Very complex functions should have JSDoc

### 🔷 TypeScript (3 rules)

8. **Explicit return types for functions** `(typescript)` - Public functions must have explicit return types
9. **Proper generic naming** `(typescript)` - Generic type parameters must have descriptive names
10. **No default and named imports mixed** `(imports)` - Prefer separate import statements

### ⚡ Performance (2 rules)

11. **Missing React.memo for pure components** `(performance)` - Consider React.memo for pure components
12. **Large bundle imports** `(performance)` - Consider specific imports for large libraries

### 📱 React Native (1 rule)

13. **Platform-specific code organization** `(structure)` - Use .web.tsx and .native.tsx extensions for platform-specific code

### ♿ Accessibility/Styles (3 rules)

14. **Links missing accessible names** `(accessibility)` - Links must have descriptive text
15. **Missing focus management** `(accessibility)` - Components with modals must handle focus
16. **Color contrast considerations** `(accessibility)` - Consider color contrast ratios

---

## 📊 Statistical Summary

| Type            | Count        | Description                   |
| --------------- | ------------ | ----------------------------- |
| 🔴 **Errors**   | **26 rules** | Code breaks or won't compile  |
| 🟡 **Warnings** | **19 rules** | Important best practices      |
| 🔵 **Info**     | **19 rules** | Suggestions and optimizations |
| 📈 **Total**    | **64 rules** |                               |

### 🏆 Most Important Categories

| Category | Rules | Description |
| 📱 **React Native** | **1 rule** | Specific support for React Native |
| -------------------- | ------------- | ---------------------------------- |
| 🏷️ **Naming** | **14 rules** | Naming conventions |
| ⚛️ **React** | **8 rules** | React-specific best practices |
| 🔷 **TypeScript** | **8 rules** | Typing and TS conventions |
| 💻 **Content** | **7 rules** | Code quality and security |
| ♿ **Accessibility** | **6 rules** | Web accessibility |
| ⚡ **Performance** | **5 rules** | Performance optimization |
| 🏗️ **Structure** | **5 rules** | File organization |
| 📖 **Documentation** | **4 rules** | Code documentation |
| 📦 **Imports** | **5 rules** | Import management |

---

> **💡 Note:** This document is updated automatically as rules are added or modified in the Frontend Standards Checker.
>
> **🆕 v4.5.0:** Fixed a critical bug where INFO rules did not appear in reports. Now all INFO severity rules are correctly shown in the "DETAILED INFO SUGGESTIONS" section of the log.

---

## 📋 Complete Alphabetical List of All Available Rules

For configuration purposes, here are all **64 rules** available in the system:

### A-D

- Assets naming
- Avoid inline functions in JSX
- Avoid re-renders with object literals
- Avoid React.FC
- Button missing accessible name
- Client component directive
- Color contrast considerations
- Component naming
- Component props interface
- Component size limit
- Constant export naming UPPERCASE
- Constants naming
- Direct imports for sibling files
- Directory naming convention

### E-M

- English-only comments
- Environment-specific configuration
- Explicit return types for functions
- Folder naming convention
- Folder structure
- Form inputs missing labels
- GitFlow branch naming convention
- Helper naming
- Hook naming
- Image alt text
- Import order
- Interface naming with I prefix
- JSDoc for complex functions
- Large bundle imports
- Links missing accessible names
- Missing comment in complex function
- Missing focus management
- Missing index.ts in organization folders
- Missing React.memo for pure components
- Missing test files
- Must use async/await

### N-S

- Next.js app router naming
- Next.js Image optimization
- No alert
- No any type
- No circular dependencies
- No committed credentials
- No console.log
- No default and named imports mixed
- No hardcoded URLs
- No inline styles
- No jQuery
- No merge conflicts markers
- No unused imports
- No var
- Platform-specific code organization
- Prefer type over interface for unions
- Proper generic naming
- Proper hook dependencies
- Proper key prop in lists
- Proper release versioning
- Should have TSDoc comments
- Src structure
- Style naming
- Styled components naming
- Sync branch validation

### T-Z

- Tailwind CSS preference
- Test file naming convention
- Type naming
- Use absolute imports

> **🔧 Configuration Tip:** You can disable any of these rules by adding their exact name to the `disabledRules` array in your `checkFrontendStandards.config.mjs` file.

---
