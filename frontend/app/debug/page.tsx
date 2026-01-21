'use client';

import { useState } from 'react';
import axios from 'axios';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');
  const [testEmail, setTestEmail] = useState('user@example.com');
  const [testEmailBody, setTestEmailBody] = useState('This is a test email. Please summarize it.');
  const [loading, setLoading] = useState(false);

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    };
    setLogs((prev) => [...prev, entry]);
    console.log(`[${type.toUpperCase()}]`, message, data || '');
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  const testConnection = async () => {
    setLoading(true);
    addLog('info', '🔍 Testing backend connection...');
    
    try {
      const healthUrl = apiUrl.replace('/api', '') + '/health';
      addLog('info', `Testing: ${healthUrl}`);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addLog('success', '✅ Backend is reachable!', data);
      } else {
        addLog('error', '❌ Backend returned error', { status: response.status, data });
      }
    } catch (error: any) {
      addLog('error', '❌ Cannot connect to backend', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  const getApiClient = () => {
    return axios.create({
      baseURL: apiUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
  };

  const testAuthUrl = async () => {
    setLoading(true);
    addLog('info', '🔍 Testing OAuth URL endpoint...');
    
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/auth/url');
      addLog('success', '✅ OAuth URL endpoint works!', response.data);
    } catch (error: any) {
      addLog('error', '❌ OAuth URL endpoint failed', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const testSummarize = async () => {
    setLoading(true);
    addLog('info', '🔍 Testing summarize endpoint...');
    
    try {
      const apiClient = getApiClient();
      const response = await apiClient.post('/ai/summarize', {
        emailBody: testEmailBody,
        userEmail: testEmail,
      });
      addLog('success', '✅ Summarize works!', response.data);
    } catch (error: any) {
      addLog('error', '❌ Summarize failed', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const testReply = async () => {
    setLoading(true);
    addLog('info', '🔍 Testing reply endpoint...');
    
    try {
      const apiClient = getApiClient();
      const response = await apiClient.post('/ai/reply', {
        emailBody: testEmailBody,
        tone: 'friendly',
        userEmail: testEmail,
      });
      addLog('success', '✅ Reply works!', response.data);
    } catch (error: any) {
      addLog('error', '❌ Reply failed', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const testFollowUp = async () => {
    setLoading(true);
    addLog('info', '🔍 Testing followup endpoint...');
    
    try {
      const apiClient = getApiClient();
      const response = await apiClient.post('/ai/followup', {
        emailBody: testEmailBody,
        userEmail: testEmail,
      });
      addLog('success', '✅ Followup works!', response.data);
    } catch (error: any) {
      addLog('error', '❌ Followup failed', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const testRewrite = async () => {
    setLoading(true);
    addLog('info', '🔍 Testing rewrite endpoint...');
    
    try {
      const apiClient = getApiClient();
      const response = await apiClient.post('/ai/rewrite', {
        text: testEmailBody,
        instruction: 'Make it more professional',
        userEmail: testEmail,
      });
      addLog('success', '✅ Rewrite works!', response.data);
    } catch (error: any) {
      addLog('error', '❌ Rewrite failed', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const testVerifyKey = async () => {
    setLoading(true);
    addLog('info', '🔍 Testing API key verification...');
    
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/ai/verify-key');
      addLog('success', '✅ API key verification works!', response.data);
    } catch (error: any) {
      addLog('error', '❌ API key verification failed', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    clearLogs();
    addLog('info', '🚀 Running all tests...');
    addLog('info', `API URL: ${apiUrl}`);
    
    await testConnection();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    await testAuthUrl();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    await testVerifyKey();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    await testSummarize();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    await testReply();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    await testFollowUp();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    await testRewrite();
    
    addLog('info', '✅ All tests completed!');
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 InboxPilot AI - Debug & Test Page</h1>
        
        {/* Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">API Base URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="http://localhost:5000/api"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Test User Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Test Email Body</label>
              <textarea
                value={testEmailBody}
                onChange={(e) => setTestEmailBody(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg h-24"
                placeholder="Enter test email content..."
              />
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tests</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Test Connection
            </button>
            <button
              onClick={testAuthUrl}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Test OAuth URL
            </button>
            <button
              onClick={testVerifyKey}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Test API Key
            </button>
            <button
              onClick={testSummarize}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Test Summarize
            </button>
            <button
              onClick={testReply}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Test Reply
            </button>
            <button
              onClick={testFollowUp}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Test Follow-up
            </button>
            <button
              onClick={testRewrite}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Test Rewrite
            </button>
            <button
              onClick={runAllTests}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              🚀 Run All Tests
            </button>
          </div>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Logs ({logs.length})</h2>
            <button
              onClick={() => {
                const logText = logs.map(l => 
                  `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}${l.data ? '\n' + JSON.stringify(l.data, null, 2) : ''}`
                ).join('\n\n');
                navigator.clipboard.writeText(logText);
                addLog('success', 'Logs copied to clipboard!');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              Copy All Logs
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No logs yet. Click a test button to start.</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getLogColor(log.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{log.message}</div>
                      {log.data && (
                        <pre className="mt-2 text-xs overflow-x-auto bg-white/50 p-2 rounded">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-xs opacity-70 ml-4">{log.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">📝 How to use:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Make sure your backend is running: <code className="bg-white px-2 py-1 rounded">cd backend && npm run dev</code></li>
            <li>Set the API URL (default: http://localhost:5000/api)</li>
            <li>Enter a test email address</li>
            <li>Enter some test email content</li>
            <li>Click "🚀 Run All Tests" or test individual endpoints</li>
            <li>Check the logs below to see what's working and what's not</li>
            <li>Copy logs and share them to debug issues</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
