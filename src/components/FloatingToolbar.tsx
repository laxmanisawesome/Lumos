import React, { useState } from 'react';
import './FloatingToolbar.css';
import { OllamaService } from '../services/ollama';

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
  const ollamaService = new OllamaService();

  const handleFixGrammar = async () => {
    setIsProcessing(true);
    try {
      const fixedText = await ollamaService.fixGrammar(selectedText);
      setResult(fixedText);
    } catch (error) {
      console.error('Error fixing grammar:', error);
      setResult('Error processing request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRephrase = async () => {
    setIsProcessing(true);
    try {
      const rephrased = await ollamaService.rephrase(selectedText);
      setResult(rephrased);
    } catch (error) {
      console.error('Error rephrasing text:', error);
      setResult('Error processing request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    onApplyChange(result);
    onClose();
  };

  const handleCancel = () => {
    setResult('');
    onClose();
  };

  return (
    <div 
      className="purgify-floating-toolbar" 
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px` 
      }}
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