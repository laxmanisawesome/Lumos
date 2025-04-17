import React from 'react';
import { createRoot } from 'react-dom/client';
import FloatingToolbar from '../components/FloatingToolbar';

const getHighlightedContent = (): string => {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : "";
};

/**
 * Get content from current tab.
 *
 * @param {string[]} selectors - selector queries to get content, i.e. document.querySelector().
 * @param {string[]} selectorsAll - selectorAll queries to get content, i.e. document.querySelectorAll().
 * @returns {[string, boolean, string[]]} - Tuple of content, boolean indicating if content was highlighted content, and an array of image URLs
 */
export const getHtmlContent = (
  selectors: string[],
  selectorsAll: string[],
): [string, boolean, string[]] => {
  // if any content is highlighted, return the highlighted content
  const highlightedContent = getHighlightedContent();
  if (highlightedContent !== "") {
    return [highlightedContent, true, []];
  }

  // otherwise, return content from selected elements
  const elements: Element[] = [];

  // process selector queries
  if (selectors.length > 0) {
    for (const selector of selectors) {
      const selectedElement = document.querySelector(selector);
      if (selectedElement !== null) {
        elements.push(selectedElement);
      }
    }
  }

  // process selectorAll queries
  if (selectorsAll.length > 0) {
    for (const selectorAll of selectorsAll) {
      const selectedElements = document.querySelectorAll(selectorAll);
      for (let i = 0; i < selectedElements.length; i++) {
        elements.push(selectedElements[i]);
      }
    }
  }

  // retrieve content from selected elements
  const parser = new DOMParser();
  let content = "";
  const imageURLs: string[] = [];

  for (const element of elements) {
    const doc = parser.parseFromString(element.outerHTML, "text/html");
    let textContent = doc.body.innerText || "";

    // Use a regular expression to replace contiguous white spaces with a single space
    textContent = textContent.replace(/\s+/g, " ").trim();

    // append textContent to overall content
    content += textContent + "\n";

    // find img elements and add src (URL) to imageURLs list
    const imageElements = doc.querySelectorAll("img");
    imageElements.forEach((imageElement) => {
      const imageURL = imageElement.getAttribute("src");
      if (imageURL) {
        imageURLs.push(imageURL);
      }
    });
  }

  return [content, false, imageURLs];
};

// Create a container for our React component
const toolbarContainer = document.createElement('div');
toolbarContainer.id = 'purgify-toolbar-container';
document.body.appendChild(toolbarContainer);

// Create a root for our React component
const root = createRoot(toolbarContainer);

// Track if toolbar is currently shown
let isToolbarActive = false;

// Debounce timeout for automatic grammar checking
let grammarCheckTimeout: number | null = null;

// Create a suggestion overlay container
const createSuggestionOverlay = (): HTMLDivElement => {
  const overlay = document.createElement('div');
  overlay.id = 'purgify-suggestion-overlay';
  overlay.style.position = 'absolute';
  overlay.style.zIndex = '10001';
  overlay.style.background = 'white';
  overlay.style.border = '1px solid #ccc';
  overlay.style.borderRadius = '4px';
  overlay.style.padding = '8px';
  overlay.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  overlay.style.fontSize = '14px';
  overlay.style.maxWidth = '300px';
  overlay.style.display = 'none';
  document.body.appendChild(overlay);
  return overlay;
};

// Create the suggestion overlay
const suggestionOverlay = createSuggestionOverlay();

// Monitor input fields for grammar checking
const startMonitoring = (element: HTMLElement) => {
  element.addEventListener('input', () => {
    if (grammarCheckTimeout) {
      clearTimeout(grammarCheckTimeout);
    }
    
    grammarCheckTimeout = window.setTimeout(() => {
      const text = element.isContentEditable 
        ? element.innerText || element.textContent 
        : (element as HTMLInputElement).value;
      
      if (text && text.trim().length > 10) { // Only check if enough content
        autoCheckGrammar(text, element);
      }
    }, 1000); // 1-second debounce
  });
};

// Automatically check grammar
const autoCheckGrammar = (text: string, element: HTMLElement) => {
  // Send to background script for processing with TinyLlama/Ollama
  chrome.runtime.sendMessage(
    { action: 'autoCheckGrammar', text: text },
    (response) => {
      if (response && response.success && response.hasIssues) {
        showSuggestionOverlay(response.suggestion, element);
      }
    }
  );
};

// Show suggestion overlay near the element
const showSuggestionOverlay = (suggestion: string, element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  
  suggestionOverlay.innerHTML = `
    <div style="margin-bottom: 8px; color: #4a90e2; font-weight: bold;">Grammar suggestion:</div>
    <div style="margin-bottom: 12px;">${suggestion}</div>
    <div style="display: flex; justify-content: space-between;">
      <button id="purgify-apply-suggestion" style="background-color: #4a90e2; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Apply</button>
      <button id="purgify-dismiss-suggestion" style="background-color: #f5f5f5; border: 1px solid #ddd; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Dismiss</button>
    </div>
  `;
  
  suggestionOverlay.style.top = `${rect.bottom + window.scrollY + 5}px`;
  suggestionOverlay.style.left = `${rect.left + window.scrollX}px`;
  suggestionOverlay.style.display = 'block';
  
  // Handle apply button
  document.getElementById('purgify-apply-suggestion')?.addEventListener('click', () => {
    const selectedText = element.isContentEditable
      ? element.innerText || element.textContent || ''
      : (element as HTMLInputElement).value;
    replaceSelectedText(suggestion, element as HTMLInputElement | HTMLTextAreaElement);
    hideSuggestionOverlay();
  });
  
  // Handle dismiss button
  document.getElementById('purgify-dismiss-suggestion')?.addEventListener('click', () => {
    hideSuggestionOverlay();
  });
};

// Hide the suggestion overlay
const hideSuggestionOverlay = () => {
  suggestionOverlay.style.display = 'none';
};

// Listen for text selection
document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  
  // If there's no selection or it's empty, hide the toolbar
  if (!selection || selection.toString().trim() === '') {
    if (isToolbarActive) {
      hideToolbar();
    }
    return;
  }
  
  // Check if selection is within an editable element
  const targetElement = e.target as HTMLElement;
  const isEditable = 
    targetElement.isContentEditable || 
    targetElement.tagName === 'INPUT' || 
    targetElement.tagName === 'TEXTAREA';
  
  if (!isEditable) {
    return;
  }
  
  // Get selected text
  const selectedText = selection.toString().trim();
  
  // If there's selected text, show the toolbar
  if (selectedText) {
    showToolbar(selectedText, e);
  }
});

// Check for input fields when page loads or DOM changes
document.addEventListener('focusin', (event) => {
  const target = event.target as HTMLElement;
  if (target.isContentEditable || 
      target.tagName === 'TEXTAREA' || 
      (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text')) {
    startMonitoring(target);
  }
});

// Monitor DOM changes to detect dynamically added input fields
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        
        // Check if it's an input field
        if (element.isContentEditable || 
            element.tagName === 'TEXTAREA' || 
            (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text')) {
          startMonitoring(element);
        }
        
        // Check child elements
        const inputFields = element.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
        inputFields.forEach(field => {
          startMonitoring(field as HTMLElement);
        });
      }
    });
  });
});

// Start observing the document
observer.observe(document.body, { childList: true, subtree: true });

// Hide toolbar when clicking outside
document.addEventListener('mousedown', (e) => {
  const target = e.target as HTMLElement;
  
  // Don't hide if clicking on the toolbar or suggestion overlay
  if (target.closest('#purgify-toolbar-container') || target.closest('#purgify-suggestion-overlay')) {
    return;
  }
  
  // Hide toolbar if active
  if (isToolbarActive) {
    hideToolbar();
  }
  
  // Hide suggestion overlay
  hideSuggestionOverlay();
});

function showToolbar(selectedText: string, event: MouseEvent) {
  // Calculate position
  const rect = window.getSelection()?.getRangeAt(0).getBoundingClientRect();
  
  if (!rect) {
    return;
  }

  // Position just above the selection
  const position = {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY - 10 // 10px above the selection
  };

  // Getting the active element to replace text later
  const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;

  // Render the toolbar
  root.render(
    React.createElement(FloatingToolbar, {
      selectedText: selectedText,
      position: position,
      onClose: hideToolbar,
      onApplyChange: (newText: string) => replaceSelectedText(newText, activeElement)
    })
  );
  
  isToolbarActive = true;
}

function hideToolbar() {
  root.render(null);
  isToolbarActive = false;
}

function replaceSelectedText(newText: string, activeElement: HTMLInputElement | HTMLTextAreaElement) {
  // Handle different types of editable elements
  if (activeElement.isContentEditable) {
    // For contentEditable elements
    document.execCommand('insertText', false, newText);
  } else if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
    // For input and textarea elements
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    
    if (typeof start === 'number' && typeof end === 'number') {
      const value = activeElement.value;
      activeElement.value = value.substring(0, start) + newText + value.substring(end);
      
      // Set cursor position after the inserted text
      activeElement.selectionStart = start + newText.length;
      activeElement.selectionEnd = start + newText.length;
    }
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'check-purgify-status') {
    sendResponse({ active: true });
  }
});
