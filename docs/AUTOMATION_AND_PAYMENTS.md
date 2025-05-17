# Automation & Payment System Design

## 1. n8n Workflow Automation

### Course Generation Workflow
```typescript
// n8n workflow definition
{
  "nodes": [
    {
      "name": "Course Request Trigger",
      "type": "webhook",
      "parameters": {
        "path": "/courses/generate",
        "authentication": "headerAuth"
      }
    },
    {
      "name": "Extract Video Data",
      "type": "function",
      "parameters": {
        "functionCode": `
          const videoUrl = $input.body.url;
          const videoId = extractVideoId(videoUrl);
          return {
            videoId,
            timestamp: new Date().toISOString()
          };
        `
      }
    },
    {
      "name": "Queue Course Generation",
      "type": "supabase",
      "operation": "insert",
      "parameters": {
        "table": "course_generation_queue",
        "data": "={{ $json }}"
      }
    },
    {
      "name": "Notify User",
      "type": "sendEmail",
      "parameters": {
        "to": "={{ $input.body.email }}",
        "subject": "Course Generation Started",
        "template": "course-generation-started"
      }
    }
  ]
}
```

### Payment Processing Workflow
```typescript
// n8n workflow for subscription management
{
  "nodes": [
    {
      "name": "Stripe Webhook",
      "type": "webhook",
      "parameters": {
        "path": "/stripe/webhook",
        "authentication": "headerAuth"
      }
    },
    {
      "name": "Process Event",
      "type": "switch",
      "parameters": {
        "conditions": [
          {
            "condition": "={{ $input.body.type === 'payment_succeeded' }}",
            "workflow": "activateSubscription"
          },
          {
            "condition": "={{ $input.body.type === 'payment_failed' }}",
            "workflow": "handlePaymentFailure"
          }
        ]
      }
    },
    {
      "name": "Update User Status",
      "type": "supabase",
      "operation": "update",
      "parameters": {
        "table": "users",
        "data": {
          "subscription_status": "={{ $input.body.status }}",
          "updated_at": "={{ $now }}"
        }
      }
    }
  ]
}
```

### Alternative Automation Options

For MVP phase, consider these alternatives to n8n:

1. **Bull Queue + Redis**
```typescript
// Setup queues
const courseQueue = new Bull('course-generation', {
  redis: process.env.REDIS_URL
});

// Process jobs
courseQueue.process(async (job) => {
  const { videoUrl, userId } = job.data;
  try {
    const course = await generateCourse(videoUrl);
    await notifyUser(userId, 'Course ready');
    return course;
  } catch (error) {
    await notifyUser(userId, 'Generation failed');
    throw error;
  }
});
```

2. **Temporal**
```typescript
// Define workflow
async function courseGenerationWorkflow(videoUrl: string, userId: string) {
  try {
    // Step 1: Video analysis
    const analysis = await activities.analyzeVideo(videoUrl);

    // Step 2: Generate course structure
    const structure = await activities.generateStructure(analysis);

    // Step 3: Create supplementary content
    const content = await activities.generateContent(structure);

    // Step 4: Notify user
    await activities.notifyUser(userId, 'Course ready');

    return { structure, content };
  } catch (error) {
    await activities.handleError(error, userId);
    throw error;
  }
}
```

## 2. Freemium Payment System

### Tier Structure
```typescript
interface PricingTier {
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: Feature[];
  limits: UsageLimits;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      {
        name: 'Course Generation',
        description: 'Generate courses from YouTube videos',
        limit: 3,
        period: 'month'
      },
      {
        name: 'Note Taking',
        description: 'Basic note-taking features',
        limit: 'unlimited'
      },
      {
        name: 'Progress Tracking',
        description: 'Track your learning progress',
        limit: 'unlimited'
      }
    ],
    limits: {
      coursesPerMonth: 3,
      notesPerCourse: 50,
      collaborators: 0,
      aiAssistance: 10
    }
  },
  {
    name: 'Pro',
    price: 15,
    interval: 'month',
    features: [
      {
        name: 'Unlimited Courses',
        description: 'Generate unlimited courses',
        limit: 'unlimited'
      },
      {
        name: 'Advanced AI Features',
        description: 'Enhanced learning assistance',
        limit: 'unlimited'
      },
      {
        name: 'Collaboration',
        description: 'Work with other learners',
        limit: 5
      }
    ],
    limits: {
      coursesPerMonth: -1, // unlimited
      notesPerCourse: -1,
      collaborators: 5,
      aiAssistance: -1
    }
  }
];
```

### Usage Tracking
```typescript
class UsageTracker {
  async trackUsage(
    userId: string,
    feature: string,
    quantity: number
  ): Promise<UsageResult> {
    const user = await this.getUser(userId);
    const limits = this.getLimits(user.tier);

    const currentUsage = await this.getCurrentUsage(userId, feature);
    const newUsage = currentUsage + quantity;

    if (this.exceedsLimit(newUsage, limits[feature])) {
      return {
        allowed: false,
        reason: 'limit_exceeded',
        upgrade: this.getUpgradeRecommendation(user.tier, feature)
      };
    }

    await this.recordUsage(userId, feature, quantity);
    return { allowed: true };
  }

  private getUpgradeRecommendation(
    currentTier: string,
    feature: string
  ): UpgradeInfo {
    const nextTier = this.findNextTier(currentTier);
    return {
      tier: nextTier,
      benefits: this.compareTiers(currentTier, nextTier.name),
      savings: this.calculateSavings(nextTier)
    };
  }
}
```

### Payment Processing
```typescript
class PaymentProcessor {
  async handleSubscription(
    userId: string,
    plan: string,
    paymentMethod: string
  ): Promise<SubscriptionResult> {
    try {
      // Create or update Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: userId,
        items: [{ price: this.getPriceId(plan) }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent']
      });

      // Update user's subscription status
      await this.updateUserSubscription(userId, {
        planId: plan,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      };
    } catch (error) {
      this.handlePaymentError(error);
      throw error;
    }
  }

  private async handlePaymentError(error: any): Promise<void> {
    // Log error
    await this.logger.error('Payment Error', {
      error,
      timestamp: new Date()
    });

    // Notify support if needed
    if (this.shouldEscalate(error)) {
      await this.notifySupport(error);
    }
  }
}
```

## 3. Resource Optimization

### Token Usage Optimization
```typescript
class TokenOptimizer {
  optimizePrompt(prompt: string, maxTokens: number): string {
    const tokenCount = this.countTokens(prompt);
    if (tokenCount <= maxTokens) return prompt;

    return this.truncatePrompt(prompt, maxTokens);
  }

  async cacheResponse(key: string, response: string): Promise<void> {
    const hash = this.hashResponse(response);
    await redis.set(
      `response:${key}`,
      hash,
      'EX',
      24 * 60 * 60 // 24 hours
    );
  }

  async getCachedResponse(prompt: string): Promise<string | null> {
    const key = this.hashPrompt(prompt);
    return redis.get(`response:${key}`);
  }
}
```

### Database Optimization
```typescript
class DatabaseOptimizer {
  async optimizeQuery(query: string): Promise<string> {
    const explained = await this.explainQuery(query);
    const optimized = this.suggestOptimizations(explained);
    return optimized;
  }

  private suggestOptimizations(
    explained: QueryExplanation
  ): OptimizationSuggestions {
    return {
      indexes: this.suggestIndexes(explained),
      caching: this.suggestCaching(explained),
      partitioning: this.suggestPartitioning(explained)
    };
  }
}
```

This implementation provides a robust payment and automation system while optimizing resource usage and costs.