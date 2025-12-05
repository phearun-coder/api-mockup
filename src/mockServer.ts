import * as http from 'http';
import * as vscode from 'vscode';

export interface MockRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  statusCode: number;
  responseBody: string;
  responseHeaders: { [key: string]: string };
}

export interface MockResponse {
  statusCode: number;
  body: string;
  headers: { [key: string]: string };
}

export class MockServer {
  private server: http.Server | null = null;
  private port: number = 3001;
  private requestsById: Map<string, MockRequest> = new Map();
  private requestsByKey: Map<string, MockRequest> = new Map();
  private requestHistory: Array<{ method: string; path: string; timestamp: string }> = [];

  constructor() {
    this.setupServer();
  }

  private setupServer() {
    this.server = http.createServer((req, res) => {
      const method = req.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
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
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Mock endpoint not found' }));
      }
    });
  }

  public start(): Promise<void> {
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

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Mock server stopped');
            resolve();
          }
        });
      }
    });
  }

  public addMockRequest(request: MockRequest) {
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

  public removeMockRequest(id: string) {
    const request = this.requestsById.get(id);
    if (request) {
      const key = `${request.method} ${request.path}`;
      this.requestsByKey.delete(key);
      this.requestsById.delete(id);
    }
  }

  public updateMockRequest(id: string, updatedRequest: MockRequest) {
    this.removeMockRequest(id);
    this.addMockRequest(updatedRequest);
  }

  public getMockRequests(): MockRequest[] {
    return Array.from(this.requestsById.values());
  }

  public getMockRequestById(id: string): MockRequest | undefined {
    return this.requestsById.get(id);
  }

  public getRequestHistory() {
    return this.requestHistory;
  }

  public clearRequestHistory() {
    this.requestHistory = [];
  }

  public getPort(): number {
    return this.port;
  }

  public isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }
}
