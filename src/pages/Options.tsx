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

    const { name, value, type } = e.target as HTMLInputElement;

    if (name === 'provider') {
      setConfig({
        ...config,
        provider: value as PurgifyConfig['provider']
      });
    } else if (name === 'apiKey' || name === 'providerModel') {
      setConfig({
        ...config,
        [name]: value
      });
    } else if (name === 'ollamaBaseUrl' || name === 'ollamaModel') {
      setConfig({
        ...config,
        [name]: value
      });
    } else if (name === 'autoCheckEnabled') {
      setConfig({
        ...config,
        autoCheckEnabled: (e.target as HTMLInputElement).checked
      });
    } else if (name === 'grammarFixPrompt' || name === 'rephrasePrompt' || name === 'autoGrammarCheckPrompt') {
      const promptKey = name === 'grammarFixPrompt' 
        ? 'grammarFix' 
        : name === 'rephrasePrompt' 
          ? 'rephrase' 
          : 'autoGrammarCheck';

      setConfig({
        ...config,
        promptTemplates: {
          ...config.promptTemplates,
          [promptKey]: value
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

      <div className="option-section" style={{display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start'}}>
        <div style={{flex: 1, minWidth: 260}}>
          <h2>LLM Provider</h2>
          <div className="option-row">
            <label htmlFor="provider">Provider:</label>
            <select
              id="provider"
              name="provider"
              value={config.provider}
              onChange={handleChange}
              style={{fontWeight: 600, background: '#f5faff'}}
            >
              <option value="ollama">Ollama (local)</option>
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
              <option value="gemini">Gemini Studio</option>
            </select>
          </div>
        </div>
        <div style={{flex: 2, minWidth: 320}}>
          {config.provider === 'ollama' && (
            <div>
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
          )}
          {(config.provider === 'openai' || config.provider === 'deepseek' || config.provider === 'gemini') && (
            <div>
              <h2 style={{marginBottom: 8}}>{config.provider.charAt(0).toUpperCase() + config.provider.slice(1)} Settings</h2>
              <div className="option-row">
                <label htmlFor="apiKey">API Key:</label>
                <input
                  type="password"
                  id="apiKey"
                  name="apiKey"
                  value={config.apiKey || ''}
                  onChange={handleChange}
                  autoComplete="off"
                  style={{background: '#f5faff'}}
                />
              </div>
              <div className="option-row">
                <label htmlFor="providerModel">Model:</label>
                <input
                  type="text"
                  id="providerModel"
                  name="providerModel"
                  value={config.providerModel || ''}
                  onChange={handleChange}
                  placeholder={
                    config.provider === 'openai' ? 'e.g. gpt-3.5-turbo' :
                    config.provider === 'deepseek' ? 'e.g. deepseek-chat' :
                    config.provider === 'gemini' ? 'e.g. gemini-pro' : ''
                  }
                  style={{background: '#f5faff'}}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="option-section">
        <h2>Auto Grammar Check</h2>
        <div className="option-row checkbox-row">
          <label>
            <input
              type="checkbox"
              name="autoCheckEnabled"
              checked={config.autoCheckEnabled}
              onChange={handleChange}
            />
            Enable automatic grammar checking
          </label>
          <p className="setting-description">
            When enabled, Purgify will automatically check for grammar issues as you type in text fields.
          </p>
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
          <p className="prompt-help">Used when manually fixing grammar using the toolbar</p>
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
          <p className="prompt-help">Used when rephrasing text using the toolbar</p>
        </div>

        <div className="option-row">
          <label htmlFor="autoGrammarCheckPrompt">Auto Grammar Check Prompt:</label>
          <textarea
            id="autoGrammarCheckPrompt"
            name="autoGrammarCheckPrompt"
            value={config.promptTemplates.autoGrammarCheck}
            onChange={handleChange}
            rows={3}
          />
          <p className="prompt-help">Used when automatically checking grammar as you type</p>
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
