/**
 * This script fixes the Supabase binary installation issues on Windows
 * It creates a dummy binary file if the actual binary is missing
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Only run this fix on Windows
const isWindows = os.platform() === 'win32';

function fixSupabaseBinary() {
  if (!isWindows) {
    console.log('Not on Windows, skipping Supabase binary fix');
    return;
  }

  try {
    // Check if we have the Supabase package installed
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    const supabasePath = path.join(nodeModulesPath, 'supabase');
    
    if (!fs.existsSync(supabasePath)) {
      console.log('Supabase package not found, skipping binary fix');
      return;
    }

    // Create the bin directory if it doesn't exist
    const binPath = path.join(supabasePath, 'bin');
    if (!fs.existsSync(binPath)) {
      fs.mkdirSync(binPath, { recursive: true });
      console.log('Created Supabase bin directory');
    }

    // Create a dummy supabase.EXE file if it doesn't exist
    const binaryPath = path.join(binPath, 'supabase.EXE');
    if (!fs.existsSync(binaryPath)) {
      // Create a simple batch file that shows a message
      const batchContent = `@echo off
echo This is a placeholder for the Supabase CLI.
echo For full functionality, please install the Supabase CLI manually:
echo https://supabase.com/docs/guides/cli/getting-started
exit /b 0
`;
      fs.writeFileSync(binaryPath, batchContent);
      console.log('Created placeholder Supabase binary');
    }

    // Fix the .bin symlink
    const binLinkPath = path.join(nodeModulesPath, '.bin', 'supabase');
    if (!fs.existsSync(binLinkPath)) {
      // Create a .cmd file that points to our dummy binary
      const cmdPath = `${binLinkPath}.cmd`;
      const cmdContent = `@echo off
"${binaryPath}" %*
`;
      fs.writeFileSync(cmdPath, cmdContent);
      console.log('Created Supabase bin link');
    }

    console.log('Supabase binary fix completed successfully');
  } catch (error) {
    console.error('Error fixing Supabase binary:', error);
  }
}

// Run the fix
fixSupabaseBinary();
