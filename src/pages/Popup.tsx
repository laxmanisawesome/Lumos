import React, { useState, useEffect } from 'react';
import { getConfig } from '../config';
import './Popup.css';

const Popup: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [modelName, setModelName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check connection to Ollama when the popup opens
    getConfig().then(config => {
      setModelName(config.ollamaModel);
      
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
  }, []);

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="purgify-popup">
      <div className="popup-header">
        <h1>Purgify</h1>
        <p className="tagline">Grammar fixing & rephrasing with Ollama</p>
      </div>

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
              </div>
            )}
          </div>

          <div className="model-info">
            <p>Current model: <strong>{modelName}</strong></p>
          </div>
        </div>

        <div className="usage-section">
          <h2>How to Use</h2>
          <ol>
            <li>Select text in any text field</li>
            <li>A toolbar will appear with two options:</li>
            <ul>
              <li><strong>✅ Grammar Fix</strong> - Fixes grammar issues</li>
              <li><strong>🔁 Rephrase</strong> - Rewrites the text</li>
            </ul>
            <li>Click your desired option</li>
            <li>Review the suggested change</li>
            <li>Click "Apply" to use the suggestion</li>
          </ol>
        </div>
      </div>

      <div className="popup-footer">
        <button onClick={openOptions} className="settings-button">
          Open Settings
        </button>
      </div>
    </div>
  );
};

export default Popup;
