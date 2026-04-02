const dns = require('dns');
const https = require('https');

const hosts = ['www.google.com', 'www.bbc.com', 'rss.cnn.com'];

console.log('--- Network Diagnosis Start ---');

hosts.forEach(host => {
  dns.lookup(host, (err, address, family) => {
    if (err) {
      console.error(`❌ DNS Lookup failed for ${host}: ${err.code} (${err.message})`);
    } else {
      console.log(`✅ DNS Lookup success for ${host}: ${address} (family: ${family})`);
    }
  });
});

const testUrl = 'https://www.google.com';
https.get(testUrl, (res) => {
  console.log(`✅ HTTP Request to ${testUrl}: Status ${res.statusCode}`);
}).on('error', (e) => {
  console.error(`❌ HTTP Request to ${testUrl} failed: ${e.message}`);
});

setTimeout(() => {
  console.log('--- Diagnosis Complete ---');
  console.log('If you see only red (❌), your backend server has no internet access or broken DNS.');
  console.log('If you see green (✅), the issue might be specific to the RSS Sync service settings.');
}, 5000);
