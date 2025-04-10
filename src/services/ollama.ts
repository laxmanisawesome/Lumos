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

export class OllamaService {
  private baseUrl: string = 'http://localhost:11434';
  private model: string = 'tinyllama';

  constructor() {
    this.initConfig();
  }

  private async initConfig() {
    const config = await getConfig();
    this.baseUrl = config.ollamaBaseUrl;
    this.model = config.ollamaModel;
  }

  /**
   * Generates text using the Ollama API
   */
  async generateText(prompt: string, options = {}): Promise<string> {
    await this.initConfig(); // Refresh config in case it was updated

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        options: {
          temperature: 0.7,
          ...options,
        },
      } as OllamaRequestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as OllamaResponse;
    return data.response;
  }

  /**
   * Fixes grammar in the provided text
   */
  async fixGrammar(text: string): Promise<string> {
    const config = await getConfig();
    const prompt = config.promptTemplates.grammarFix.replace('${text}', text);
    return this.generateText(prompt, { temperature: 0.3 });
  }

  /**
   * Rephrases the provided text
   */
  async rephrase(text: string): Promise<string> {
    const config = await getConfig();
    const prompt = config.promptTemplates.rephrase.replace('${text}', text);
    return this.generateText(prompt, { temperature: 0.7 });
  }
}