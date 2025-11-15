#!/usr/bin/env node

/**
 * ADK Service Launcher
 *
 * This script automates the process of starting the ADK service for the Tenzzen app.
 * It handles checking for required environment variables, starting the Python service,
 * and monitoring its health.
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

// Configuration
const config = {
  // ADK service directory relative to the project root
  adkServiceDir: "./adk_service",
  // Required environment variables for the ADK service
  requiredEnvVars: ["GOOGLE_GENERATIVE_AI_API_KEY", "YOUTUBE_API_KEY"],
  // Command to start the ADK service
  startCommand: "python server.py",
  // Port the ADK service runs on
  port: 8001,
  // Host the ADK service binds to
  host: "0.0.0.0",
  // Number of startup attempts
  maxStartupAttempts: 3,
  // Timeout for health check (ms)
  healthCheckTimeout: 5000,
  // Interval between health checks (ms)
  healthCheckInterval: 2000,
  // Number of health check attempts
  maxHealthCheckAttempts: 5,
};

// Colored console output helpers
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const colorMap = {
    info: colors.blue,
    success: colors.green,
    warn: colors.yellow,
    error: colors.red,
  };
  const color = colorMap[type] || colors.blue;
  console.log(
    `${color}[${timestamp}] [ADK Launcher] ${message}${colors.reset}`
  );
}

// Check if Python is installed
function checkPythonInstallation() {
  try {
    const pythonVersion = execSync("python --version").toString().trim();
    log(`Found Python: ${pythonVersion}`, "info");
    return true;
  } catch (error) {
    log(
      "Python does not appear to be installed or is not in the PATH",
      "error"
    );
    log("Please install Python 3.8+ and try again", "error");
    return false;
  }
}

// Check for required environment variables in .env file
function checkEnvironmentVariables() {
  const envFilePath = path.join(process.cwd(), config.adkServiceDir, ".env");

  // Check if .env file exists
  if (!fs.existsSync(envFilePath)) {
    log(`.env file not found at ${envFilePath}`, "error");
    log("Creating a template .env file...", "info");

    const envTemplate = config.requiredEnvVars
      .map((v) => `${v}=your_${v.toLowerCase()}_here`)
      .join("\n");
    fs.writeFileSync(envFilePath, envTemplate);

    log(`Created template .env file at ${envFilePath}`, "info");
    log(
      "Please fill in the required values in the .env file and run this script again",
      "warn"
    );
    return false;
  }

  // Read and parse .env file
  const envContent = fs.readFileSync(envFilePath, "utf-8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      envVars[key] = value;
    }
  });

  // Check for required variables
  const missingVars = config.requiredEnvVars.filter(
    (v) =>
      !envVars[v] ||
      envVars[v].includes("your_") ||
      envVars[v].includes("INSERT_")
  );

  if (missingVars.length > 0) {
    log(
      `Missing or invalid environment variables: ${missingVars.join(", ")}`,
      "error"
    );
    log("Please update your .env file with valid values", "warn");
    return false;
  }

  log("All required environment variables found in .env file", "success");
  return true;
}

// Check if required Python packages are installed
function checkPythonDependencies() {
  const requirementsPath = path.join(
    process.cwd(),
    config.adkServiceDir,
    "requirements.txt"
  );

  if (!fs.existsSync(requirementsPath)) {
    log("requirements.txt not found", "error");
    return false;
  }

  log("Checking Python dependencies...", "info");
  try {
    // Run pip install with check only flag to verify dependencies are installed
    execSync("pip install -r requirements.txt --dry-run", {
      cwd: path.join(process.cwd(), config.adkServiceDir),
      stdio: "pipe",
    });
    log("All Python dependencies are installed", "success");
    return true;
  } catch (error) {
    log("Some Python dependencies are missing. Installing now...", "warn");
    try {
      execSync("pip install -r requirements.txt", {
        cwd: path.join(process.cwd(), config.adkServiceDir),
        stdio: "inherit",
      });
      log("Python dependencies installed successfully", "success");
      return true;
    } catch (installError) {
      log("Failed to install Python dependencies", "error");
      log(installError.toString(), "error");
      return false;
    }
  }
}

// Check if the ADK service is already running
function checkServiceRunning() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: "localhost",
        port: config.port,
        path: "/health",
        timeout: config.healthCheckTimeout,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              log(
                `ADK service is already running. Status: ${response.status}`,
                "info"
              );
              resolve(true);
            } catch (e) {
              log("ADK service returned invalid JSON response", "warn");
              resolve(false);
            }
          } else {
            log(
              `ADK service health check failed with status code: ${res.statusCode}`,
              "warn"
            );
            resolve(false);
          }
        });
      }
    );

    request.on("error", () => {
      resolve(false);
    });

    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
  });
}

// Start the ADK service
async function startADKService() {
  // Check if service is already running
  const isRunning = await checkServiceRunning();
  if (isRunning) {
    log("ADK service is already running and healthy", "success");
    return true;
  }

  // Start the service
  log("Starting ADK service...", "info");

  const adkProcess = spawn("python", ["server.py"], {
    cwd: path.join(process.cwd(), config.adkServiceDir),
    env: { ...process.env },
    stdio: "pipe",
    detached: true,
  });

  // Log stdout and stderr
  adkProcess.stdout.on("data", (data) => {
    console.log(
      `${colors.cyan}[ADK Service] ${data.toString().trim()}${colors.reset}`
    );
  });

  adkProcess.stderr.on("data", (data) => {
    console.error(
      `${colors.red}[ADK Service Error] ${data.toString().trim()}${
        colors.reset
      }`
    );
  });

  // Handle process exit
  adkProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      log(`ADK service exited with code ${code}`, "error");
    }
  });

  // Detach process so it continues running when this script exits
  adkProcess.unref();

  // Wait for service to become healthy
  log("Waiting for ADK service to become healthy...", "info");
  let healthyService = false;
  let attempts = 0;

  while (!healthyService && attempts < config.maxHealthCheckAttempts) {
    attempts++;
    log(
      `Health check attempt ${attempts}/${config.maxHealthCheckAttempts}...`,
      "info"
    );

    // Wait before checking
    await new Promise((resolve) =>
      setTimeout(resolve, config.healthCheckInterval)
    );

    healthyService = await checkServiceRunning();
  }

  if (healthyService) {
    log("ADK service is running and responding to health checks", "success");
    log(
      `The service is listening at http://localhost:${config.port}`,
      "success"
    );
    log("You can now use the ADK service in your application", "success");
    return true;
  } else {
    log("Failed to verify ADK service health after multiple attempts", "error");
    log("Check the service logs for more details", "error");
    return false;
  }
}

// Main execution
async function main() {
  log("ADK Service Launcher", "info");
  log("------------------------", "info");

  // Run pre-flight checks
  const pythonInstalled = checkPythonInstallation();
  if (!pythonInstalled) return;

  const envVarsSet = checkEnvironmentVariables();
  if (!envVarsSet) return;

  const dependenciesInstalled = checkPythonDependencies();
  if (!dependenciesInstalled) return;

  // Start the ADK service
  const serviceStarted = await startADKService();

  if (serviceStarted) {
    log("ADK service is ready to use", "success");
    log(`Access the API at: http://localhost:${config.port}`, "info");
    log("The service will continue running in the background", "info");
  } else {
    log("Failed to start ADK service", "error");
    log("Please check the logs above for more details", "error");
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  log(`Unexpected error: ${error.message}`, "error");
  process.exit(1);
});
