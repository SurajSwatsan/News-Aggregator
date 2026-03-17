import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RSSImporterService } from '../publisher/rss-importer.service';
import * as fs from 'fs';
import * as path from 'path';

async function testImport() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const importer = app.get(RSSImporterService);

  const testFile = path.join(process.cwd(), 'imports', 'rss', 'test-publishers.xml');
  
  const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Test Publishers</title>
  <item>
    <title>Auto News Daily</title>
    <link>https://autonews.example.com</link>
    <description>Automatic News Updates</description>
  </item>
  <item>
    <title>Global Tech Feed</title>
    <link>https://techfeed.example.com</link>
    <enclosure url="https://techfeed.example.com/rss" length="0" type="application/rss+xml" />
  </item>
</channel>
</rss>`;

  if (!fs.existsSync(path.dirname(testFile))) {
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
  }
  
  fs.writeFileSync(testFile, xmlContent);
  console.log('✅ Created test RSS file');

  await importer.importFromRSSFile(testFile);
  console.log('✅ Import process triggered');

  await app.close();
}

testImport().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
