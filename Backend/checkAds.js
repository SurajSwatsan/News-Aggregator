const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  await p.advertisement.updateMany({
    data: {
      mediaUrl: 'http://localhost:3000/uploads/gemini-ad.png',
      adType: 'image',
      targetUrl: 'https://cloud.google.com/ai/gemini-for-work?utm_source=DV360&utm_medium=Display&utm_campaign=1713704-Workspace-DR-APAC-IN-en-DV360-All-Display-SMB-437608681-237692962-GEnterprise-BestWork&utm_content={device}-{adgroupid}-{network}-{targetid}-{loc_physical_ms}-{campaignid}&utm_term={keyword}&gclid=CjwKCAjwvqjOBhAGEiwAngeQnTZ-jqQFZK_tmBnUaWvSCE4181nX2ZhEgRSN935V3Oc_3JZy8t86ghoCq7kQAvD_BwE&dclid=CjgKEAjwvqjOBhDS2LOE0ZvFh00SJAAZVklu5Gt8ElY_NoaKbxVjAA6ApOBPyJT4q0zJO9WPTU5s4_D_BwE&gad_source=7&gad_campaignid=23448625333'
    }
  });
  console.log('Ad patched!');
}

run().finally(() => p.$disconnect());
