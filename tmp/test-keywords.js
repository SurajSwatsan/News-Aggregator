
function getKeywords(text) {
  const stopWords = new Set([
    'the', 'this', 'that', 'with', 'from', 'brought', 'shares', 'warns', 'shows', 
    'tells', 'will', 'your', 'says', 'about', 'amid', 'could', 'would', 'after', 
    'before', 'while', 'during', 'must', 'they', 'them', 'their', 'when', 'where', 
    'been', 'were', 'have', 'than', 'into', 'action', 'says', 'calls', 'seeks', 
    'claims', 'reports', 'take', 'make', 'just', 'more', 'some', 'over', 'back',
    'last', 'next', 'been', 'being', 'been', 'also', 'only', 'very', 'been',
    'horoscope', 'zodiac', 'daily', 'tomorrow', 'yesterday'
  ]);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
}

const testCases = [
  {
    title: "Trump hints at receiving 'significant' oil-linked gift from Iran amid secret talks",
    expectedNotToContain: ['amid', 'from', 'with']
  },
  {
    title: "Amid Vijay-Trisha Krishnan controversy, Aarti Ravi questions...",
    expectedNotToContain: ['amid']
  },
  {
    title: "Arrests of Palestine Action protesters to resume, Met says",
    expectedNotToContain: ['action', 'says']
  },
  {
    title: "Horoscope Tomorrow, March 26, 2026: Complete unfinished work...",
    expectedNotToContain: ['horoscope', 'tomorrow']
  }
];

console.log("--- Testing Keyword Extraction ---");
testCases.forEach((tc, i) => {
  const keywords = getKeywords(tc.title);
  console.log(`Test ${i + 1}: "${tc.title}"`);
  console.log(`Keywords: [${keywords.join(', ')}]`);
  
  tc.expectedNotToContain.forEach(word => {
    if (keywords.includes(word)) {
      console.error(`❌ FAILED: Keywords should NOT contain "${word}"`);
    } else {
      console.log(`✅ Passed: Does not contain "${word}"`);
    }
  });
  console.log("");
});
