"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockupWebviewPanel = void 0;
const vscode = require("vscode");
class MockupWebviewPanel {
    static createOrShow(extensionUri, mockServer) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (MockupWebviewPanel.currentPanel) {
            MockupWebviewPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('apiMockup', 'API Mockup', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [extensionUri],
        });
        MockupWebviewPanel.currentPanel = new MockupWebviewPanel(panel, extensionUri, mockServer);
    }
    constructor(panel, extensionUri, mockServer) {
        this.mockRequests = new Map();
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.mockServer = mockServer;
        this._panel.onDidDispose(() => this.dispose(), null);
        this._panel.webview.onDidReceiveMessage((message) => this._handleMessage(message), null);
        this._update();
    }
    async _handleMessage(message) {
        switch (message.command) {
            case 'addRequest':
                this._addMockRequest(message.request);
                break;
            case 'updateRequest':
                this._updateMockRequest(message.id, message.request);
                break;
            case 'removeRequest':
                this._removeMockRequest(message.id);
                break;
            case 'startServer':
                await this._startServer();
                break;
            case 'stopServer':
                await this._stopServer();
                break;
            case 'getRequests':
                this._sendRequests();
                break;
            case 'getHistory':
                this._sendHistory();
                break;
            case 'editRequest':
                this._editMockRequest(message.id);
                break;
        }
    }
    _addMockRequest(request) {
        this.mockRequests.set(request.id, request);
        this.mockServer.addMockRequest(request);
        this._sendRequests();
        vscode.window.showInformationMessage(`Mock endpoint added: ${request.method} ${request.path}`);
    }
    _updateMockRequest(id, updatedRequest) {
        this.mockRequests.set(id, updatedRequest);
        this.mockServer.updateMockRequest(id, updatedRequest);
        this._sendRequests();
        vscode.window.showInformationMessage(`Mock endpoint updated: ${updatedRequest.method} ${updatedRequest.path}`);
    }
    _editMockRequest(id) {
        const request = this.mockRequests.get(id);
        if (request) {
            this._panel.webview.postMessage({ command: 'loadRequest', request });
        }
    }
    _removeMockRequest(id) {
        const request = this.mockRequests.get(id);
        if (request) {
            this.mockServer.removeMockRequest(id);
            this.mockRequests.delete(id);
            this._sendRequests();
            vscode.window.showInformationMessage('Mock endpoint removed');
        }
        else {
            vscode.window.showErrorMessage(`Failed to remove endpoint: Endpoint not found (ID: ${id})`);
        }
    }
    async _startServer() {
        try {
            await this.mockServer.start();
            this._panel.webview.postMessage({ command: 'serverStatus', status: 'running', port: this.mockServer.getPort() });
            vscode.window.showInformationMessage(`Mock server started on port ${this.mockServer.getPort()}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start mock server: ${error}`);
        }
    }
    async _stopServer() {
        try {
            await this.mockServer.stop();
            this._panel.webview.postMessage({ command: 'serverStatus', status: 'stopped' });
            vscode.window.showInformationMessage('Mock server stopped');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to stop mock server: ${error}`);
        }
    }
    _sendRequests() {
        const requests = this.mockServer.getMockRequests();
        // Sync the local map with server requests
        this.mockRequests.clear();
        requests.forEach(req => {
            this.mockRequests.set(req.id, req);
        });
        this._panel.webview.postMessage({ command: 'updateRequests', requests });
    }
    _sendHistory() {
        const history = this.mockServer.getRequestHistory();
        this._panel.webview.postMessage({ command: 'updateHistory', history });
    }
    _update() {
        this._panel.webview.html = this._getHtmlContent();
    }
    _getHtmlContent() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Mockup</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #1e1e1e;
            color: #e0e0e0;
            height: 100vh;
            display: flex;
            flex-direction: row;
        }

        .sidebar {
            width: 250px;
            background: #252526;
            border-right: 1px solid #3e3e42;
            overflow-y: auto;
            padding: 16px;
            transition: all 0.3s ease;
            flex-shrink: 0;
            position: relative;
            min-width: 150px;
            max-width: 500px;
        }

        .sidebar.hidden {
            width: 0;
            padding: 0;
            border-right: none;
            overflow: hidden;
        }

        .sidebar-resize-handle {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: transparent;
            cursor: col-resize;
            transition: background-color 0.2s;
            user-select: none;
        }

        .sidebar-resize-handle:hover {
            background: #007acc;
        }

        .sidebar-resize-handle.active {
            background: #007acc;
        }

        .toggle-sidebar-btn {
            position: relative;
            background: transparent;
            border: 1px solid #3e3e42;
            color: #858585;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            margin-right: 12px;
        }

        .toggle-sidebar-btn:hover {
            background: #3e3e42;
            color: #e0e0e0;
        }

        @media (max-width: 900px) {
            body {
                flex-direction: column;
            }

            .sidebar {
                width: 100%;
                border-right: none;
                border-bottom: 1px solid #3e3e42;
                padding: 12px;
                max-height: 200px;
            }

            .sidebar.hidden {
                width: 100%;
                max-height: 0;
                padding: 0;
                border-bottom: none;
                overflow: hidden;
            }
        }

        @media (max-width: 600px) {
            .sidebar {
                padding: 8px;
            }

            .sidebar.hidden {
                padding: 0;
            }

            .section-title {
                margin-top: 8px;
                margin-bottom: 4px;
            }

            .mock-endpoint {
                padding: 8px;
            }
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .header {
            background: #2d2d30;
            padding: 16px;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            position: relative;
            gap: 12px;
        }

        .server-status {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #1e1e1e;
            border-radius: 4px;
            font-size: 12px;
        }

        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #d32f2f;
        }

        .status-indicator.running {
            background: #4caf50;
        }

        .content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }

        .section-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #858585;
            margin-top: 16px;
            margin-bottom: 8px;
        }

        .mock-endpoint {
            background: #252526;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            justify-content: space-between;
            align-items: stretch;
            gap: 8px;
            min-width: 0;
        }

        .mock-endpoint:hover {
            background: #2d2d30;
            border-color: #007acc;
        }

        .endpoint-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .endpoint-header {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            flex-wrap: wrap;
        }

        .endpoint-method {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            width: 45px;
            text-align: center;
            flex-shrink: 0;
        }

        .method-get { background: #61affe; color: #000; }
        .method-post { background: #49cc90; color: #000; }
        .method-put { background: #fca130; color: #000; }
        .method-delete { background: #f93e3e; color: #fff; }
        .method-patch { background: #50e3c2; color: #000; }

        .endpoint-path {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            min-width: 0;
            flex: 1;
            word-break: break-word;
            overflow-wrap: break-word;
        }

        .endpoint-path-wrapper {
            display: flex;
            align-items: center;
            min-width: 0;
            flex: 1;
        }

        .endpoint-status {
            font-size: 11px;
            color: #858585;
            margin-top: 4px;
            white-space: nowrap;
        }

        .endpoint-actions {
            display: flex;
            gap: 4px;
            flex-shrink: 0;
            align-self: center;
        }

        .endpoint-actions button {
            padding: 4px 8px;
            font-size: 11px;
            min-width: auto;
            white-space: nowrap;
        }

        .endpoint-actions button.edit {
            background: #0e639c;
        }

        .endpoint-actions button.delete {
            background: #d32f2f;
        }

        @media (max-width: 600px) {
            .mock-endpoint {
                flex-direction: column;
                align-items: flex-start;
            }

            .endpoint-header {
                width: 100%;
            }

            .endpoint-actions {
                width: 100%;
                justify-content: flex-start;
            }

            .endpoint-actions button {
                flex: 1;
            }
        }

        button {
            background: #0e639c;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        button:hover {
            background: #1177bb;
        }

        button.secondary {
            background: #6c757d;
        }

        button.secondary:hover {
            background: #7d8a96;
        }

        button.danger {
            background: #f93e3e;
        }

        button.danger:hover {
            background: #ff5555;
        }

        .form-group {
            margin-bottom: 16px;
        }

        label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 4px;
            color: #cccccc;
        }

        input, select, textarea {
            width: 100%;
            padding: 8px;
            background: #3c3c3c;
            border: 1px solid #3e3e42;
            color: #e0e0e0;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }

        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #007acc;
            box-shadow: 0 0 0 1px #007acc;
        }

        textarea {
            resize: vertical;
            min-height: 100px;
        }

        @media (max-width: 600px) {
            input, select, textarea {
                font-size: 14px;
            }

            textarea {
                min-height: 80px;
            }
        }
        }

        .button-group {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .button-group .clear-btn {
            flex: none;
            width: auto;
            min-width: 60px;
        }

        .history-item {
            background: #252526;
            border-left: 3px solid #007acc;
            padding: 8px;
            margin-bottom: 4px;
            border-radius: 2px;
            font-size: 11px;
            font-family: 'Courier New', monospace;
            word-break: break-word;
            overflow-wrap: break-word;
        }

        .history-time {
            color: #858585;
            font-size: 10px;
            margin-top: 4px;
            white-space: nowrap;
        }

        .tab-buttons {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }

        .tab-button {
            padding: 6px 12px;
            background: transparent;
            border: 1px solid #3e3e42;
            color: #858585;
            cursor: pointer;
            border-radius: 4px 4px 0 0;
            font-size: 12px;
        }

        .tab-button.active {
            background: #252526;
            color: #e0e0e0;
            border-bottom-color: #252526;
        }

        .hidden {
            display: none;
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            align-items: center;
            justify-content: center;
        }

        .modal.show {
            display: flex;
        }

        .modal-content {
            background-color: #252526;
            padding: 24px;
            border: 1px solid #3e3e42;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            min-width: 300px;
        }

        .modal-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #e0e0e0;
        }

        .modal-message {
            font-size: 13px;
            color: #cccccc;
            margin-bottom: 20px;
            line-height: 1.5;
        }

        .modal-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }

        .modal-actions button {
            padding: 8px 16px;
            font-size: 12px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }

        .modal-actions button.confirm {
            background: #d32f2f;
            color: white;
        }

        .modal-actions button.confirm:hover {
            background: #f44336;
        }

        .modal-actions button.cancel {
            background: #6c757d;
            color: white;
        }

        .modal-actions button.cancel:hover {
            background: #7d8a96;
        }
    </style>
</head>
<body>
    <div id="confirmModal" class="modal">
        <div class="modal-content">
            <div class="modal-title">Confirm Deletion</div>
            <div class="modal-message">Are you sure you want to delete this endpoint? This action cannot be undone.</div>
            <div class="modal-actions">
                <button class="cancel" id="modalCancelBtn">Cancel</button>
                <button class="confirm" id="modalConfirmBtn">Delete</button>
            </div>
        </div>
    </div>

    <div class="sidebar" id="sidebar">
        <div class="sidebar-resize-handle" id="sidebarResizeHandle"></div>
        <h3 style="color: #cccccc; margin-bottom: 16px;">API Mockup</h3>
        
        <div class="server-status">
            <div class="status-indicator" id="statusIndicator"></div>
            <span id="statusText">Stopped</span>
        </div>

        <div class="button-group" style="margin-top: 16px;">
            <button id="startBtn" style="flex: 1;">Start Server</button>
            <button id="stopBtn" class="secondary" style="flex: 1;">Stop Server</button>
        </div>

        <div class="section-title" style="margin-top: 24px;">Endpoints</div>
        <div id="endpointsList"></div>

        <button style="width: 100%; margin-top: 16px;">+ Add Endpoint</button>
    </div>

    <div class="main-content">
        <div class="header">
            <button class="toggle-sidebar-btn" id="toggleSidebarBtn" title="Toggle sidebar">☰ Sidebar</button>
            <h2>API Mockup Dashboard</h2>
        </div>

        <div class="content">
            <div class="tab-buttons">
                <button class="tab-button active" data-tab="editor">Editor</button>
                <button class="tab-button" data-tab="history">Request History</button>
            </div>

            <div id="editorTab" class="tab-content">
                <h3 id="editorTitle" style="margin-bottom: 16px;">Create Mock Endpoint</h3>

                <div class="form-group">
                    <label>Method</label>
                    <select id="methodSelect">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Path</label>
                    <input type="text" id="pathInput" placeholder="/api/users">
                </div>

                <div class="form-group">
                    <label>Status Code</label>
                    <input type="number" id="statusCodeInput" value="200">
                </div>

                <div class="form-group">
                    <label>Response Body (JSON)</label>
                    <textarea id="responseBodyInput">{"message": "success"}</textarea>
                </div>

                <div class="form-group">
                    <label>Response Headers (JSON)</label>
                    <textarea id="responseHeadersInput">{"Content-Type": "application/json"}</textarea>
                </div>

                <div class="button-group">
                    <button id="createBtn" style="flex: 1;">Create Endpoint</button>
                    <button class="secondary" id="updateBtn" style="flex: 1; display: none;">Update Endpoint</button>
                    <button class="secondary clear-btn" id="clearBtn">Clear</button>
                </div>
            </div>

            <div id="historyTab" class="tab-content hidden">
                <h3 style="margin-bottom: 16px;">Request History</h3>
                <button class="danger" id="clearHistoryBtn" style="margin-bottom: 16px;">Clear History</button>
                <div id="historyList"></div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let serverRunning = false;
        let editingId = null;
        let pendingDeleteId = null;

        // Modal confirmation
        const confirmModal = document.getElementById('confirmModal');
        const modalConfirmBtn = document.getElementById('modalConfirmBtn');
        const modalCancelBtn = document.getElementById('modalCancelBtn');

        function showDeleteConfirmation(id) {
            pendingDeleteId = id;
            confirmModal.classList.add('show');
        }

        function hideDeleteConfirmation() {
            pendingDeleteId = null;
            confirmModal.classList.remove('show');
        }

        modalConfirmBtn.addEventListener('click', () => {
            if (pendingDeleteId) {
                vscode.postMessage({ command: 'removeRequest', id: pendingDeleteId });
                hideDeleteConfirmation();
            }
        });

        modalCancelBtn.addEventListener('click', hideDeleteConfirmation);

        // Close modal when clicking outside
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                hideDeleteConfirmation();
            }
        });

        // Sidebar resize functionality
        const sidebar = document.getElementById('sidebar');
        const resizeHandle = document.getElementById('sidebarResizeHandle');
        let isResizing = false;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeHandle.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const newWidth = e.clientX;
            if (newWidth >= 150 && newWidth <= 500) {
                sidebar.style.width = newWidth + 'px';
                localStorage.setItem('sidebarWidth', newWidth);
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizeHandle.classList.remove('active');
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        });

        // Restore sidebar width from localStorage
        const savedWidth = localStorage.getItem('sidebarWidth');
        if (savedWidth) {
            sidebar.style.width = savedWidth + 'px';
        }

        // Sidebar toggle functionality
        const toggleBtn = document.getElementById('toggleSidebarBtn');
        let sidebarVisible = true;

        toggleBtn.addEventListener('click', () => {
            sidebarVisible = !sidebarVisible;
            if (sidebarVisible) {
                sidebar.classList.remove('hidden');
                toggleBtn.textContent = '☰ Sidebar';
            } else {
                sidebar.classList.add('hidden');
                toggleBtn.textContent = '☰ Show';
            }
        });

        // Tab switching
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
                this.classList.add('active');
                document.getElementById(this.dataset.tab + 'Tab').classList.remove('hidden');
                
                if (this.dataset.tab === 'history') {
                    vscode.postMessage({ command: 'getHistory' });
                }
            });
        });

        // Server controls
        document.getElementById('startBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'startServer' });
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'stopServer' });
        });

        // Create endpoint
        document.getElementById('createBtn').addEventListener('click', () => {
            const request = {
                id: Date.now().toString(),
                method: document.getElementById('methodSelect').value,
                path: document.getElementById('pathInput').value,
                statusCode: parseInt(document.getElementById('statusCodeInput').value),
                responseBody: document.getElementById('responseBodyInput').value,
                responseHeaders: JSON.parse(document.getElementById('responseHeadersInput').value || '{}'),
            };

            vscode.postMessage({ command: 'addRequest', request });
            document.getElementById('clearBtn').click();
        });

        // Update endpoint
        document.getElementById('updateBtn').addEventListener('click', () => {
            const request = {
                id: editingId,
                method: document.getElementById('methodSelect').value,
                path: document.getElementById('pathInput').value,
                statusCode: parseInt(document.getElementById('statusCodeInput').value),
                responseBody: document.getElementById('responseBodyInput').value,
                responseHeaders: JSON.parse(document.getElementById('responseHeadersInput').value || '{}'),
            };

            vscode.postMessage({ command: 'updateRequest', id: editingId, request });
            document.getElementById('clearBtn').click();
            editingId = null;
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            document.getElementById('methodSelect').value = 'GET';
            document.getElementById('pathInput').value = '';
            document.getElementById('statusCodeInput').value = '200';
            document.getElementById('responseBodyInput').value = '{"message": "success"}';
            document.getElementById('responseHeadersInput').value = '{"Content-Type": "application/json"}';
            document.getElementById('editorTitle').textContent = 'Create Mock Endpoint';
            document.getElementById('createBtn').style.display = 'block';
            document.getElementById('updateBtn').style.display = 'none';
            editingId = null;
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'clearHistory' });
        });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;

            if (message.command === 'serverStatus') {
                serverRunning = message.status === 'running';
                const indicator = document.getElementById('statusIndicator');
                const text = document.getElementById('statusText');
                
                if (serverRunning) {
                    indicator.classList.add('running');
                    text.textContent = \`Running (port \${message.port})\`;
                } else {
                    indicator.classList.remove('running');
                    text.textContent = 'Stopped';
                }
            }

            if (message.command === 'updateRequests') {
                const list = document.getElementById('endpointsList');
                list.innerHTML = '';
                message.requests.forEach(req => {
                    const item = document.createElement('div');
                    item.className = 'mock-endpoint';
                    item.innerHTML = \`
                        <div class="endpoint-info">
                            <div class="endpoint-header">
                                <span class="endpoint-method method-\${req.method.toLowerCase()}">\${req.method}</span>
                                <span class="endpoint-path" title="\${req.path}">\${req.path}</span>
                            </div>
                            <div class="endpoint-status">
                                Status: \${req.statusCode}
                            </div>
                        </div>
                        <div class="endpoint-actions">
                            <button class="edit" data-id="\${req.id}" title="Edit endpoint">✎ Edit</button>
                            <button class="delete" data-id="\${req.id}" title="Delete endpoint">✕ Delete</button>
                        </div>
                    \`;
                    list.appendChild(item);

                    // Add event listeners for edit and delete buttons
                    item.querySelector('.edit').addEventListener('click', (e) => {
                        e.stopPropagation();
                        vscode.postMessage({ command: 'editRequest', id: req.id });
                    });

                    item.querySelector('.delete').addEventListener('click', (e) => {
                        e.stopPropagation();
                        showDeleteConfirmation(req.id);
                    });
                });
            }

            if (message.command === 'updateHistory') {
                const list = document.getElementById('historyList');
                if (message.history.length === 0) {
                    list.innerHTML = '<p style="color: #858585;">No requests yet</p>';
                } else {
                    list.innerHTML = message.history.map(h => \`
                        <div class="history-item">
                            <strong class="endpoint-method method-\${h.method.toLowerCase()}">\${h.method}</strong> \${h.path}
                            <div class="history-time">\${h.timestamp}</div>
                        </div>
                    \`).join('');
                }
            }

            if (message.command === 'loadRequest') {
                const req = message.request;
                document.getElementById('methodSelect').value = req.method;
                document.getElementById('pathInput').value = req.path;
                document.getElementById('statusCodeInput').value = req.statusCode;
                document.getElementById('responseBodyInput').value = req.responseBody;
                document.getElementById('responseHeadersInput').value = JSON.stringify(req.responseHeaders, null, 2);
                
                editingId = req.id;
                document.getElementById('editorTitle').textContent = 'Edit Mock Endpoint';
                document.getElementById('createBtn').style.display = 'none';
                document.getElementById('updateBtn').style.display = 'block';

                // Switch to editor tab
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
                document.querySelector('[data-tab="editor"]').classList.add('active');
                document.getElementById('editorTab').classList.remove('hidden');
            }
        });

        // Initial request
        vscode.postMessage({ command: 'getRequests' });
    </script>
</body>
</html>`;
    }
    dispose() {
        MockupWebviewPanel.currentPanel = undefined;
        this._panel.dispose();
    }
}
exports.MockupWebviewPanel = MockupWebviewPanel;
//# sourceMappingURL=webviewPanel.js.map