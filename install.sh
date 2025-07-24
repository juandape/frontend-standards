#!/bin/bash

# Frontend Standards Checker - Automatic Installation Script
# Version 4.9.1

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

# Instalación con copia local (funciona en todos los casos)
install_local_copy() {
    log_info "Using direct copy method..."

    # Volver al directorio original
    cd "$ORIGINAL_DIR"

    if [ -d "frontend-standards-full" ]; then
        log_warning "Directory frontend-standards-full already exists. Updating..."
        rm -rf frontend-standards-full
    fi

    cp -r "$TEMP_DIR" frontend-standards-full
    log_success "Frontend Standards copied to ./frontend-standards-full/"

    # Instalar dependencias en el directorio copiado si es necesario
    log_info "Configuring local installation..."
    cd frontend-standards-full

    # Solo instalar dependencias si no existen dist o archivos compilados
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
        echo "#!/bin/sh" > "$PRE_COMMIT_FILE"
        echo "yarn standards" >> "$PRE_COMMIT_FILE"
        chmod +x "$PRE_COMMIT_FILE"
        log_success "Created .husky/pre-commit and added 'yarn standards'"
    else
        if ! grep -q "yarn standards" "$PRE_COMMIT_FILE"; then
            echo "yarn standards" >> "$PRE_COMMIT_FILE"
            log_success "Added 'yarn standards' to .husky/pre-commit"
        else
            log_info "'yarn standards' already present in .husky/pre-commit"
        fi
    fi
}

# Crear archivo de configuración
create_config_file() {
    # Volver al directorio del proyecto
    cd "$ORIGINAL_DIR"

    if [ ! -f "checkFrontendStandards.config.js" ]; then
        log_info "Create checkFrontendStandards.config.js..."

        if [ "$IS_REACT_NATIVE" = true ]; then
            # Configuración optimizada para React Native
            cat > checkFrontendStandards.config.js << 'EOF'
// Frontend Standards Config - React Native
/**
 * @fileoverview Configuration file for checkFrontendStandards.mjs
 *
 * This file allows you to customize rules and zones for the frontend standards validation script.
 * Multiple configuration patterns are supported for maximum flexibility:
 *
 * **Object Configuration:**
 * - `merge`: Boolean to control if custom rules merge with defaults
 * - `onlyChangedFiles`: 🆕 Boolean to only check files staged for commit (default: true)
 * - `zones`: Object to configure which directories to validate
 *   - `includePackages`: Include packages/ directory in monorepos
 *   - `customZones`: Array of additional directories to validate
 *   - `onlyZone`: String to validate only one specific zone (ignores all others)
 * - `rules`: Array of custom validation rules
 *
 * **Function Configuration:**
 * - Export a function that receives default rules and returns modified rules
 * - Allows dynamic rule generation and conditional logic
 *
 * **Array Configuration:**
 * - Export array of rules directly (automatically merges with defaults)
 * - Simplest approach for adding a few custom rules
 * @author Juan David Peña
 * @version 4.10.0
 * @since 2024-01-15
    * @license MIT
 * @see {@link ./checkFrontendStandards.types.js} Type definitions
 */
module.exports = {
  zones: {
    includePackages: false,
    customZones: ['src'] // Solo validar directorio src
  },
  extensions: ['.js', '.ts', '.jsx', '.tsx'],
  ignorePatterns: [
    'android/**',
    'ios/**',
    'build/**',
    'dist/**',
    'node_modules/**',
    '*.config.js',
    '__tests__/**',
    '*.test.*',
    '*.spec.*',
    'frontend-standards-full/**'
  ],
  onlyChangedFiles: true, // true: only changed files | false: all files
  rules: [
    // Example: Basic custom rule
    // You can add, modify or remove these rules according to your needs
   // {
    //  name: 'No console.log in production',
    //  check: (content, filePath) => {
    //    // Allow console.log in development/debug files
    //    if (filePath.includes('debug') || filePath.includes('dev') || filePath.includes('__tests__')) {
    //      return false;
    //    }
    //    return content.includes('console.log');
    //  },
    //  message: 'Remove console.log statements before committing to production.',
    //  level: 'WARNING'
   // }
    // Add more personalized rules here according to your project needs
    // Example:
    // {
    //   name: 'Require file header comments',
    //   check: (content) => !content.startsWith('//') && !content.startsWith('/*'),
    //   message: 'Files should start with a comment describing their purpose.',
    //   level: 'INFO'
    // }
  ]
};
EOF
        else
            # Configuración estándar
            cat > checkFrontendStandards.config.js << 'EOF'
// Frontend Standards Config
/**
 * @fileoverview Configuration file for checkFrontendStandards.mjs
 *
 * This file allows you to customize rules and zones for the frontend standards validation script.
 * Multiple configuration patterns are supported for maximum flexibility:
 *
 * **Object Configuration:**
 * - `merge`: Boolean to control if custom rules merge with defaults
 * - `onlyChangedFiles`: 🆕 Boolean to only check files staged for commit (default: true)
 * - `zones`: Object to configure which directories to validate
 *   - `includePackages`: Include packages/ directory in monorepos
 *   - `customZones`: Array of additional directories to validate
 *   - `onlyZone`: String to validate only one specific zone (ignores all others)
 * - `rules`: Array of custom validation rules
 *
 * **Function Configuration:**
 * - Export a function that receives default rules and returns modified rules
 * - Allows dynamic rule generation and conditional logic
 *
 * **Array Configuration:**
 * - Export array of rules directly (automatically merges with defaults)
 * - Simplest approach for adding a few custom rules
 *
 * @author Juan David Peña
 * @version 4.10.0
 * @since 2024-01-15
    * @license MIT
 * @see {@link ./checkFrontendStandards.types.js} Type definitions
 *
 * @example
 * ```js
 * // Basic configuration with custom rules
 * export default {
 *   merge: true,
 *   zones: { includePackages: false, customZones: ['shared'] },
 *   rules: [{ name: 'Custom rule', check: (content) => false, message: 'Custom' }]
 * }
 * ```
 *
 * @example
 * ```js
 * // 🆕 Only validate specific zone (auth example)
 * export default {
 *   zones: { onlyZone: 'auth' },
 *   rules: [{ name: 'Auth security', check: (content) => false, message: 'Secure auth' }]
 * }
 * ```
 *
 * @example
 * ```js
 * // Function-based configuration for dynamic rules
 * export default function(defaultRules) {
 *   return [...defaultRules, { name: 'Dynamic', check: () => false, message: 'Dynamic rule' }]
 * }
 * ```
 *
 * @example
 * ```js
 * // Array export (merges with defaults)
 * export default [
 *   { name: 'Array rule', check: (content) => false, message: 'From array' }
 * ]
 * ```
 */

/**
 * Default configuration object for frontend standards validation.
 *
 * @type {{
 *   merge: boolean,
 *   zones: import('./checkFrontendStandards.types.js').ZoneConfig,
 *   rules: import('./checkFrontendStandards.types.js').ValidationRule[]
 * }}
 */
export default {
  // Merge custom rules with default rules (default: true)
  merge: true,

  // By default, only checks files staged for commit
  // If set to false, all files in the project will be checked
  // If no zones or onlyZone are specified, only modified files will be checked
  onlyChangedFiles: true, // Default: true = only changed files, false = all files

  // Zone configuration
  zones: {
    // Whether to include 'packages' directory in validation (default: false)
    includePackages: false,

    // 🎯 NEW OPTION: Review only one specific zone
    // If specified, it will ignore all other zones and only process this one
    // onlyZone: 'auth', // Example: 'auth', 'src', 'components', 'pages', etc.
    // onlyZone: 'src/auth',     // For zone within src
    // onlyZone: 'app/(auth)',   // For Next.js App Router
    // onlyZone: 'packages/ui',  // For monorepos

    // Custom zones to include in validation (ignored if onlyZone is set)
    // If customZones are specified, all files in those zones will be checked
    // ignoring the onlyChangedFiles option
    customZones: [
      // 'custom-folder',
      // 'another-folder'
    ],
  },

  // Custom rules to add or override
  rules: [
    // Example: Add a custom rule
    // {
    //   name: 'No TODO comments',
    //   check: (content) => content.includes('TODO'),
    //   message: 'TODO comments should be resolved before committing.',
    // },
    // Example: Disable a specific pattern
    // {
    //   name: 'Allow console.warn',
    //   check: (content) => false, // Never triggers
    //   message: 'This rule is disabled.',
    // },
    // Disable the console.log rule
    // {
    //   name: 'No console.log',
    //   check: () => false, // Never triggers
    //   message: 'Rule disabled',
    // },
    // Disable the English-only comments rule
    // {
    //   name: 'English-only comments',
    //   check: () => false,
    //   message: 'Rule disabled',
    // },
  ],
};

// Alternative configurations:

// 1. Export only custom rules (replaces all default rules)
// export default {
//   merge: false,
//   rules: [
//     {
//       name: 'Custom rule only',
//       check: (content) => content.includes('bad-pattern'),
//       message: 'This is a custom validation.',
//     },
//   ],
// }

// 2. Export a function that receives default rules
// export default function(defaultRules) {
//   return [
//     ...defaultRules,
//     {
//       name: 'Dynamic custom rule',
//       check: (content) => content.includes('dynamic-pattern'),
//       message: 'This rule was added dynamically.',
//     },
//   ]
// }

// 3. Export array of rules directly (merges with defaults)
// export default [
//   {
//     name: 'Array-based rule',
//     check: (content) => content.includes('array-pattern'),
//     message: 'This rule comes from an array export.',
//   },
// ]

// 4. Example with packages enabled
// export default {
//   zones: {
//     includePackages: true, // This will include packages/ in validation
//     customZones: ['shared', 'tools'], // Additional folders to validate
//   },
//   rules: [
//     // Custom rules here
//   ],
// }

// 5. 🎯 NEW: Example with onlyZone - review only one specific zone
// export default {
//   zones: {
//     onlyZone: 'auth', // Only review the authentication zone
// onlyZone: 'src/components', // Only components
// onlyZone: 'pages', // Only pages
// onlyZone: 'app/(dashboard)', // Next.js App Router
// onlyZone: 'packages/ui/src', // Specific monorepo
//   },
//   rules: [
// Specific rules for the zone
//   ],
// }

// 6. 🔍 NEW: Validate all zones and files (not just those in the commit)
// export default {
//   // Change to false to validate ALL files (default is true)
//   onlyChangedFiles: false,
//
//   // Optionally, configure specific zones
//   zones: {
//     includePackages: true, // Include packages/ folder in monorepos
//     customZones: ['src', 'app', 'components'] // Additional zones
//   }
// }

EOF
        fi

        log_success "Configuration file created: checkFrontendStandards.config.js"
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


# Ejecutar instalación
log_info "Installation method based on project type..."
install_method

log_info "Creating configuration files..."
create_config_file
copy_guide

# Verificar que todo se haya instalado correctamente
log_info "Verifying installation..."
cd "$ORIGINAL_DIR"

# Verificar scripts en package.json
if grep -q "standards" package.json; then
    log_success "Scripts added successfully to package.json"
else
    log_warning "Scripts not added to package.json. Verifying..."
    add_standards_script_and_hook
fi

# Verificar archivo de configuración
if [ -f "checkFrontendStandards.config.js" ]; then
    log_success "Configuration file created successfully"
else
    log_warning "Recreating configuration file..."
    create_config_file
fi

# Limpiar
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
echo "   ✅ checkFrontendStandards.config.js"
echo "   ✅ checkFrontendStandards.COMPLETE-GUIDE.md"
echo "   ✅ frontend-standards-full/ (full installation)"
echo "   ✅ .gitignore (updated with installed files)"
echo ""

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
        "frontend-standards-full/"
        "checkFrontendStandards.COMPLETE-GUIDE.md"
        "checkFrontendStandards.config.js"
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
echo "💡 Configure behavior in: checkFrontendStandards.config.js"
echo "   onlyChangedFiles: true  → Only changed files"
echo "   onlyChangedFiles: false → All files"
echo "📖 Add custom rules in the 'rules' section"
echo ""
