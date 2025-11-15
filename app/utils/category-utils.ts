/**
 * Utility functions for normalizing and managing course categories
 */

// Define top-level categories and their related technologies/subcategories
const CATEGORY_MAPPINGS: Record<string, string[]> = {
  // Programming & Development Categories
  "Web Development": [
    "frontend", "front-end", "front end", "backend", "back-end", "back end", 
    "fullstack", "full-stack", "full stack", "web", "html", "css", "javascript", 
    "js", "typescript", "ts", "react", "angular", "vue", "svelte", "node", 
    "express", "nextjs", "next.js", "gatsby", "php", "laravel", "django", 
    "flask", "ruby", "rails", "asp.net", "jquery", "bootstrap", "tailwind",
    "web design", "responsive design", "spa", "pwa", "jamstack", "static site"
  ],
  
  "Mobile Development": [
    "mobile", "android", "ios", "swift", "objective-c", "kotlin", "java", 
    "react native", "flutter", "dart", "xamarin", "ionic", "cordova", 
    "phonegap", "mobile app", "app development", "cross-platform", 
    "native app", "hybrid app", "mobile ui", "mobile ux", "mobile design",
    "progressive web app", "pwa", "mobile web", "responsive"
  ],
  
  "Game Development": [
    "game", "unity", "unreal", "godot", "gamemaker", "c#", "c++", 
    "3d game", "2d game", "game design", "game mechanics", "game physics",
    "game programming", "game art", "game audio", "game animation",
    "game engine", "game development", "game dev"
  ],
  
  "Data Science": [
    "data science", "data analysis", "data analytics", "data visualization", 
    "big data", "machine learning", "ml", "ai", "artificial intelligence", 
    "deep learning", "neural networks", "nlp", "natural language processing",
    "computer vision", "cv", "data mining", "statistical analysis", "statistics",
    "predictive modeling", "data engineering", "etl", "data warehouse",
    "business intelligence", "bi", "tableau", "power bi", "data studio",
    "pandas", "numpy", "scipy", "scikit-learn", "tensorflow", "pytorch",
    "keras", "r programming", "r language", "data science", "data scientist"
  ],
  
  "DevOps & Cloud": [
    "devops", "cloud", "aws", "azure", "gcp", "google cloud", "cloud computing",
    "docker", "kubernetes", "k8s", "containerization", "ci/cd", "continuous integration",
    "continuous deployment", "continuous delivery", "jenkins", "gitlab", "github actions",
    "infrastructure as code", "iac", "terraform", "ansible", "chef", "puppet",
    "monitoring", "logging", "observability", "sre", "site reliability", "devsecops",
    "cloud native", "microservices", "serverless", "lambda", "functions"
  ],
  
  "Cybersecurity": [
    "security", "cybersecurity", "cyber security", "network security", "web security",
    "application security", "appsec", "penetration testing", "pen testing", "ethical hacking",
    "vulnerability assessment", "security audit", "cryptography", "encryption",
    "authentication", "authorization", "identity management", "iam", "security operations",
    "soc", "incident response", "forensics", "malware analysis", "threat intelligence",
    "security architecture", "zero trust", "compliance", "gdpr", "hipaa", "pci"
  ],
  
  "Blockchain & Cryptocurrency": [
    "blockchain", "crypto", "cryptocurrency", "bitcoin", "ethereum", "solidity",
    "smart contracts", "web3", "decentralized", "defi", "nft", "token", "mining",
    "consensus", "distributed ledger", "dapp", "dao", "decentralized finance"
  ],
  
  // Business & Professional Categories
  "Business": [
    "business", "entrepreneurship", "startup", "management", "leadership",
    "strategy", "marketing", "sales", "finance", "accounting", "economics",
    "business model", "business plan", "business analysis", "business intelligence",
    "business development", "business strategy", "business management"
  ],
  
  "Design": [
    "design", "ui", "ux", "user interface", "user experience", "graphic design",
    "web design", "product design", "visual design", "interaction design",
    "design thinking", "design system", "typography", "color theory", "layout",
    "wireframing", "prototyping", "figma", "sketch", "adobe xd", "illustrator",
    "photoshop", "indesign", "after effects", "motion design", "3d design"
  ],
  
  // General/Other Categories
  "General": [
    "general", "basics", "fundamentals", "introduction", "beginner", "101",
    "getting started", "overview", "survey", "primer", "foundation"
  ]
};

/**
 * Normalizes a category name to a top-level category
 * @param categoryName The original category name
 * @param tags Optional array of tags to help determine the category
 * @returns Normalized top-level category name
 */
export function normalizeCategory(categoryName: string, tags: string[] = []): string {
  if (!categoryName) return "General";
  
  const normalizedInput = categoryName.toLowerCase().trim();
  
  // First check if the category name is already a top-level category
  if (Object.keys(CATEGORY_MAPPINGS).map(c => c.toLowerCase()).includes(normalizedInput)) {
    // Return the properly cased version
    return Object.keys(CATEGORY_MAPPINGS).find(
      c => c.toLowerCase() === normalizedInput
    ) || categoryName;
  }
  
  // Check if the category name matches any of the subcategories
  for (const [topCategory, subcategories] of Object.entries(CATEGORY_MAPPINGS)) {
    if (subcategories.some(sub => normalizedInput.includes(sub))) {
      return topCategory;
    }
  }
  
  // If no match found in category name, check tags
  if (tags.length > 0) {
    const normalizedTags = tags.map(tag => tag.toLowerCase().trim());
    
    for (const [topCategory, subcategories] of Object.entries(CATEGORY_MAPPINGS)) {
      if (normalizedTags.some(tag => 
        subcategories.some(sub => tag.includes(sub) || sub.includes(tag))
      )) {
        return topCategory;
      }
    }
  }
  
  // If still no match, return the original category or "General" if it's empty
  return categoryName || "General";
}

/**
 * Determines the most appropriate category based on tags and existing category
 * @param tags Array of tags associated with the course
 * @param existingCategory Optional existing category
 * @returns The most appropriate category
 */
export function determineCategoryFromTags(
  tags: string[] = [], 
  existingCategory?: string
): string {
  // If there are no tags and no existing category, return "General"
  if (tags.length === 0 && !existingCategory) {
    return "General";
  }
  
  // If there are no tags but there is an existing category, normalize it
  if (tags.length === 0 && existingCategory) {
    return normalizeCategory(existingCategory);
  }
  
  // If there are tags, try to determine the category from them
  // First, check if any tag directly matches a top-level category
  const normalizedTags = tags.map(tag => tag.toLowerCase().trim());
  
  for (const topCategory of Object.keys(CATEGORY_MAPPINGS)) {
    if (normalizedTags.includes(topCategory.toLowerCase())) {
      return topCategory;
    }
  }
  
  // If no direct match, use the normalizeCategory function with both tags and existing category
  return normalizeCategory(existingCategory || "", tags);
}
