import React, { useState, useEffect } from 'react';
import { getConfig } from '../config';
import './Popup.css';
import ReactDOM from 'react-dom/client';
import Options from './Options';

const Popup: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [modelName, setModelName] = useState<string>('');
  const [autoCheckEnabled, setAutoCheckEnabled] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check connection to Ollama when the popup opens
    getConfig().then(config => {
      setModelName(config.ollamaModel);
      setAutoCheckEnabled(config.autoCheckEnabled);
      
      chrome.runtime.sendMessage(
        { action: 'checkOllamaStatus', host: config.ollamaBaseUrl },
        (response) => {
          if (response && response.success) {
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('disconnected');
            setError('Could not connect to Ollama server');
          }
        }
      );
    });

    // Inline settings panel logic
    const handler = () => {
      const rootDiv = document.getElementById('purgify-inline-settings-root');
      if (rootDiv) {
        // Clear previous content
        rootDiv.innerHTML = '';
        const root = ReactDOM.createRoot(rootDiv);
        root.render(
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 24px #0003',
            padding: 28,
            marginTop: 18,
            position: 'fixed',
            top: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            minWidth: 340,
            maxWidth: 480,
            width: '90%',
            border: '1px solid #e5e5e5',
            animation: 'fadeIn 0.2s',
          }}>
            <button
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: '#eee',
                border: 'none',
                borderRadius: 6,
                padding: '4px 12px',
                cursor: 'pointer',
                fontSize: 18,
                fontWeight: 700,
                color: '#888',
                boxShadow: '0 1px 4px #0001',
                transition: 'background 0.2s',
              }}
              onClick={() => { root.unmount(); }}
              aria-label="Close settings"
            >✕</button>
            <Options />
          </div>
        );
      }
    };
    document.addEventListener('purgify:open-settings', handler);
    return () => document.removeEventListener('purgify:open-settings', handler);
  }, []);

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const toggleAutoCheck = async () => {
    const newValue = !autoCheckEnabled;
    setAutoCheckEnabled(newValue);
    
    const config = await getConfig();
    config.autoCheckEnabled = newValue;
    
    chrome.storage.sync.set({ purgifyConfig: config });
  };

  const handleAction = (mode: 'fix' | 'rephrase') => {
    if (!inputText.trim()) {
      setActionError('Please paste some text to process.');
      return;
    }
    setIsLoading(true);
    setActionError(null);
    setOutputText('');
    chrome.runtime.sendMessage(
      { action: mode === 'fix' ? 'fixGrammar' : 'rephrase', text: inputText },
      (response) => {
        setIsLoading(false);
        if (response && response.success) {
          setOutputText(response.result.trim());
        } else {
          setActionError(response?.error || 'An error occurred.');
        }
      }
    );
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="purgify-popup">
      <div className="popup-header">
        <h1>Purgify</h1>
        <p className="tagline">Grammar fixing & rephrasing with Ollama</p>
      </div>

      {/* --- BEGIN: Manual Workflow UI --- */}
      <div style={{ marginBottom: 20 }}>
        <textarea
          style={{ width: '100%', height: 80, marginBottom: 8, resize: 'none' }}
          placeholder="Paste your text here..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          disabled={isLoading}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            style={{ flex: 1, padding: 6, cursor: 'pointer' }}
            onClick={() => handleAction('fix')}
            disabled={isLoading}
          >
            ✅ Fix Grammar
          </button>
          <button
            style={{ flex: 1, padding: 6, cursor: 'pointer' }}
            onClick={() => handleAction('rephrase')}
            disabled={isLoading}
          >
            🔁 Rephrase
          </button>
        </div>
        <textarea
          style={{ width: '100%', height: 80, marginBottom: 8, resize: 'none' }}
          placeholder="Result will appear here..."
          value={outputText}
          readOnly
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            style={{ padding: '4px 12px', borderRadius: 4, background: '#4a90e2', color: '#fff', border: 'none', cursor: outputText ? 'pointer' : 'not-allowed', opacity: outputText ? 1 : 0.5 }}
            onClick={handleCopy}
            disabled={!outputText}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {isLoading && <span style={{ color: '#4a90e2' }}>Processing...</span>}
          {actionError && <span style={{ color: '#f56c6c', fontSize: 13 }}>{actionError}</span>}
        </div>
      </div>
      {/* --- END: Manual Workflow UI --- */}

      <div className="popup-content">
        <div className="status-section">
          <h2>Connection Status</h2>
          <div className="status-display">
            {connectionStatus === 'checking' && (
              <p>Checking connection to Ollama...</p>
            )}
            
            {connectionStatus === 'connected' && (
              <p className="status-ok">✅ Connected to Ollama</p>
            )}
            
            {connectionStatus === 'disconnected' && (
              <div>
                <p className="status-error">❌ Not connected to Ollama</p>
                {error && <p className="error-message">{error}</p>}
                <button 
                  onClick={() => {
                    chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/setup.html' });
                  }}
                  style={{
                    marginTop: '10px',
                    backgroundColor: '#4a90e2',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Run Setup Assistant
                </button>
              </div>
            )}
          </div>

          <div className="model-info">
            <p>Current model: <strong>{modelName}</strong></p>
          </div>
        </div>

        <div className="option-toggle-section">
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={autoCheckEnabled}
              onChange={toggleAutoCheck}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">Auto Grammar Check</span>
        </div>

        <div className="usage-section">
          <h2>How to Use</h2>
          <ol>
            <li>Start typing in any text field</li>
            <li>Purgify offers two ways to improve your writing:</li>
            <ul>
              <li><strong>✅ Auto Grammar Check</strong> - Suggests fixes as you type</li>
              <li><strong>Select & Fix</strong> - Select text to see the toolbar with options:</li>
              <ul>
                <li><strong>✅ Grammar Fix</strong> - Fixes grammar issues</li>
                <li><strong>🔁 Rephrase</strong> - Rewrites the text</li>
              </ul>
            </ul>
            <li>Review suggestions and click "Apply" to use them</li>
          </ol>
        </div>
      </div>

      <div className="popup-footer">
        <button
          onClick={() => {
            document.dispatchEvent(new CustomEvent('purgify:open-settings'));
          }}
          className="settings-button"
        >
          Open Settings
        </button>
      </div>
      {typeof chrome === 'undefined' && (
        <div style={{color: '#f56c6c', fontSize: 13, marginTop: 8}}>
          Extension APIs not available. Please use in Chrome/Edge/Brave.
        </div>
      )}
      {/* Inline settings panel for in-popup editing */}
      <div id="purgify-inline-settings-root"></div>
    </div>
  );
};

export default Popup;
