// Config file for Purgify extension
export interface PurgifyConfig {
  ollamaBaseUrl: string;
  ollamaModel: string;
  promptTemplates: {
    grammarFix: string;
    rephrase: string;
    autoGrammarCheck: string;
  };
  autoCheckEnabled: boolean;
}

// Default configuration values
export const defaultConfig: PurgifyConfig = {
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'tinyllama',
  promptTemplates: {
    grammarFix: 'Fix the grammar without changing the tone or meaning:\n\n${text}',
    rephrase: 'Rephrase while preserving meaning and tone:\n\n${text}',
    autoGrammarCheck: 'Check if this text has grammar issues. If it does, provide a corrected version. If not, respond with "No grammar issues found."\n\n${text}'
  },
  autoCheckEnabled: true
};

// Get current configuration with optional user overrides
export async function getConfig(): Promise<PurgifyConfig> {
  // Try to get stored config from Chrome storage
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get('purgifyConfig', (result) => {
        if (result.purgifyConfig) {
          // Ensuring all fields are present by merging with default config
          const config = {
            ...defaultConfig,
            ...result.purgifyConfig,
            promptTemplates: {
              ...defaultConfig.promptTemplates,
              ...(result.purgifyConfig.promptTemplates || {})
            }
          };
          resolve(config);
        } else {
          resolve(defaultConfig);
        }
      });
    } else {
      resolve(defaultConfig);
    }
  });
}

// Save configuration to Chrome storage
export async function saveConfig(config: Partial<PurgifyConfig>): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      getConfig().then(currentConfig => {
        const newConfig = { 
          ...currentConfig, 
          ...config,
          // Ensure nested promptTemplates are properly merged
          promptTemplates: {
            ...currentConfig.promptTemplates,
            ...(config.promptTemplates || {})
          } 
        };
        chrome.storage.sync.set({ purgifyConfig: newConfig }, () => {
          resolve();
        });
      });
    } else {
      resolve();
    }
  });
}