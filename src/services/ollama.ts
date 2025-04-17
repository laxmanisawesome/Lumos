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
      
      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(`Ollama returned 403 Forbidden. Please ensure OLLAMA_ORIGINS environment variable is set to "chrome-extension://*". 
          On macOS run: launchctl setenv OLLAMA_ORIGINS "chrome-extension://*" 
          Then restart Ollama with: ollama serve`);
        } else {
          throw new Error(`Ollama API returned ${response.status} ${response.statusText}`);
        }
      }
      
      const text = await response.text();
      console.log('Ollama raw response:', text);
      // --- NDJSON streaming response handling ---
      let result = '';
      let finalObj: any = null;
      let parsedAny = false;
      try {
        // Split by newlines, filter out empty lines
        const lines = text.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            parsedAny = true;
            if (typeof obj.response === 'string') {
              result += obj.response;
            }
            if (obj.done) {
              finalObj = obj;
            }
          } catch (lineErr) {
            // Skip lines that are not valid JSON
            console.warn('Skipping invalid NDJSON line:', line);
          }
        }
        if (!finalObj && parsedAny) {
          console.warn('No final object with done=true found in Ollama response, but partial response was parsed. Returning partial result.');
        }
        if (!parsedAny) throw new Error('No valid NDJSON objects found in Ollama response.');
      } catch (jsonErr) {
        console.error('Failed to parse Ollama NDJSON response:', jsonErr);
        throw new Error('Ollama returned invalid NDJSON: ' + text);
      }
      console.log('Ollama API success response:', {
        model: finalObj?.model,
        responsePreview: result.substring(0, 100) + '...',
      });
      return result;
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
      const rawResult = await this.generateText(prompt, { temperature: 0.3 });
      
      // Extract only the corrected text by removing any prompt instructions that were echoed back
      // First, try to find the original text and return only what comes after it
      let result = rawResult;
      
      // Check if the model echoed back the instructions - if so, strip them
      if (rawResult.includes(text)) {
        // The model might have included the original text and the correction
        // Try to extract just the correction
        const textIndex = rawResult.indexOf(text);
        if (textIndex >= 0) {
          result = rawResult.substring(textIndex);
        }
      } else if (rawResult.includes('Fix grammar and spelling')) {
        // The model echoed back instructions, try to extract just the corrected text
        // This is a heuristic approach - we look for the end of instructions
        const formatIndex = rawResult.indexOf("No formatting.");
        if (formatIndex > 0 && formatIndex + 15 < rawResult.length) {
          // Skip past "No formatting." and any whitespace
          result = rawResult.substring(formatIndex + 14).trim();
        }
      }
      
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
      const rawResult = await this.generateText(prompt, { temperature: 0.7 });
      
      // Extract only the rephrased text and remove any prompt instructions
      let result = rawResult;
      
      // Check if the model echoed back the instructions - if so, strip them
      if (rawResult.includes(text)) {
        // The model might have included the original text and the rephrased version
        const textIndex = rawResult.indexOf(text);
        if (textIndex >= 0) {
          result = rawResult.substring(textIndex);
        }
      } else if (rawResult.includes('Rephrase the following text')) {
        // The model echoed back instructions, try to extract just the rephrased text
        const plainTextIndex = rawResult.indexOf("just the plain text.");
        if (plainTextIndex > 0 && plainTextIndex + 20 < rawResult.length) {
          // Skip past "just the plain text." and any whitespace
          result = rawResult.substring(plainTextIndex + 20).trim();
        }
      }
      
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
      const rawResponse = await this.generateText(prompt, { temperature: 0.3 });
      
      // Process the response to extract just the relevant part
      let response = rawResponse;
      
      // Check if the model echoed back the instructions - if so, strip them
      if (rawResponse.includes("Check if this text has grammar issues")) {
        // If the model echoed back instructions, try to extract just the corrected text
        const foundIndex = rawResponse.indexOf("No grammar issues found");
        if (foundIndex >= 0) {
          // Found the "No grammar issues found" text
          response = "No grammar issues found";
        } else if (rawResponse.includes(text)) {
          // Try to get what comes after the original text
          const textIndex = rawResponse.indexOf(text);
          if (textIndex >= 0 && textIndex + text.length < rawResponse.length) {
            response = rawResponse.substring(textIndex + text.length).trim();
            // If response is empty, use the original raw response
            if (!response) response = rawResponse;
          }
        }
      }
      
      // Check if the model found issues based on the processed response
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