import React, { useState, useEffect } from 'react';
import { getConfig, saveConfig, PurgifyConfig } from '../config';
import './Options.css';

const Options: React.FC = () => {
  const [config, setConfig] = useState<PurgifyConfig | null>(null);
  const [status, setStatus] = useState<string>('');
  const [ollamaStatus, setOllamaStatus] = useState<{ connected: boolean; models: string[] }>({
    connected: false,
    models: []
  });

  useEffect(() => {
    // Load config on mount
    getConfig().then(loadedConfig => {
      setConfig(loadedConfig);
      checkOllamaStatus(loadedConfig.ollamaBaseUrl);
    });
  }, []);

  const checkOllamaStatus = (host: string) => {
    chrome.runtime.sendMessage(
      { action: 'checkOllamaStatus', host },
      (response) => {
        if (response && response.success) {
          setOllamaStatus({
            connected: true,
            models: response.models || []
          });
        } else {
          setOllamaStatus({
            connected: false,
            models: []
          });
        }
      }
    );
  };

  const handleSave = async () => {
    if (!config) return;
    
    try {
      await saveConfig(config);
      setStatus('Settings saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus('Error saving settings');
      console.error('Error saving settings:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!config) return;

    const { name, value } = e.target;
    
    if (name === 'ollamaBaseUrl' || name === 'ollamaModel') {
      setConfig({
        ...config,
        [name]: value
      });
    } else if (name === 'grammarFixPrompt' || name === 'rephrasePrompt') {
      setConfig({
        ...config,
        promptTemplates: {
          ...config.promptTemplates,
          [name === 'grammarFixPrompt' ? 'grammarFix' : 'rephrase']: value
        }
      });
    }
  };

  const handleOllamaCheck = () => {
    if (!config) return;
    checkOllamaStatus(config.ollamaBaseUrl);
  };

  if (!config) {
    return <div className="purgify-options">Loading...</div>;
  }

  return (
    <div className="purgify-options">
      <h1>Purgify Extension Settings</h1>

      <div className="option-section">
        <h2>Ollama Connection</h2>
        <div className="option-row">
          <label htmlFor="ollamaBaseUrl">Ollama URL:</label>
          <input
            type="text"
            id="ollamaBaseUrl"
            name="ollamaBaseUrl"
            value={config.ollamaBaseUrl}
            onChange={handleChange}
          />
          <button 
            className="test-button"
            onClick={handleOllamaCheck}
          >
            Test Connection
          </button>
        </div>
        
        <div className="status-indicator">
          Connection Status: 
          <span className={ollamaStatus.connected ? 'status-ok' : 'status-error'}>
            {ollamaStatus.connected ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        <div className="option-row">
          <label htmlFor="ollamaModel">Ollama Model:</label>
          <select
            id="ollamaModel"
            name="ollamaModel"
            value={config.ollamaModel}
            onChange={handleChange}
          >
            {ollamaStatus.models.length > 0 ? (
              ollamaStatus.models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))
            ) : (
              <option value={config.ollamaModel}>{config.ollamaModel}</option>
            )}
          </select>
        </div>
      </div>

      <div className="option-section">
        <h2>Prompt Templates</h2>
        <div className="option-row">
          <label htmlFor="grammarFixPrompt">Grammar Fix Prompt:</label>
          <textarea
            id="grammarFixPrompt"
            name="grammarFixPrompt"
            value={config.promptTemplates.grammarFix}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="option-row">
          <label htmlFor="rephrasePrompt">Rephrase Prompt:</label>
          <textarea
            id="rephrasePrompt"
            name="rephrasePrompt"
            value={config.promptTemplates.rephrase}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>

      <div className="save-section">
        <button onClick={handleSave} className="save-button">Save Settings</button>
        {status && <div className="status-message">{status}</div>}
      </div>
    </div>
  );
};

export default Options;
