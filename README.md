# API Mockup

A comprehensive VS Code extension for mocking REST APIs during development. Create, manage, and test API endpoints with a beautiful interface similar to Insomnia.

## Features

- 🎨 **Beautiful Dark UI** - Professional dark theme matching VS Code
- 🚀 **Mock Server** - Built-in HTTP server for API mocking
- 📝 **JSON Syntax Highlighting** - Color-coded JSON editing with toggle controls
- 🔧 **CRUD Operations** - Create, read, update, and delete mock endpoints
- 📊 **Request History** - Track all incoming requests with timestamps
- 📱 **Responsive Design** - Works on desktop and mobile/tablet layouts
- 🎛️ **Resizable Sidebar** - Adjustable sidebar with persistent width settings
- ⚡ **Real-time Updates** - Live server status and endpoint management

## Requirements

- VS Code 1.74.0 or higher
- Node.js (for the mock server)

## Quick Start

### Development & Testing

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd api-mockup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build and install the extension**
   ```bash
   ./release.sh
   ```

   This script will:
   - Compile TypeScript code
   - Package the extension
   - Install it locally in VS Code

### Manual Installation

If you prefer manual steps:

```bash
# Compile TypeScript
npm run compile

# Package extension (requires vsce)
vsce package --no-dependencies

# Install in VS Code
code --install-extension api-mockup-0.0.1.vsix
```

## Usage

1. **Open the Extension**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Search for "API Mockup" and select "Open API Mockup"

2. **Start the Mock Server**
   - Click "Start Server" in the sidebar
   - The server runs on port 3001 by default

3. **Create Mock Endpoints**
   - Fill in the method (GET, POST, PUT, DELETE, PATCH)
   - Enter the path (e.g., `/api/users`)
   - Set status code (e.g., 200)
   - Add JSON response body
   - Configure response headers
   - Click "Create Endpoint"

4. **Test Your Endpoints**
   - Use curl, Postman, or any HTTP client
   - Example: `curl http://localhost:3001/api/users`

## Release Script Options

The `release.sh` script supports several options:

```bash
./release.sh              # Full build and install
./release.sh --clean      # Clean previous builds and rebuild
./release.sh --skip-deps  # Skip dependency installation
./release.sh --install    # Install existing .vsix file only
./release.sh --test       # Check prerequisites only (no build)
./release.sh --help       # Show help information
```

## Development

### Project Structure

```
src/
├── extension.ts      # Main extension entry point
├── mockServer.ts     # HTTP server implementation
└── webviewPanel.ts   # UI and webview logic
```

### Building

```bash
npm run compile    # Compile TypeScript
npm run watch      # Watch mode for development
```

### Testing

```bash
npm test           # Run tests
npm run lint       # Run ESLint
```

## Extension Settings

This extension currently has no configurable settings.

## Known Issues

None at this time.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `./release.sh`
5. Submit a pull request

## Release Notes

### 0.0.1

- Initial release with full API mocking capabilities
- Beautiful dark UI with JSON syntax highlighting
- Built-in mock server with request history
- Responsive design for all screen sizes
- Resizable sidebar with persistent settings