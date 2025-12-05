"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const mockServer_1 = require("./mockServer");
const webviewPanel_1 = require("./webviewPanel");
let mockServer;
function activate(context) {
    mockServer = new mockServer_1.MockServer();
    let openMockupCommand = vscode.commands.registerCommand('api-mockup.openMockup', function () {
        webviewPanel_1.MockupWebviewPanel.createOrShow(context.extensionUri, mockServer);
    });
    context.subscriptions.push(openMockupCommand);
    // Open mockup by default
    webviewPanel_1.MockupWebviewPanel.createOrShow(context.extensionUri, mockServer);
}
exports.activate = activate;
function deactivate() {
    // Stop mock server on deactivate
    if (mockServer) {
        mockServer.stop().catch(err => console.error('Error stopping mock server:', err));
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map