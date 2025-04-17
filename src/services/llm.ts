import { getConfig } from '../config';
import { OllamaService } from './ollama';

export class LLMService {
  private ollamaService = new OllamaService();

  async fixGrammar(text: string): Promise<string> {
    const config = await getConfig();
    switch (config.provider) {
      case 'ollama':
        return this.ollamaService.fixGrammar(text);
      case 'openai':
        return this.openaiRequest(text, config, 'fixGrammar');
      case 'deepseek':
        return this.openaiRequest(text, config, 'fixGrammar', 'deepseek');
      case 'gemini':
        return this.geminiRequest(text, config, 'fixGrammar');
      default:
        throw new Error('Unsupported provider');
    }
  }

  async rephrase(text: string): Promise<string> {
    const config = await getConfig();
    switch (config.provider) {
      case 'ollama':
        return this.ollamaService.rephrase(text);
      case 'openai':
        return this.openaiRequest(text, config, 'rephrase');
      case 'deepseek':
        return this.openaiRequest(text, config, 'rephrase', 'deepseek');
      case 'gemini':
        return this.geminiRequest(text, config, 'rephrase');
      default:
        throw new Error('Unsupported provider');
    }
  }

  async checkGrammar(text: string): Promise<{ hasIssues: boolean; correctedText: string }> {
    const config = await getConfig();
    switch (config.provider) {
      case 'ollama':
        return this.ollamaService.checkGrammar(text);
      case 'openai':
        return this.openaiCheckGrammar(text, config);
      case 'deepseek':
        return this.openaiCheckGrammar(text, config, 'deepseek');
      case 'gemini':
        return this.geminiCheckGrammar(text, config);
      default:
        throw new Error('Unsupported provider');
    }
  }

  // --- OpenAI/DeepSeek ---
  private async openaiRequest(text: string, config: any, type: 'fixGrammar' | 'rephrase', provider: 'openai' | 'deepseek' = 'openai'): Promise<string> {
    const endpoint = provider === 'deepseek'
      ? 'https://api.deepseek.com/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const model = config.providerModel || (provider === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo');
    const prompt = config.promptTemplates[type === 'fixGrammar' ? 'grammarFix' : 'rephrase'].replace('${text}', text);
    const apiKey = config.apiKey;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    const body = JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: type === 'fixGrammar' ? 0.3 : 0.7
    });
    const res = await fetch(endpoint, { method: 'POST', headers, body });
    if (!res.ok) throw new Error('API error: ' + res.statusText);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  private async openaiCheckGrammar(text: string, config: any, provider: 'openai' | 'deepseek' = 'openai') {
    const result = await this.openaiRequest(text, config, 'fixGrammar', provider);
    return { hasIssues: result !== text, correctedText: result };
  }

  // --- Gemini ---
  private async geminiRequest(text: string, config: any, type: 'fixGrammar' | 'rephrase'): Promise<string> {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + (config.providerModel || 'gemini-pro') + ':generateContent?key=' + config.apiKey;
    const prompt = config.promptTemplates[type === 'fixGrammar' ? 'grammarFix' : 'rephrase'].replace('${text}', text);
    const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (!res.ok) throw new Error('Gemini API error: ' + res.statusText);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  private async geminiCheckGrammar(text: string, config: any) {
    const result = await this.geminiRequest(text, config, 'fixGrammar');
    return { hasIssues: result !== text, correctedText: result };
  }
}
