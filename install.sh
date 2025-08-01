#!/bin/bash

# Frontend Standards Checker - Automatic Installation Script

set -e

# Save original directory
ORIGINAL_DIR=$(pwd)

echo "🚀 Frontend Standards Checker - Automatic Installation v4.10.0"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Utility functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to run commands with timeout
run_with_timeout() {
    local timeout_duration=$1
    shift

    if command -v timeout &> /dev/null; then
        timeout "$timeout_duration" "$@"
    else
        # If timeout is not available, run directly
        "$@"
    fi
}

# Check if we are in a project directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the root of your project."
    exit 1
fi

log_info "Detecting project type..."

# Detect package manager
PACKAGE_MANAGER=""
if [ -f "yarn.lock" ]; then
    PACKAGE_MANAGER="yarn"
    log_info "Detected: Yarn"
elif [ -f "package-lock.json" ]; then
    PACKAGE_MANAGER="npm"
    log_info "Detected: NPM"
else
    log_warning "No yarn.lock or package-lock.json found. Using npm by default."
    PACKAGE_MANAGER="npm"
fi

# Check if it is a React Native project
IS_REACT_NATIVE=false
if grep -q "react-native" package.json; then
    IS_REACT_NATIVE=true
    log_info "Detected: React Native project"
fi

# Create temporary directory outside the project
TEMP_DIR="/tmp/temp-frontend-standards-$$"
log_info "Creating temporary directory: $TEMP_DIR"

# Clone the repository
log_info "Downloading Frontend Standards Checker..."
if ! git clone --depth 1 https://github.com/juandape/frontend-standards.git "$TEMP_DIR"; then
    log_error "Error downloading repository"
    exit 1
fi

cd "$TEMP_DIR"

# Install dependencies and compile with timeout
log_info "Compiling Frontend Standards Checker..."
COMPILATION_SUCCESS=false

if command -v yarn &> /dev/null; then
    log_info "Installing dependencies with Yarn (timeout 60s)..."
    if run_with_timeout 60 yarn install > /dev/null 2>&1; then
        log_info "Compiling with Yarn (timeout 60s)..."
        if run_with_timeout 60 yarn build > /dev/null 2>&1; then
            COMPILATION_SUCCESS=true
        fi
    fi
fi

if [ "$COMPILATION_SUCCESS" = false ]; then
    log_warning "Yarn failed or timed out. Trying with npm..."
    if run_with_timeout 60 npm install > /dev/null 2>&1; then
        log_info "Compiling with npm (timeout 60s)..."
        if run_with_timeout 60 npm run build > /dev/null 2>&1; then
            COMPILATION_SUCCESS=true
        fi
    fi
fi

if [ "$COMPILATION_SUCCESS" = false ]; then
    log_warning "Compilation failed. Using precompiled files if they exist..."
    # Check if precompiled files already exist
    if [ ! -d "dist" ] && [ ! -f "bin/cli.ts" ]; then
        log_error "Could not compile or find precompiled files"
        cd "$ORIGINAL_DIR"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
fi

cd ..

# Installation method based on project type
install_method() {
    if [ "$IS_REACT_NATIVE" = true ]; then
        log_info "Optimized installation for React Native..."
        install_local_copy
    else
        log_info "Installation for monorepos and web projects..."
        # For monorepos also use local copy for consistency
        install_local_copy
    fi
}

# Local copy installation (works in all cases)
install_local_copy() {
    log_info "Using direct copy method..."

    # Return to original directory
    cd "$ORIGINAL_DIR"

    if [ -d "frontend-standards-full" ]; then
        log_warning "Directory frontend-standards-full already exists. Updating..."
        rm -rf frontend-standards-full
    fi

    cp -r "$TEMP_DIR" frontend-standards-full
    log_success "Frontend Standards copied to ./frontend-standards-full/"

    # Install dependencies in the copied directory if necessary
    log_info "Configuring local installation..."
    cd frontend-standards-full

    # Only install dependencies if dist or compiled files don't exist
    if [ ! -d "dist" ] && [ ! -f "bin/cli.js" ]; then
        log_info "Installing local dependencies..."
        if command -v yarn &> /dev/null; then
            run_with_timeout 60 yarn install > /dev/null 2>&1 || log_warning "Local dependencies installation failed, continuing..."
        else
            run_with_timeout 60 npm install > /dev/null 2>&1 || log_warning "Local dependencies installation failed, continuing..."
        fi
    fi

    cd "$ORIGINAL_DIR"

    # Ensure viewer HTML is present in bin after copy
    VIEWER_SRC_BIN="$ORIGINAL_DIR/bin/frontend-standards-log-viewer.html"
    VIEWER_DEST_BIN="frontend-standards-full/bin/frontend-standards-log-viewer.html"
    if [ ! -f "$VIEWER_DEST_BIN" ]; then
        if [ -f "$VIEWER_SRC_BIN" ]; then
            cp "$VIEWER_SRC_BIN" "$VIEWER_DEST_BIN"
            log_success "Viewer copied to bin: $VIEWER_DEST_BIN"
        else
            log_warning "Viewer HTML not found in source bin, not copied to bin."
        fi
    else
        log_info "Viewer already exists in bin: $VIEWER_DEST_BIN"
    fi

    # Add standards script and pre-commit hook for all project types
    add_standards_script_and_hook
}


# Add standards script and pre-commit hook for any project type
add_standards_script_and_hook() {
    log_info "Adding standards script to package.json for all project types..."

    cd "$ORIGINAL_DIR"
    PROJECT_ABS_PATH=$(pwd)

    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!pkg.scripts) pkg.scripts = {};
    if (!pkg.scripts['standards']) {
        pkg.scripts['standards'] = 'frontend-standards-checker';
    }
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "

    PRE_COMMIT_FILE=".husky/pre-commit"
    if [ ! -f "$PRE_COMMIT_FILE" ]; then
        mkdir -p .husky
        cat > "$PRE_COMMIT_FILE" << 'EOF'
#!/bin/sh
echo "Running pre-commit checks..."

# Execute standards check and capture exit code
echo "" | yarn standards --only-changed-files
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Frontend standards check failed. Please fix the errors before committing."
  exit 1
fi

echo "All checks passed. Proceeding with commit."
EOF
        chmod +x "$PRE_COMMIT_FILE"
        log_success "Created .husky/pre-commit with robust standards check"
    else
        # Check if yarn standards exists but not the robust version
        if grep -q "yarn standards" "$PRE_COMMIT_FILE" && ! grep -q "echo.*yarn standards.*only-changed-files" "$PRE_COMMIT_FILE"; then
            # Replace simple yarn standards with robust version
            sed -i.bak '/^[[:space:]]*yarn standards[[:space:]]*$/c\
# Execute standards check and capture exit code\
echo "" | yarn standards --only-changed-files\
exit_code=$?\
\
if [ $exit_code -ne 0 ]; then\
  echo "Frontend standards check failed. Please fix the errors before committing."\
  exit 1\
fi' "$PRE_COMMIT_FILE"
            rm -f "$PRE_COMMIT_FILE.bak"
            log_success "Updated yarn standards to robust version in .husky/pre-commit"
        elif ! grep -q "yarn standards" "$PRE_COMMIT_FILE"; then
            # Add standards check if not present
            cat >> "$PRE_COMMIT_FILE" << 'EOF'

# Execute standards check and capture exit code
echo "" | yarn standards --only-changed-files
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Frontend standards check failed. Please fix the errors before committing."
  exit 1
fi
EOF
            log_success "Added robust standards check to .husky/pre-commit"
        else
            log_info "Robust standards check already present in .husky/pre-commit"
        fi
    fi
}

# Create configuration file
create_config_file() {
    # Return to project directory
    cd "$ORIGINAL_DIR"

    if [ ! -f "checkFrontendStandards.config.mjs" ]; then
        log_info "Create checkFrontendStandards.config.mjs..."

            cat > checkFrontendStandards.config.mjs << 'EOF'
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
    // 🚫 DISABLE EXISTING RULES (CORRECT METHOD)
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

EOF

        log_success "Configuration file created: checkFrontendStandards.config.mjs"
    else
        log_info "Configuration file already exists"
    fi
}

# Copy complete guide
copy_guide() {
    # Return to project directory
    cd "$ORIGINAL_DIR"

    if [ ! -f "checkFrontendStandards.COMPLETE-GUIDE.md" ]; then
        log_info "Copying complete guide..."
        cp "$TEMP_DIR/checkFrontendStandards.COMPLETE-GUIDE.md" .
        log_success "Guide copied: checkFrontendStandards.COMPLETE-GUIDE.md"
    else
        log_info "Complete guide already exists"
    fi
}

# Add installed files to .gitignore automatically
add_to_gitignore() {
    cd "$ORIGINAL_DIR"
    GITIGNORE_FILE=".gitignore"
    # Create .gitignore if it doesn't exist
    if [ ! -f "$GITIGNORE_FILE" ]; then
        touch "$GITIGNORE_FILE"
    fi
    # List of paths to ignore
    IGNORE_LIST=(
        "logs-standards-validations/"
    )
    for ITEM in "${IGNORE_LIST[@]}"; do
        if ! grep -qxF "$ITEM" "$GITIGNORE_FILE"; then
            echo "$ITEM" >> "$GITIGNORE_FILE"
            log_success "Added to .gitignore: $ITEM"
        else
            log_info "$ITEM already in .gitignore"
        fi
    done
}

# Execute installation
log_info "Installation method based on project type..."
install_method

log_info "Creating configuration files..."
create_config_file
copy_guide

# Verify that everything has been installed correctly
log_info "Verifying installation..."
cd "$ORIGINAL_DIR"

# Verify scripts in package.json
if grep -q "standards" package.json; then
    log_success "Scripts added successfully to package.json"
else
    log_warning "Scripts not added to package.json. Verifying..."
    add_standards_script_and_hook
fi

# Verify configuration file
if [ -f "checkFrontendStandards.config.mjs" ]; then
    log_success "Configuration file created successfully: checkFrontendStandards.config.mjs"
else
    log_warning "Recreating configuration file..."
    create_config_file
fi

# Clean up
log_info "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

# Final message
echo ""
echo "🎉 Installation completed!"
echo "============================================================"
log_success "Frontend Standards Checker is ready to use"
echo ""
echo "📋 Available commands:"
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
    echo "   $PACKAGE_MANAGER standards          # Validation based on configuration"
    echo "   $PACKAGE_MANAGER standards:zones    # Validate specific zones"
    echo "   $PACKAGE_MANAGER standards:verbose  # Verbose mode"
    echo "   $PACKAGE_MANAGER standards:all      # Validate all files"
    echo "   $PACKAGE_MANAGER standards:init     # Copy configuration files"
else
    echo "   $PACKAGE_MANAGER run standards          # Validation based on configuration"
    echo "   $PACKAGE_MANAGER run standards:zones    # Validate specific zones"
    echo "   $PACKAGE_MANAGER run standards:verbose  # Verbose mode"
    echo "   $PACKAGE_MANAGER run standards:all      # Validate all files"
    echo "   $PACKAGE_MANAGER run standards:init     # Copy configuration files"
fi
echo ""
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
    echo "💡 If you have issues with Yarn (especially v4+), use npm:"
    echo "   $PACKAGE_MANAGER run standards          # Validation based on configuration"
    echo "   $PACKAGE_MANAGER run standards:zones    # Validate specific zones"
    echo "   $PACKAGE_MANAGER run standards:verbose  # Verbose mode"
    echo "   $PACKAGE_MANAGER run standards:all      # Validate all files"
    echo "   $PACKAGE_MANAGER run standards:init     # Copy configuration files"
fi
echo ""
echo "📁 Created files:"
echo "   ✅ checkFrontendStandards.config.mjs"
echo "   ✅ checkFrontendStandards.COMPLETE-GUIDE.md"
echo "   ✅ frontend-standards-full/ (full installation)"
echo "   ✅ .gitignore (updated with installed files)"
echo ""

# Execute function to add to .gitignore
add_to_gitignore

echo "🚀 To get started:"
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
    echo "   $PACKAGE_MANAGER standards         # Use file configuration (onlyChangedFiles)"
    echo "   npm run standards           # If there are issues with Yarn"
else
    echo "   $PACKAGE_MANAGER run standards     # Use file configuration (onlyChangedFiles)"
fi
echo ""
echo "💡 Configure behavior in: checkFrontendStandards.config.mjs"
echo "   onlyChangedFiles: true  → Only changed files"
echo "   onlyChangedFiles: false → All files"
echo "📖 Add custom rules in the 'rules' section"
echo ""
