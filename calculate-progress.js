const fs = require("fs");
const path = require("path");

// Configuration aligned with project roadmap and development state
const projectAreas = {
  corePlatform: {
    weight: 0.35,
    directories: ["app", "components", "lib", "public"],
    files: [
      "next.config.ts",
      "tailwind.config.ts",
      "tsconfig.json",
      "components.json"
    ],
    features: {
      auth: {
        paths: ["supabase/auth", "middleware.ts"],
        weight: 0.2,
        status: "complete"
      },
      ui: {
        paths: ["components/ui"],
        weight: 0.2,
        status: "complete"
      },
      theme: {
        paths: ["components/theme-provider.tsx"],
        weight: 0.1,
        status: "partial"
      },
      layout: {
        paths: ["components/authenticated-layout.tsx"],
        weight: 0.15,
        status: "partial"
      }
    }
  },
  courseGeneration: {
    weight: 0.25,
    directories: ["app/explore"],
    features: {
      youtubeProcessing: {
        paths: [
          "app/explore/components/course-generation-modal.tsx",
          "app/explore/components/video-analysis-modal.tsx",
          "app/explore/components/video-details-modal.tsx",
          "components/youtube-content-form.tsx"
        ],
        weight: 0.4,
        status: "partial"
      },
      transcriptSystem: {
        paths: ["app/analysis/video-content.tsx"],
        weight: 0.3,
        status: "notStarted"
      },
      aiAnalysis: {
        paths: ["lib/ai"],
        weight: 0.3,
        status: "notStarted"
      }
    }
  },
  learningExperience: {
    weight: 0.15,
    directories: ["app/analysis"],
    features: {
      videoIntegration: {
        paths: ["components/analysis/video-content.tsx"],
        weight: 0.3,
        status: "partial"
      },
      progressTracking: {
        paths: ["hooks/use-analysis-context.tsx"],
        weight: 0.3,
        status: "notStarted"
      },
      contentOrganization: {
        paths: ["components/analysis/header.tsx"],
        weight: 0.4,
        status: "partial"
      }
    }
  },
  dashboard: {
    weight: 0.15,
    features: {
      metrics: {
        paths: ["hooks/use-analysis-panel.ts"],
        weight: 0.4,
        status: "partial"
      },
      courseManagement: {
        paths: ["app/dashboard/page.tsx"],
        weight: 0.6,
        status: "partial"
      }
    }
  },
  documentation: {
    weight: 0.1,
    files: [
      "README.md",
      "docs/DEVELOPMENT_ROADMAP.md",
      "docs/DEVELOPMENT_STATE.md"
    ],
    documentationCoverage: {
      "Project Setup": 0.9,
      "Auth System": 1.0,
      "Theme System": 1.0,
      "Component System": 0.8,
      "API Documentation": 0.0
    }
  }
};

// Base project directory
const baseDir = __dirname;

// Status multipliers for feature completion
const statusMultipliers = {
  complete: 1.0,
  partial: 0.5,
  notStarted: 0.0
};

async function calculateProgress() {
  console.log("Analyzing Tenzzen project completion...\n");

  let totalProgress = 0;
  const results = [];

  for (const [area, config] of Object.entries(projectAreas)) {
    const areaCompletion = await calculateAreaCompletion(area, config);
    const weightedProgress = areaCompletion * config.weight;
    totalProgress += weightedProgress;

    results.push({
      area,
      completion: areaCompletion,
      weighted: weightedProgress,
      details: await getAreaDetails(area, config),
      incompleteFeatures: getIncompleteFeatures(config)
    });
  }

  // Display results
  for (const result of results) {
    console.log(
      `${result.area}: ${Math.round(result.completion * 100)}% complete ` +
      `(weighted: ${Math.round(result.weighted * 100)}%)`
    );
    if (result.details) {
      console.log(result.details);
    }
  }

  const overallProgress = Math.round(totalProgress * 100);
  console.log(`\nOVERALL PROJECT COMPLETION: ${overallProgress}%`);

  // Generate and save detailed report
  const progressData = generateProgressReport(results, overallProgress);
  fs.writeFileSync(path.join(baseDir, "project-progress.txt"), progressData);

  return overallProgress;
}

async function calculateAreaCompletion(area, config) {
  let totalWeight = 0;
  let earnedPoints = 0;

  // Check directories
  if (config.directories) {
    const dirWeight = 0.2;
    totalWeight += dirWeight;
    const existingDirs = config.directories.filter(dir => 
      fs.existsSync(path.join(baseDir, dir))
    ).length;
    earnedPoints += (existingDirs / config.directories.length) * dirWeight;
  }

  // Check files
  if (config.files) {
    const fileWeight = 0.2;
    totalWeight += fileWeight;
    const existingFiles = config.files.filter(file => 
      fs.existsSync(path.join(baseDir, file))
    ).length;
    earnedPoints += (existingFiles / config.files.length) * fileWeight;
  }

  // Check features
  if (config.features) {
    const featureWeight = 0.6;
    totalWeight += featureWeight;
    let featureProgress = 0;

    for (const [, feature] of Object.entries(config.features)) {
      const multiplier = statusMultipliers[feature.status];
      const implementation = feature.paths.some(p => 
        fs.existsSync(path.join(baseDir, p))
      );
      featureProgress += (implementation ? 1 : 0) * multiplier * feature.weight;
    }

    earnedPoints += featureProgress * featureWeight;
  }

  // Special case for documentation
  if (area === 'documentation' && config.documentationCoverage) {
    const coverage = Object.values(config.documentationCoverage);
    const avgCoverage = coverage.reduce((a, b) => a + b, 0) / coverage.length;
    return avgCoverage;
  }

  return totalWeight > 0 ? Math.min(earnedPoints / totalWeight, 1) : 0;
}

async function getAreaDetails(area, config) {
  let details = '\n  Features:\n';

  if (config.features) {
    for (const [name, feature] of Object.entries(config.features)) {
      const implemented = feature.paths.some(p => 
        fs.existsSync(path.join(baseDir, p))
      );
      const status = feature.status;
      details += `  - ${name}: ${implemented ? '✓' : '✗'} (${status})\n`;
    }
  }

  return details;
}

function getIncompleteFeatures(config) {
  if (!config.features) return [];
  
  return Object.entries(config.features)
    .filter(([, feature]) => feature.status !== 'complete')
    .map(([name, feature]) => ({
      name,
      status: feature.status,
      weight: feature.weight
    }))
    .sort((a, b) => b.weight - a.weight);
}

function generateProgressReport(results, overallProgress) {
  const timestamp = new Date().toISOString();
  let report = `Tenzzen Project Progress Report\n`;
  report += `Generated: ${timestamp}\n\n`;
  report += `Overall Progress: ${overallProgress}%\n`;
  report += `Note: This is a weighted calculation based on the current development phase.\n\n`;
  
  // Current Status Section
  report += `Current Status:\n`;
  report += `==============\n\n`;
  
  for (const result of results) {
    report += `${result.area}:\n`;
    report += `  Completion: ${Math.round(result.completion * 100)}%\n`;
    report += `  Weighted Contribution: ${Math.round(result.weighted * 100)}%\n`;
    if (result.details) {
      report += `${result.details}\n`;
    }
  }

  // Next Steps Section
  report += `\nRequired Steps to Complete Implementation:\n`;
  report += `====================================\n\n`;

  // 1. Critical Path Items (Core Platform & Course Generation)
  report += `CRITICAL PATH ITEMS:\n`;
  report += `-----------------\n`;
  report += `1. Core Platform Completion:\n`;
  const corePlatformTasks = results.find(r => r.area === 'corePlatform')?.incompleteFeatures || [];
  corePlatformTasks.forEach(task => {
    report += `   - ${task.status === 'partial' ? 'Complete' : 'Implement'} ${task.name}\n`;
  });
  report += `   - Optimize theme switching performance\n`;
  report += `   - Fix mobile responsive issues\n\n`;

  report += `2. Course Generation Engine:\n`;
  const courseGenTasks = results.find(r => r.area === 'courseGeneration')?.incompleteFeatures || [];
  courseGenTasks.forEach(task => {
    report += `   - ${task.status === 'partial' ? 'Complete' : 'Implement'} ${task.name}\n`;
  });
  report += '\n';

  // Learning Features
  report += `LEARNING FEATURES:\n`;
  report += `----------------\n`;
  const learningTasks = results.find(r => r.area === 'learningExperience')?.incompleteFeatures || [];
  learningTasks.forEach(task => {
    report += `   - ${task.status === 'partial' ? 'Complete' : 'Implement'} ${task.name}\n`;
  });
  report += '\n';

  // Dashboard & Analytics
  report += `DASHBOARD & ANALYTICS:\n`;
  report += `--------------------\n`;
  const dashboardTasks = results.find(r => r.area === 'dashboard')?.incompleteFeatures || [];
  dashboardTasks.forEach(task => {
    report += `   - ${task.status === 'partial' ? 'Complete' : 'Implement'} ${task.name}\n`;
  });
  report += '\n';

  // Technical Improvements
  report += `TECHNICAL IMPROVEMENTS:\n`;
  report += `---------------------\n`;
  report += `   - Fix TypeScript error in video-details-modal.tsx (Set type handling)\n`;
  report += `   - Implement proper error boundaries\n`;
  report += `   - Set up comprehensive testing infrastructure\n`;
  report += `   - Complete API documentation\n`;
  report += `   - Add loading states to async operations\n`;
  report += `   - Optimize course detail modal loading\n\n`;

  // Development Guidelines
  report += `Development Guidelines:\n`;
  report += `---------------------\n`;
  report += `1. Focus on completing partially implemented features before starting new ones\n`;
  report += `2. Prioritize core platform stability and performance improvements\n`;
  report += `3. Implement features in order of user impact and technical dependencies\n`;
  report += `4. Maintain documentation alongside development\n`;
  report += `5. Add tests for completed features before moving to new ones\n\n`;

  report += `Note: Priorities are based on the development roadmap and current project phase.\n`;
  
  return report;
}

// Run the calculation
calculateProgress().catch(console.error);
