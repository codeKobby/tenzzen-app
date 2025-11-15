// Simple script to test connection to ADK service directly
const http = require('http');

// Function to make a direct HTTP request without using fetch
function makeDirectRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, headers: res.headers, data: parsedData });
        } catch (e) {
          console.log('Response is not JSON:', responseData.substring(0, 200));
          resolve({ statusCode: res.statusCode, headers: res.headers, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      reject(error);
    });
    
    // Set a timeout for the request
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Request timed out'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testConnection() {
  try {
    console.log('Testing connection to ADK service using direct HTTP request...');
    
    // Test health endpoint
    console.log('\nTesting health endpoint...');
    const healthOptions = {
      hostname: '127.0.0.1',
      port: 8001,
      path: '/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };
    
    try {
      const healthResult = await makeDirectRequest(healthOptions);
      console.log('Health check successful:', healthResult.data);
    } catch (error) {
      console.error('Health check failed:', error.message);
    }
    
    // Test recommend-videos endpoint
    console.log('\nTesting recommend-videos endpoint...');
    const recommendOptions = {
      hostname: '127.0.0.1',
      port: 8001,
      path: '/recommend-videos',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000',
      }
    };
    
    const recommendData = {
      query: 'test query',
      knowledgeLevel: 'Beginner',
      preferredChannels: [],
      additionalContext: '',
      videoLength: 'Any',
    };
    
    try {
      const recommendResult = await makeDirectRequest(recommendOptions, recommendData);
      console.log('Recommend videos successful:', recommendResult.data);
    } catch (error) {
      console.error('Recommend videos failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error testing connection:', error);
  }
}

testConnection();
