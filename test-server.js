// Simple HTTP server to test if requests are being sent
const http = require('http');

// Create a server that logs all incoming requests
const server = http.createServer((req, res) => {
  console.log('=== INCOMING REQUEST ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Headers: ${JSON.stringify(req.headers)}`);
  
  // Collect request body
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    if (body) {
      console.log(`Body: ${body}`);
      try {
        const jsonBody = JSON.parse(body);
        console.log(`Parsed JSON Body: ${JSON.stringify(jsonBody, null, 2)}`);
      } catch (e) {
        console.log('Body is not valid JSON');
      }
    }
    
    // Respond based on the endpoint
    if (req.url === '/health') {
      // Return a health check response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'Test Server',
        timestamp: Date.now()
      }));
    } else if (req.url === '/recommend-videos') {
      // Return a mock video recommendation response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        recommendations: [
          {
            videoId: 'test123',
            title: 'Test Video',
            channelName: 'Test Channel',
            relevanceScore: 9.5
          }
        ]
      }));
    } else if (req.url === '/generate-course') {
      // Return a mock course generation response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        title: 'Test Course',
        description: 'This is a test course',
        courseItems: [
          {
            type: 'section',
            title: 'Section 1',
            items: [
              {
                type: 'lesson',
                title: 'Lesson 1',
                content: 'This is lesson 1'
              }
            ]
          }
        ]
      }));
    } else {
      // Return a 404 for unknown endpoints
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Endpoint not found'
      }));
    }
    
    console.log('=== END REQUEST ===');
  });
});

// Start the server on port 3001
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('This server will log all incoming requests and respond with mock data');
  console.log('Available endpoints:');
  console.log('  - /health');
  console.log('  - /recommend-videos');
  console.log('  - /generate-course');
});
