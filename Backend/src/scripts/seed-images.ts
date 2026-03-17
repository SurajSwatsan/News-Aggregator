import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoryImages: Record<string, string[]> = {
  'Sports': [
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1461896756986-83b7aff72671?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800'
  ],
  'Technology': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'
  ],
  'Business': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1454165833741-9795a8871b11?auto=format&fit=crop&q=80&w=800'
  ],
  'Politics': [
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1541872703-74c5e443d1f9?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&q=80&w=800'
  ],
  'World': [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1476304884325-cd882222f5d2?auto=format&fit=crop&q=80&w=800'
  ]
};

async function main() {
  const articles = await prisma.article.findMany();
  console.log(`Rewriting images for ${articles.length} articles...`);

  for (const article of articles) {
    const cat = article.category || 'World';
    const images = categoryImages[cat] || categoryImages['World'];
    // Use the article's ID to consistently pick one of the 3 images for variety
    const index = Math.abs(article.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % images.length;
    
    await prisma.article.update({
      where: { id: article.id },
      data: { imageUrl: images[index] }
    });
  }

  console.log('Images updated with dynamic placeholders successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
