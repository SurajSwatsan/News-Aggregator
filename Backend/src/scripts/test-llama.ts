import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AiService } from '../ai/ai.service';

async function testLlama() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiService = app.get(AiService);

  const testText = `
    The Indian Space Research Organisation (ISRO) is set to launch its next lunar mission, Chandrayaan-4, 
    which aims to bring back lunar soil samples to Earth. This mission is a significant step forward 
    after the success of Chandrayaan-3, which made India the first country to land near the lunar south pole.
    The mission will involve a complex multi-part module system that will land, collect samples, and 
    then launch back from the Moon's surface to dock with an orbiter for the return journey.
  `;

  console.log('Testing Llama 3 Summarization...');

  try {
    const summary = await aiService.summarize(testText);
    console.log('--- Original Text ---');
    console.log(testText.trim());
    console.log('\n--- Llama 3 Summary ---');
    console.log(summary);
    console.log('-----------------------');
    console.log('✅ Test COMPLETED');
  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
  } finally {
    await app.close();
  }
}

testLlama();
