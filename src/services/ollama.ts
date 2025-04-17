// Ollama service for handling LLM operations
import { getConfig } from '../config';

export interface OllamaRequestPayload {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaResponse {
  model: string;
  response: string;
  context?: number[];
}

export interface GrammarCheckResult {
  hasIssues: boolean;
  correctedText: string;
}

export class OllamaService {
  private baseUrl: string = 'http://localhost:11434';
  private model: string = 'tinyllama';

  constructor() {
    console.log('OllamaService constructor called');
    this.initConfig();
  }

  private async initConfig() {
    console.log('Initializing Ollama service configuration');
    try {
      const config = await getConfig();
      console.log('Ollama config loaded:', { 
        baseUrl: config.ollamaBaseUrl, 
        model: config.ollamaModel,
        promptTemplates: config.promptTemplates 
      });
      this.baseUrl = config.ollamaBaseUrl;
      this.model = config.ollamaModel;
    } catch (error) {
      console.error('Error loading Ollama configuration:', error);
    }
  }

  /**
   * Generates text using the Ollama API
   */
  async generateText(prompt: string, options = {}): Promise<string> {
    console.log('generateText called with prompt:', prompt.substring(0, 50) + '...');
    console.log('Using options:', options);
    
    await this.initConfig(); // Refresh config in case it was updated
    console.log('Using Ollama at URL:', this.baseUrl, 'with model:', this.model);

    try {
      const requestPayload = {
        model: this.model,
        prompt: prompt,
        options: {
          temperature: 0.7,
          ...options,
        },
      } as OllamaRequestPayload;
      
      console.log('Sending request to Ollama:', JSON.stringify(requestPayload).substring(0, 200) + '...');
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('Ollama API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ollama API error response:', errorText);
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as OllamaResponse;
      console.log('Ollama API success response:', {
        model: data.model,
        responsePreview: data.response.substring(0, 100) + '...',
      });
      
      return data.response;
    } catch (error) {
      console.error('Error in generateText:', error);
      throw error;
    }
  }

  /**
   * Fixes grammar in the provided text
   */
  async fixGrammar(text: string): Promise<string> {
    console.log('fixGrammar called with text:', text.substring(0, 50) + '...');
    
    try {
      const config = await getConfig();
      const promptTemplate = config.promptTemplates.grammarFix;
      console.log('Using grammar fix prompt template:', promptTemplate);
      
      const prompt = promptTemplate.replace('${text}', text);
      const result = await this.generateText(prompt, { temperature: 0.3 });
      
      console.log('Grammar fix result:', result.substring(0, 100) + '...');
      return result;
    } catch (error) {
      console.error('Error in fixGrammar:', error);
      throw error;
    }
  }

  /**
   * Rephrases the provided text
   */
  async rephrase(text: string): Promise<string> {
    console.log('rephrase called with text:', text.substring(0, 50) + '...');
    
    try {
      const config = await getConfig();
      const promptTemplate = config.promptTemplates.rephrase;
      console.log('Using rephrase prompt template:', promptTemplate);
      
      const prompt = promptTemplate.replace('${text}', text);
      const result = await this.generateText(prompt, { temperature: 0.7 });
      
      console.log('Rephrase result:', result.substring(0, 100) + '...');
      return result;
    } catch (error) {
      console.error('Error in rephrase:', error);
      throw error;
    }
  }

  /**
   * Checks for grammar issues in the provided text
   * Returns an object with a flag indicating if issues were found and corrected text
   */
  async checkGrammar(text: string): Promise<GrammarCheckResult> {
    console.log('checkGrammar called with text:', text.substring(0, 50) + '...');
    
    try {
      const config = await getConfig();
      
      // Default to grammar fix prompt if autoCheck prompt is not available
      const promptTemplate = config.promptTemplates.autoGrammarCheck || 
        'Check if this text has grammar issues. If it does, provide a corrected version. If not, respond with "No grammar issues found."\n\n${text}';
      
      console.log('Using auto grammar check prompt template:', promptTemplate);
      
      const prompt = promptTemplate.replace('${text}', text);
      const response = await this.generateText(prompt, { temperature: 0.3 });
      
      // Check if the model found issues based on the response
      const hasIssues = !response.includes('No grammar issues found') && response !== text;
      
      console.log('Grammar check result:', { 
        hasIssues, 
        responsePreview: response.substring(0, 100) + '...' 
      });
      
      return {
        hasIssues: hasIssues,
        correctedText: hasIssues ? response : text
      };
    } catch (error) {
      console.error('Error in checkGrammar:', error);
      throw error;
    }
  }
}