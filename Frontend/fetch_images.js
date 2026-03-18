const https = require('https');

https.get('https://brandio.io/envato/iofrm/html/login36.html', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const matches = data.match(/images\/[^\s\"'>]+/g);
    console.log([...new Set(matches)]);
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});
