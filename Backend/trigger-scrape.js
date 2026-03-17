const axios = require('axios');

async function trigger() {
  try {
    const res = await axios.post('http://localhost:3000/scrape/trigger');
    console.log('Response:', res.data);
  } catch (err) {
    console.error('Error triggering scrape. Is the server running?');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    }
  }
}

trigger();
