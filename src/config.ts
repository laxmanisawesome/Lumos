// Config file for Purgify extension
export interface PurgifyConfig {
  provider: 'ollama' | 'openai' | 'deepseek' | 'gemini';
  apiKey?: string; // For OpenAI, DeepSeek, Gemini
  providerModel?: string; // For OpenAI, DeepSeek, Gemini
  ollamaBaseUrl: string;
  ollamaModel: string;
  promptTemplates: {
    grammarFix: string; // Prompt for grammar fix
    rephrase: string;  // Prompt for rephrase
    autoGrammarCheck: string;
  };
  autoCheckEnabled: boolean;
}

// Default configuration values
export const defaultConfig: PurgifyConfig = {
  provider: 'ollama',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'tinyllama',
  promptTemplates: {
    grammarFix: 'Fix grammar and spelling only. Do not change tone, words, punctuation style, or sentence structure. Do not explain, translate, quote, or add anything. Return the corrected text only. No extra output. No markdown. No labels. No formatting.\n\n${text}',
    rephrase: 'Rephrase the following text in a formal and professional tone. Keep the original meaning intact. Respond with the rephrased version only — no extra comments, no formatting, just the plain text.\n\n${text}',
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
          // Ensure all promptTemplates keys are present
          config.promptTemplates.grammarFix = config.promptTemplates.grammarFix || defaultConfig.promptTemplates.grammarFix;
          config.promptTemplates.rephrase = config.promptTemplates.rephrase || defaultConfig.promptTemplates.rephrase;
          config.promptTemplates.autoGrammarCheck = config.promptTemplates.autoGrammarCheck || defaultConfig.promptTemplates.autoGrammarCheck;
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