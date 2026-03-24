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
      }, { timeout: 30000 }); // Increased timeout to 30s

      const summary = response.data?.response?.trim();
      return summary || text.substring(0, 200) + '...';
    } catch (error) {
      this.logger.error(`Llama 3 summarization failed: ${error.message}`);
      // Fallback to simple truncation
      return text.length > 200 ? text.substring(0, 200) + '...' : text;
    }
  }

  async areArticlesSimilar(
    title1: string, synopsis1: string, 
    title2: string, synopsis2: string
  ): Promise<boolean> {
    try {
      this.logger.log('Comparing two articles for similarity using Llama 3...');
      
      const prompt = `
        Determine if the following two news article snippets describe the SAME news event/story.
        They might be from different publishers and have slightly different wording or focus.
        
        Article 1:
        Title: ${title1}
        Synopsis: ${synopsis1.substring(0, 500)}
        
        Article 2:
        Title: ${title2}
        Synopsis: ${synopsis2.substring(0, 500)}
        
        Respond with ONLY 'YES' if they are the same story, or 'NO' if they are different stories.
        No explanation.
      `;

      const response = await axios.post(this.ollamaUrl, {
        model: 'llama3',
        prompt,
        stream: false,
      }, { timeout: 30000 });

      const answer = response.data?.response?.trim().toUpperCase();
      this.logger.debug(`Similarity check result: ${answer}`);
      
      return answer === 'YES';
    } catch (error) {
      this.logger.error(`Llama 3 similarity check failed: ${error.message}`);
      return false; // Default to not similar on failure
    }
  }

  async categorize(title: string, content: string, categories: string[]): Promise<string | null> {
    try {
      this.logger.log(`Categorizing article: "${title}" using Llama 3...`);
      
      const prompt = `
        Categorize the following news article into exactly ONE of these categories: ${categories.join(', ')}.
        
        Title: ${title}
        Content: ${content.substring(0, 500)}
        
        Respond with ONLY the category name. No explanation or chatter.
      `;

      const response = await axios.post(this.ollamaUrl, {
        model: 'llama3',
        prompt,
        stream: false,
      }, { timeout: 30000 });

      const category = response.data?.response?.trim();
      this.logger.debug(`AI Categorization result: ${category}`);
      
      return category || null;
    } catch (error) {
      this.logger.error(`Llama 3 categorization failed: ${error.message}`);
      return null;
    }
  }
}
