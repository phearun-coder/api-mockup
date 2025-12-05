import * as vscode from 'vscode';
import { MockServer, MockRequest } from './mockServer';
import { getWebviewContent } from './webviewContent';

export class MockupWebviewPanel {
  public static currentPanel: MockupWebviewPanel | undefined;
  private static readonly viewType = 'apiMockup';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _server: MockServer;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, server: MockServer) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._server = server;

    // Set the webview's initial html content
    this._update();

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'startServer':
          try {
            await this._server.start();
          } catch (e) {
            console.error('Error starting server', e);
          }
          this._postServerStatus();
          this._postRequests();
          break;
        case 'stopServer':
          try {
            await this._server.stop();
          } catch (e) {
            console.error('Error stopping server', e);
          }
          this._postServerStatus();
          break;
        case 'addRequest':
          this._server.addMockRequest(message.request as MockRequest);
          this._postRequests();
          break;
        case 'updateRequest':
          this._server.updateMockRequest(message.id, message.request as MockRequest);
          this._postRequests();
          break;
        case 'removeRequest':
          this._server.removeMockRequest(message.id);
          this._postRequests();
          break;
        case 'editRequest': {
          const req = this._server.getMockRequestById(message.id);
          this._panel.webview.postMessage({ command: 'loadRequest', request: req });
          break;
        }
        case 'getHistory':
          this._postHistory();
          break;
        case 'clearHistory':
          this._server.clearRequestHistory();
          this._postHistory();
          break;
      }
    });

    this._panel.onDidDispose(() => this.dispose(), null, []);
  }

  public static createOrShow(extensionUri: vscode.Uri, server: MockServer) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (MockupWebviewPanel.currentPanel) {
      MockupWebviewPanel.currentPanel._panel.reveal(column);
      MockupWebviewPanel.currentPanel._postServerStatus();
      MockupWebviewPanel.currentPanel._postRequests();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      MockupWebviewPanel.viewType,
      'API Mockup',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
      }
    );

    MockupWebviewPanel.currentPanel = new MockupWebviewPanel(panel, extensionUri, server);

    // Send initial data
    MockupWebviewPanel.currentPanel._postServerStatus();
    MockupWebviewPanel.currentPanel._postRequests();
    MockupWebviewPanel.currentPanel._postHistory();
  }

  private _update() {
    this._panel.webview.html = getWebviewContent(this._extensionUri);
  }

  private _postServerStatus() {
    this._panel.webview.postMessage({
      command: 'serverStatus',
      status: this._server.isRunning() ? 'running' : 'stopped',
      port: this._server.getPort(),
    });
  }

  private _postRequests() {
    const requests = this._server.getMockRequests();
    this._panel.webview.postMessage({ command: 'updateRequests', requests });
  }

  private _postHistory() {
    const history = this._server.getRequestHistory();
    this._panel.webview.postMessage({ command: 'updateHistory', history });
  }

  public dispose() {
    MockupWebviewPanel.currentPanel = undefined;
    this._panel.dispose();
  }
}
