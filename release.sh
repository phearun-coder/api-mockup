#!/bin/bash

# API Mockup Extension Release Script
# This script builds, packages, and installs the VS Code extension for testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi

    # Check if vsce is installed
    if ! command_exists vsce; then
        print_warning "vsce (VS Code Extension Manager) is not installed."
        print_status "Installing vsce globally..."
        npm install -g @vscode/vsce
    fi

    # Check if code command is available
    if ! command_exists code; then
        print_warning "VS Code 'code' command is not available in PATH."
        print_status "Make sure VS Code is installed and 'code' command is available."
        print_status "You can install it from: https://code.visualstudio.com/docs/setup/setup-overview"
        echo ""
        print_status "If VS Code is installed, you can add 'code' to PATH by:"
        print_status "  - Opening VS Code"
        print_status "  - Pressing Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)"
        print_status "  - Typing 'Shell Command: Install 'code' command in PATH'"
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    print_success "Prerequisites check completed."
}

# Clean previous builds
clean_build() {
    print_status "Cleaning previous builds..."
    rm -rf out/
    rm -f *.vsix
    print_success "Clean completed."
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed."
}

# Compile TypeScript
compile_typescript() {
    print_status "Compiling TypeScript..."
    npm run compile
    print_success "TypeScript compilation completed."
}

# Package the extension
package_extension() {
    print_status "Packaging extension..."
    vsce package --no-dependencies
    print_success "Extension packaged."
}

# Install extension locally
install_extension() {
    print_status "Installing extension locally..."

    # Find the generated .vsix file
    VSIX_FILE=$(ls -t *.vsix | head -1)

    if [ -z "$VSIX_FILE" ]; then
        print_error "No .vsix file found. Packaging may have failed."
        exit 1
    fi

    print_status "Found extension file: $VSIX_FILE"

    if command_exists code; then
        code --install-extension "$VSIX_FILE"
        print_success "Extension installed successfully!"
        print_status "You can now test the extension in VS Code."
        print_status "Use Command Palette (Cmd+Shift+P) and search for 'API Mockup' to open it."
    else
        print_warning "VS Code 'code' command not found."
        print_status "To install manually:"
        print_status "1. Open VS Code"
        print_status "2. Go to Extensions (Ctrl+Shift+X)"
        print_status "3. Click the '...' menu and select 'Install from VSIX...'"
        print_status "4. Select the file: $VSIX_FILE"
    fi
}

# Show usage information
show_usage() {
    echo "API Mockup Extension Release Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -c, --clean     Clean previous builds before building"
    echo "  -s, --skip-deps Skip dependency installation"
    echo "  -i, --install   Only install existing .vsix file (skip build)"
    echo "  -t, --test      Test mode: check prerequisites only"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Full build and install"
    echo "  $0 --clean      # Clean and full rebuild"
    echo "  $0 --test       # Check prerequisites only"
    echo "  $0 --install    # Install existing package"
}

# Main script logic
main() {
    local clean_build=false
    local skip_deps=false
    local install_only=false
    local test_mode=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--clean)
                clean_build=true
                shift
                ;;
            -s|--skip-deps)
                skip_deps=true
                shift
                ;;
            -i|--install)
                install_only=true
                shift
                ;;
            -t|--test)
                test_mode=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    echo "🚀 API Mockup Extension Release Script"
    echo "======================================"

    # Check prerequisites
    check_prerequisites

    if [ "$test_mode" = true ]; then
        print_success "✅ Test mode: All prerequisites are satisfied!"
        print_status "You can run './release.sh' to build and install the extension."
        exit 0
    fi

    if [ "$install_only" = true ]; then
        install_extension
        exit 0
    fi

    # Clean if requested
    if [ "$clean_build" = true ]; then
        clean_build
    fi

    # Install dependencies unless skipped
    if [ "$skip_deps" = false ]; then
        install_dependencies
    fi

    # Build and package
    compile_typescript
    package_extension
    install_extension

    echo ""
    print_success "🎉 Release process completed successfully!"
    print_status "Your API Mockup extension is now installed and ready for testing."
}

# Run main function with all arguments
main "$@"