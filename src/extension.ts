import * as vscode from 'vscode';
import { MockServer } from './mockServer';
import { MockupWebviewPanel } from './webviewPanel';

let mockServer: MockServer;

export function activate(context: vscode.ExtensionContext) {
  mockServer = new MockServer();

  let openMockupCommand = vscode.commands.registerCommand('api-mockup.openMockup', function () {
    MockupWebviewPanel.createOrShow(context.extensionUri, mockServer);
  });

  context.subscriptions.push(openMockupCommand);

  // Open mockup by default
  MockupWebviewPanel.createOrShow(context.extensionUri, mockServer);
}

export function deactivate() {
  // Stop mock server on deactivate
  if (mockServer) {
    mockServer.stop().catch(err => console.error('Error stopping mock server:', err));
  }
}