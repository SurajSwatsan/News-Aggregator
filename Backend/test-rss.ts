import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

const urls = [
  'http://feeds.bbci.co.uk/news/world/rss.xml',
  'https://www.esakal.com/rss-feed',
  'https://www.hindustantimes.com/feeds/rss/latest/rssfeed'
];

async function test() {
  for (const url of urls) {
    console.log(`\n--- Testing ${url} ---`);
    try {
      const feed = await parser.parseURL(url);
      console.log(`Title: ${feed.title}`);
      console.log(`Items: ${feed.items.length}`);
      if (feed.items.length > 0) {
        const item = feed.items[0];
        console.log(`First Item Title: ${item.title}`);
        console.log(`First Item Link: ${item.link}`);
        console.log(`First Item GUID: ${JSON.stringify(item.guid)}`);
        console.log(`First Item ID: ${(item as any).id}`);
      }
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
}

test();
