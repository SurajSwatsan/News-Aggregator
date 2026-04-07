import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

async function discoverRssUrl(homepageUrl: string): Promise<string | null> {
  try {
    const { data } = await axios.get(homepageUrl);
    const $ = cheerio.load(data);

    const rssLink =
      $('link[type="application/rss+xml"]').attr('href') ||
      $('link[type="application/atom+xml"]').attr('href');

    if (rssLink) {
      if (rssLink.startsWith('http')) return rssLink;
      const url = new URL(homepageUrl);
      return `${url.protocol}//${url.host}${rssLink.startsWith('/') ? '' : '/'}${rssLink}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function main() {
  const testUrl = 'https://timesofindia.indiatimes.com';
  console.log(`Testing discovery for: ${testUrl}`);
  const rss = await discoverRssUrl(testUrl);
  console.log(`Discovered RSS: ${rss}`);
}

main().finally(() => prisma.$disconnect());
