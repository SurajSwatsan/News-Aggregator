import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function mapCategory(raw: string, title: string, content: string): string {
  const text = `${raw} ${title} ${content}`.toLowerCase();

  if (
    text.match(
      /tech|gadget|software|ai|internet|silicon|computing|mobile|device/,
    )
  )
    return 'Technology';
  if (
    text.match(
      /stock|market|finance|economy|business|corporate|startup|money|bank/,
    )
  )
    return 'Business';
  if (
    text.match(
      /politic|election|government|parliament|senate|white house|minister|diplomacy/,
    )
  )
    return 'Politics';
  if (
    text.match(
      /sport|cricket|football|olympic|tennis|stadium|match|tournament|fifa/,
    )
  )
    return 'Sports';
  if (
    text.match(
      /entertainment|movie|film|actor|music|hollywood|bollywood|celebrity|oscar/,
    )
  )
    return 'Entertainment';
  if (
    text.match(
      /health|medical|doctor|virus|vaccine|disease|science|research|study|space|nasa/,
    )
  )
    return 'Science';
  if (
    text.match(
      /environment|climate|nature|forest|pollution|recycle|green energy|ocean/,
    )
  )
    return 'Environment';
  if (text.match(/world|international|global|nation|country/)) return 'World';
  if (text.match(/lifestyle|travel|food|cooking|fashion|luxury|style/))
    return 'Lifestyle';

  return 'General';
}

async function updateAllCategories() {
  const articles = await prisma.article.findMany();
  console.log(`Found ${articles.length} articles to update.`);

  for (const article of articles) {
    const newCategory = mapCategory(
      article.category || '',
      article.title,
      article.synopsis || '',
    );
    await prisma.article.update({
      where: { id: article.id },
      data: { category: newCategory },
    });
  }

  console.log('✅ All articles updated with new category mapping.');
  await prisma.$disconnect();
}

updateAllCategories();
