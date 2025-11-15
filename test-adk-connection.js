// Simple script to test connection to ADK service
const fetch = require('node-fetch');

async function testConnection() {
  try {
    console.log('Testing connection to ADK service...');
    
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:8001/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health check successful:', healthData);
    } else {
      console.error('Health check failed with status:', healthResponse.status);
    }
    
    // Test recommend-videos endpoint
    console.log('\nTesting recommend-videos endpoint...');
    const recommendResponse = await fetch('http://localhost:8001/recommend-videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        query: 'test query',
        knowledgeLevel: 'Beginner',
        preferredChannels: [],
        additionalContext: '',
        videoLength: 'Any',
      }),
    });
    
    if (recommendResponse.ok) {
      const recommendData = await recommendResponse.json();
      console.log('Recommend videos successful:', recommendData);
    } else {
      console.error('Recommend videos failed with status:', recommendResponse.status);
    }
    
  } catch (error) {
    console.error('Error testing connection:', error);
  }
}

testConnection();
