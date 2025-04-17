import React, { useState } from 'react';
import './FloatingToolbar.css';

interface FloatingToolbarProps {
  selectedText: string;
  position: { x: number, y: number };
  onClose: () => void;
  onApplyChange: (newText: string) => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ 
  selectedText, 
  position, 
  onClose,
  onApplyChange
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');

  // Updated to use chrome.runtime messaging instead of direct OllamaService
  const handleFixGrammar = async () => {
    console.log('Grammar fix button clicked');
    console.log('Selected text to fix:', selectedText);
    setIsProcessing(true);
    try {
      console.log('Sending message to background script with action: fixGrammar');
      // Send message to background script instead of calling OllamaService directly
      chrome.runtime.sendMessage(
        { action: 'fixGrammar', text: selectedText },
        (response) => {
          console.log('Received response from background script:', response);
          if (response && response.success) {
            console.log('Grammar fix successful, setting result:', response.result);
            setResult(response.result);
          } else {
            console.error('Error fixing grammar:', response?.error || 'Unknown error');
            setResult('Error processing request');
          }
          setIsProcessing(false);
        }
      );
    } catch (error) {
      console.error('Error sending message to background script:', error);
      setResult('Error processing request');
      setIsProcessing(false);
    }
  };

  const handleRephrase = async () => {
    console.log('Rephrase button clicked');
    console.log('Selected text to rephrase:', selectedText);
    setIsProcessing(true);
    try {
      console.log('Sending message to background script with action: rephrase');
      // Send message to background script instead of calling OllamaService directly
      chrome.runtime.sendMessage(
        { action: 'rephrase', text: selectedText },
        (response) => {
          console.log('Received response from background script:', response);
          if (response && response.success) {
            console.log('Rephrase successful, setting result:', response.result);
            setResult(response.result);
          } else {
            console.error('Error rephrasing text:', response?.error || 'Unknown error');
            setResult('Error processing request');
          }
          setIsProcessing(false);
        }
      );
    } catch (error) {
      console.error('Error sending message to background script:', error);
      setResult('Error processing request');
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    console.log('Apply button clicked, applying result:', result);
    onApplyChange(result);
    onClose();
  };

  const handleCancel = () => {
    console.log('Cancel button clicked');
    setResult('');
    onClose();
  };

  // Log on render to verify component is working
  console.log('FloatingToolbar rendered', { 
    selectedText, 
    position, 
    hasResult: !!result, 
    isProcessing 
  });

  return (
    <div 
      className="purgify-floating-toolbar purgify-fixed-bottom-right"
    >
      {!result ? (
        <div className="purgify-toolbar-actions">
          <button 
            className="purgify-toolbar-button"
            onClick={handleFixGrammar}
            disabled={isProcessing}
          >
            ✅ Grammar Fix
          </button>
          <button 
            className="purgify-toolbar-button"
            onClick={handleRephrase}
            disabled={isProcessing}
          >
            🔁 Rephrase
          </button>
          {isProcessing && <div className="purgify-loader"></div>}
        </div>
      ) : (
        <div className="purgify-result-view">
          <div className="purgify-result-text">{result}</div>
          <div className="purgify-result-actions">
            <button 
              className="purgify-toolbar-button"
              onClick={handleApply}
            >
              Apply
            </button>
            <button 
              className="purgify-toolbar-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingToolbar;