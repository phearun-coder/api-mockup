"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockServer = void 0;
const http = require("http");
class MockServer {
    constructor() {
        this.server = null;
        this.port = 3001;
        this.requestsById = new Map();
        this.requestsByKey = new Map();
        this.requestHistory = [];
        this.setupServer();
    }
    setupServer() {
        this.server = http.createServer((req, res) => {
            const method = req.method;
            const path = req.url || '/';
            // Log request
            this.requestHistory.push({
                method,
                path,
                timestamp: new Date().toLocaleTimeString(),
            });
            // Find matching mock request
            const key = `${method} ${path}`;
            const mockRequest = this.requestsByKey.get(key);
            if (mockRequest) {
                res.writeHead(mockRequest.statusCode, {
                    'Content-Type': 'application/json',
                    ...mockRequest.responseHeaders,
                });
                res.end(mockRequest.responseBody);
            }
            else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Mock endpoint not found' }));
            }
        });
    }
    start() {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.listen(this.port, () => {
                    console.log(`Mock server running on http://localhost:${this.port}`);
                    resolve();
                });
                this.server.on('error', reject);
            }
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        console.log('Mock server stopped');
                        resolve();
                    }
                });
            }
        });
    }
    addMockRequest(request) {
        // Remove old key if exists
        const oldRequest = this.requestsById.get(request.id);
        if (oldRequest) {
            const oldKey = `${oldRequest.method} ${oldRequest.path}`;
            this.requestsByKey.delete(oldKey);
        }
        // Add new request
        const key = `${request.method} ${request.path}`;
        this.requestsById.set(request.id, request);
        this.requestsByKey.set(key, request);
    }
    removeMockRequest(id) {
        const request = this.requestsById.get(id);
        if (request) {
            const key = `${request.method} ${request.path}`;
            this.requestsByKey.delete(key);
            this.requestsById.delete(id);
        }
    }
    updateMockRequest(id, updatedRequest) {
        this.removeMockRequest(id);
        this.addMockRequest(updatedRequest);
    }
    getMockRequests() {
        return Array.from(this.requestsById.values());
    }
    getMockRequestById(id) {
        return this.requestsById.get(id);
    }
    getRequestHistory() {
        return this.requestHistory;
    }
    clearRequestHistory() {
        this.requestHistory = [];
    }
    getPort() {
        return this.port;
    }
    isRunning() {
        return this.server !== null && this.server.listening;
    }
}
exports.MockServer = MockServer;
//# sourceMappingURL=mockServer.js.map