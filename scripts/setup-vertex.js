#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Color formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Configuration validation rules
const requiredVars = {
  GOOGLE_VERTEX_PROJECT: {
    description: 'Google Cloud Project ID',
    validate: value => /^[a-z][-a-z0-9]{4,28}[a-z0-9]$/.test(value),
    error: 'Project ID must be between 6 and 30 characters, start with a letter, and contain only lowercase letters, numbers, and hyphens'
  },
  GOOGLE_VERTEX_LOCATION: {
    description: 'Vertex AI Location (e.g., us-central1)',
    validate: value => /^[a-z]+-[a-z]+\d+$/.test(value),
    error: 'Location must be a valid Google Cloud region (e.g., us-central1)'
  },
  GOOGLE_CLIENT_EMAIL: {
    description: 'Service Account Email',
    validate: value => /^[a-zA-Z0-9-]+@[a-zA-Z0-9-]+\.iam\.gserviceaccount\.com$/.test(value),
    error: 'Must be a valid service account email address'
  },
  GOOGLE_PRIVATE_KEY: {
    description: 'Service Account Private Key',
    validate: value => value.includes('BEGIN PRIVATE KEY') && value.includes('END PRIVATE KEY'),
    error: 'Must be a valid private key including BEGIN and END markers'
  },
  GOOGLE_PRIVATE_KEY_ID: {
    description: 'Service Account Private Key ID',
    validate: value => /^[a-f0-9]{40}$/.test(value),
    error: 'Must be a 40-character hexadecimal string'
  }
};

async function setupVertex() {
  console.log('\n' + colors.bright + '🔧 Setting up Vertex AI Configuration\n' + colors.reset);

  try {
    const rootDir = process.cwd();
    const envPath = path.join(rootDir, '.env');
    const envExamplePath = path.join(rootDir, '.env.example');

    // Check if .env exists
    if (!fs.existsSync(envPath)) {
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log(colors.green + '📝 Created .env file from .env.example' + colors.reset);
      } else {
        throw new Error('.env.example file not found');
      }
    }

    // Read current .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    // Parse current environment variables
    envContent.split('\n').forEach(line => {
      if (!line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envVars[match[1].trim()] = match[2].trim();
        }
      }
    });

    // Collect and validate variables
    console.log(colors.cyan + '\n📋 Please provide the following information:' + colors.reset);
    for (const [varName, config] of Object.entries(requiredVars)) {
      let value = envVars[varName];
      let isValid = false;

      while (!isValid) {
        if (!value) {
          value = await question(
            `${colors.yellow}${config.description}${colors.reset} (${varName}): `
          );
        }

        if (config.validate(value)) {
          isValid = true;
          envVars[varName] = value;
        } else {
          console.log(colors.red + `❌ ${config.error}` + colors.reset);
          value = null; // Reset to prompt again
        }
      }
    }

    // Update .env file
    const newContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    fs.writeFileSync(envPath, newContent + '\n');

    console.log(colors.green + '\n✅ Configuration updated successfully!' + colors.reset);
    
    // Verify Google Cloud CLI and authentication
    console.log(colors.cyan + '\n🔍 Verifying Google Cloud setup...' + colors.reset);
    
    try {
      execSync('gcloud --version', { stdio: 'ignore' });
      console.log(colors.green + '✓ Google Cloud CLI is installed' + colors.reset);
    } catch (error) {
      console.log(colors.red + '❌ Google Cloud CLI is not installed' + colors.reset);
      console.log('Please install from: https://cloud.google.com/sdk/docs/install');
    }

    console.log(colors.bright + '\n📝 Next steps:' + colors.reset);
    console.log('1. Go to Google Cloud Console and enable the following APIs:');
    console.log('   - Vertex AI API');
    console.log('2. Verify your service account has these roles:');
    console.log('   - Vertex AI User');
    console.log('3. Test your setup with:');
    console.log('   pnpm dev');

    console.log(colors.bright + '\n🎉 Setup complete!' + colors.reset);

  } catch (error) {
    console.error(colors.red + '\n❌ Setup failed:', error.message + colors.reset);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupVertex().catch(error => {
  console.error(colors.red + '\n❌ Unexpected error:', error + colors.reset);
  process.exit(1);
});