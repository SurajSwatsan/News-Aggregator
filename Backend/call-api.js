const axios = require('axios');

async function checkRequests() {
  try {
    const res = await axios.get('http://localhost:3000/onboarding/requests');
    console.log('Pending Requests from API:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error fetching requests:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
}

checkRequests();
