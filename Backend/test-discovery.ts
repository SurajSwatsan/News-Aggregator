import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';

const parser = new Parser();

async function discoverRssUrl(homepageUrl: string): Promise<string | null> {
    try {
      console.log(`Discovering RSS for ${homepageUrl}...`);
      const { data } = await axios.get(homepageUrl, { timeout: 10000 });
      const $ = cheerio.load(data);
      
      const rssLink = $('link[type="application/rss+xml"]').attr('href') ||
                      $('link[type="application/atom+xml"]').attr('href') ||
                      $('link[rel="alternate"]').filter((i, el) => {
                        const type = $(el).attr('type') || '';
                        return type.includes('rss') || type.includes('xml');
                      }).attr('href');

      if (rssLink) {
        if (rssLink.startsWith('http')) return rssLink;
        const url = new URL(homepageUrl);
        return `${url.protocol}//${url.host}${rssLink.startsWith('/') ? '' : '/'}${rssLink}`;
      }

      const commonPaths = ['/rss', '/feed', '/rss.xml', '/index.xml', '/rss-feed'];
      for (const pathStr of commonPaths) {
        const checkUrl = `${homepageUrl.replace(/\/$/, '')}${pathStr}`;
        try {
          await axios.head(checkUrl, { timeout: 5000 });
          return checkUrl;
        } catch {}
      }

      return null;
    } catch (error) {
      console.error(`Discovery error: ${error.message}`);
      return null;
    }
}

const homepages = [
  'https://www.esakal.com',
  'https://www.hindustantimes.com'
];

async function test() {
  for (const hp of homepages) {
    const discovered = await discoverRssUrl(hp);
    console.log(`Discovered for ${hp}: ${discovered}`);
    if (discovered) {
        try {
            const feed = await parser.parseURL(discovered);
            console.log(`Parsed successfully! Title: ${feed.title}, Items: ${feed.items.length}`);
        } catch (e) {
            console.error(`Parsed failed: ${e.message}`);
        }
    }
  }
}

test();
