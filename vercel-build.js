// vercel-build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute shell commands
function exec(command) {
  try {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

// Main build function
async function build() {
  console.log('Starting Vercel build process...');
  
  // Install dependencies
  console.log('Installing dependencies...');
  exec('pnpm install --no-frozen-lockfile');
  
  // Build Next.js app
  console.log('Building Next.js application...');
  exec('pnpm run build');
  
  console.log('Build completed successfully!');
}

// Run the build
build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
