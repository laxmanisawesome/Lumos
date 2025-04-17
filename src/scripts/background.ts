// Background script for Purgify extension
import { LLMService } from '../services/llm';

// Initialize LLM service
const llmService = new LLMService();
console.log('Background script initialized, LLM service created');

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  console.log('Message sender:', sender);
  
  if (request.action === 'fixGrammar') {
    console.log('Handling fixGrammar action with text:', request.text);
    llmService.fixGrammar(request.text)
      .then(result => {
        console.log('Grammar fix successful, result:', result);
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Error fixing grammar:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the messaging channel open for async response
  }
  
  if (request.action === 'rephrase') {
    console.log('Handling rephrase action with text:', request.text);
    llmService.rephrase(request.text)
      .then(result => {
        console.log('Rephrase successful, result:', result);
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Error rephrasing text:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the messaging channel open for async response
  }
  
  if (request.action === 'autoCheckGrammar') {
    console.log('Handling autoCheckGrammar action with text:', request.text);
    llmService.checkGrammar(request.text)
      .then(result => {
        console.log('Grammar check result:', result);
        if (result.hasIssues) {
          sendResponse({ 
            success: true, 
            hasIssues: true,
            suggestion: result.correctedText
          });
        } else {
          sendResponse({ success: true, hasIssues: false });
        }
      })
      .catch(error => {
        console.error('Error checking grammar:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the messaging channel open for async response
  }
  
  if (request.action === 'checkOllamaStatus') {
    console.log('Checking Ollama status at host:', request.host || 'http://localhost:11434');
    fetch(`${request.host || 'http://localhost:11434'}/api/tags`)
      .then(response => {
        console.log('Ollama status response:', response.status);
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to connect to Ollama server');
      })
      .then(data => {
        console.log('Available Ollama models:', data.models);
        sendResponse({ success: true, models: data.models });
      })
      .catch(error => {
        console.error('Error connecting to Ollama:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the messaging channel open for async response
  }

  console.log('No handler found for action:', request.action);
});

// Keep the extension alive
const keepAlive = () => {
  setInterval(chrome.runtime.getPlatformInfo, 20e3);
  console.log("Keep alive running...");
};
chrome.runtime.onStartup.addListener(keepAlive);
console.log("Starting keep alive process");
keepAlive();
