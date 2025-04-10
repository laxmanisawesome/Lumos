// Background script for Purgify extension
import { OllamaService } from '../services/ollama';

// Initialize Ollama service
const ollamaService = new OllamaService();

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fixGrammar') {
    ollamaService.fixGrammar(request.text)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Error fixing grammar:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the messaging channel open for async response
  }
  
  if (request.action === 'rephrase') {
    ollamaService.rephrase(request.text)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Error rephrasing text:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the messaging channel open for async response
  }
  
  if (request.action === 'checkOllamaStatus') {
    fetch(`${request.host || 'http://localhost:11434'}/api/tags`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to connect to Ollama server');
      })
      .then(data => {
        sendResponse({ success: true, models: data.models });
      })
      .catch(error => {
        console.error('Error connecting to Ollama:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the messaging channel open for async response
  }
});

// Keep the extension alive
const keepAlive = () => {
  setInterval(chrome.runtime.getPlatformInfo, 20e3);
  console.log("Keep alive...");
};
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();
