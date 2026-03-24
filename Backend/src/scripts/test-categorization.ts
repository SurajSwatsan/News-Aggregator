import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AiService } from '../ai/ai.service';

async function testCategorization() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiService = app.get(AiService);

  const testArticles = [
    {
      title: 'Fresh arrest in Bihar paper leak case, accused ‘transported 30 candidates’ in SUVs to Hazaribagh hotel',
      content: 'The Bihar Police have made fresh arrests in the ongoing investigation into the teacher recruitment exam paper leak. The suspects allegedly moved candidates to safe houses to memorize leaked questions.'
    },
    {
      title: 'IPL 2026: MS Dhoni hits massive six as CSK beats MI in thriller',
      content: 'In a high-voltage match at Wankhede Stadium, Chennai Super Kings emerged victorious against Mumbai Indians thanks to a last-over cameo by MS Dhoni.'
    },
    {
      title: 'New streaming service launches to compete with Netflix and Disney+',
      content: 'A major media conglomerate has announced a new global streaming platform designed to focus on local journalism and international documentaries.'
    }
  ];

  const categories = [
    'Technology', 'Business', 'Politics', 'Sports', 'Entertainment', 
    'Science', 'Health', 'Lifestyle', 'Environment', 'World', 'Media', 'General'
  ];

  console.log('--- AI Categorization Test ---');

  for (const article of testArticles) {
    try {
      const category = await aiService.categorize(article.title, article.content, categories);
      console.log(`Title: ${article.title}`);
      console.log(`AI Assigned Category: ${category}`);
      console.log('---');
    } catch (err) {
      console.error(`Error categorizing: ${err.message}`);
    }
  }

  await app.close();
}

testCategorization();
