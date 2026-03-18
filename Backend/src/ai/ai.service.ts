import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaUrl = 'http://localhost:11434/api/generate';

  async summarize(text: string): Promise<string> {
    if (!text || text.length < 50) {
      return text || 'No content available to summarize.';
    }

    try {
      this.logger.log('Requesting Llama 3 summary...');
      
      const response = await axios.post(this.ollamaUrl, {
        model: 'llama3',
        prompt: `Summarize the following news article in exactly 2-3 concise sentences. 
                 Focus on the key facts. Return ONLY the summary text, no introduction or chatter.
                 
                 Article: ${text.substring(0, 3000)}`,
        stream: false,
      }, { timeout: 10000 });

      const summary = response.data?.response?.trim();
      return summary || text.substring(0, 200) + '...';
    } catch (error) {
      this.logger.error(`Llama 3 summarization failed: ${error.message}`);
      // Fallback to simple truncation
      return text.length > 200 ? text.substring(0, 200) + '...' : text;
    }
  }
}
