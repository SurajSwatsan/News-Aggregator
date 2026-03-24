import Parser from 'rss-parser';
import axios from 'axios';

async function testRss() {
  const rssUrl = 'https://www.dailynewsindia.com/rss';
  const parser = new Parser();
  
  console.log(`Testing RSS URL: ${rssUrl}`);
  
  try {
    const response = await axios.get(rssUrl, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });
    console.log('HTTP Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    
    // Test parsing
    const feed = await parser.parseString(response.data);
    console.log('Feed Title:', feed.title);
    console.log('Number of Items:', feed.items?.length || 0);
    
    if (feed.items && feed.items.length > 0) {
      console.log('First Item Title:', feed.items[0].title);
      console.log('First Item Link:', feed.items[0].link);
    }
  } catch (error) {
    console.error('Error fetching or parsing RSS:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.log('Response Body Snippet:', error.response.data.substring(0, 500));
    }
  }
}

testRss();
