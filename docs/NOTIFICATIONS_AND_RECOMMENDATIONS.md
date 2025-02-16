# Notifications & Course Recommendations

## 1. Notification System

### Notification Types
```typescript
interface NotificationConfig {
  types: {
    courseReminders: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'custom';
      channels: ('in-app' | 'email' | 'push')[];
    };
    assignmentDeadlines: {
      enabled: boolean;
      advanceNotice: number; // days
      channels: ('in-app' | 'email' | 'push')[];
    };
    newContent: {
      enabled: boolean;
      relevanceThreshold: number; // 0-1
      channels: ('in-app' | 'email')[];
    };
    communityUpdates: {
      enabled: boolean;
      frequency: 'daily' | 'weekly';
      channels: ('in-app' | 'email')[];
    };
  };
  preferences: {
    quietHours: {
      enabled: boolean;
      start: string; // HH:mm
      end: string; // HH:mm
      timezone: string;
    };
    batchDelivery: {
      enabled: boolean;
      frequency: 'hourly' | 'daily';
    };
  };
}

// Notification Service Implementation
class NotificationService {
  async scheduleNotification(
    userId: string,
    type: keyof NotificationConfig['types'],
    data: NotificationData
  ): Promise<void> {
    const userPrefs = await this.getUserPreferences(userId);
    if (!this.shouldSendNotification(type, userPrefs)) return;

    const channels = this.getEnabledChannels(type, userPrefs);
    await Promise.all(
      channels.map(channel => this.sendToChannel(channel, data))
    );
  }

  private shouldSendNotification(
    type: string,
    prefs: NotificationConfig
  ): boolean {
    if (!prefs.types[type].enabled) return false;
    if (this.isInQuietHours(prefs)) return false;
    return true;
  }
}
```

### Progress-Based Triggers
```typescript
class ProgressTracker {
  async checkAndNotify(
    userId: string,
    courseId: string,
    progress: number
  ): Promise<void> {
    const triggers = await this.getProgressTriggers(courseId);
    const notifications = triggers
      .filter(trigger => this.shouldTrigger(trigger, progress))
      .map(trigger => this.createNotification(trigger, userId, courseId));

    await this.notificationService.sendBatch(notifications);
  }

  private shouldTrigger(
    trigger: ProgressTrigger,
    progress: number
  ): boolean {
    return (
      progress >= trigger.threshold &&
      !trigger.fired &&
      this.meetsConditions(trigger.conditions)
    );
  }
}
```

## 2. YouTube Integration

### Subscribe Button Management
```typescript
interface ChannelIntegration {
  channelId: string;
  courseCount: number;
  subscriberCount: number;
  subscribeButtonShown: boolean;
}

class YouTubeIntegrationManager {
  async getChannelPresentation(
    channelIds: string[],
    courseId: string
  ): ChannelPresentation[] {
    // Aggregate channel stats
    const stats = await this.getChannelStats(channelIds);
    
    // Apply visibility rules
    return stats.map(channel => ({
      ...channel,
      showSubscribe: this.shouldShowSubscribe(channel),
      presentation: this.getPresentation(channel, courseId)
    }));
  }

  private shouldShowSubscribe(channel: ChannelStats): boolean {
    // Show subscribe button only for channels with:
    // 1. Significant contribution to course content
    // 2. Active content creation
    // 3. Not already heavily represented
    return (
      channel.contentContribution > 0.3 &&
      channel.lastVideoDate > threeMonthsAgo &&
      channel.courseCount < 5
    );
  }
}
```

### Alternative Engagement Strategies
```typescript
class ContentEngagement {
  // 1. Timestamped Bookmarks
  async addBookmark(
    videoId: string,
    timestamp: number,
    note: string
  ): Promise<Bookmark> {
    return this.db.bookmarks.create({
      videoId,
      timestamp,
      note,
      originalUrl: this.getYouTubeUrl(videoId, timestamp)
    });
  }

  // 2. Content Highlights
  async createHighlight(
    videoId: string,
    startTime: number,
    endTime: number,
    comment: string
  ): Promise<Highlight> {
    return this.db.highlights.create({
      videoId,
      startTime,
      endTime,
      comment,
      shareableUrl: this.createShareableUrl(videoId, startTime, endTime)
    });
  }

  // 3. Community Notes
  async addCommunityNote(
    videoId: string,
    timestamp: number,
    note: string
  ): Promise<CommunityNote> {
    return this.db.communityNotes.create({
      videoId,
      timestamp,
      note,
      author: this.currentUser.id,
      visibility: 'public'
    });
  }
}
```

## 3. Course Recommendations

### Recommendation Engine
```typescript
interface RecommendationCriteria {
  userProfile: {
    interests: string[];
    skillLevel: string;
    completedCourses: string[];
    interactionHistory: UserInteraction[];
  };
  courseMetrics: {
    enrollmentCount: number;
    completionRate: number;
    averageRating: number;
    difficulty: string;
  };
  communityMetrics: {
    trendingScore: number;
    relevanceScore: number;
    freshness: number;
  };
}

class CourseRecommender {
  async getRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendedCourse[]> {
    const userProfile = await this.getUserProfile(userId);
    const candidates = await this.getCandidateCourses(userProfile);
    
    const scored = await Promise.all(
      candidates.map(async course => ({
        course,
        score: await this.calculateRelevanceScore(course, userProfile)
      }))
    );

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ course }) => course);
  }

  private async calculateRelevanceScore(
    course: Course,
    profile: UserProfile
  ): Promise<number> {
    const weights = {
      topicRelevance: 0.3,
      skillLevelMatch: 0.2,
      communityRating: 0.15,
      completionRate: 0.15,
      freshness: 0.1,
      trending: 0.1
    };

    return Object.entries(weights).reduce(
      (score, [metric, weight]) =>
        score + this.getMetricScore(course, profile, metric) * weight,
      0
    );
  }
}
```

## 4. Payment Integration for Ghana

### Recommended Payment Providers

1. **PayStack**
```typescript
class PaystackIntegration {
  async initializePayment(amount: number, email: string): Promise<string> {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // amount in pesewas
        currency: 'GHS',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money']
      })
    });

    const data = await response.json();
    return data.data.authorization_url;
  }
}
```

2. **Flutterwave**
```typescript
class FlutterwaveIntegration {
  async createPayment(
    amount: number,
    customer: Customer
  ): Promise<PaymentLink> {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref: this.generateReference(),
        amount,
        currency: 'GHS',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: customer.email,
          phone_number: customer.phone,
          name: customer.name
        },
        customizations: {
          title: 'Tenzzen Premium',
          description: 'Premium Subscription Payment',
          logo: 'https://tenzzen.com/logo.png'
        }
      })
    });

    const data = await response.json();
    return data.data.link;
  }
}
```

### Mobile Money Integration
```typescript
interface MobileMoneyProvider {
  name: 'MTN' | 'Vodafone' | 'AirtelTigo';
  code: string;
  channels: {
    ussd: string;
    qr: boolean;
    push: boolean;
  };
}

class MobileMoneyService {
  async initiatePayment(
    provider: MobileMoneyProvider,
    phone: string,
    amount: number
  ): Promise<PaymentStatus> {
    // Initiate payment through provider's API
    const payment = await this.paymentProvider.initiate({
      provider: provider.code,
      phone,
      amount,
      currency: 'GHS',
      network: provider.name
    });

    // Setup webhook for payment notification
    await this.setupWebhook(payment.id);

    return payment;
  }

  async verifyPayment(paymentId: string): Promise<VerificationResult> {
    const status = await this.paymentProvider.verify(paymentId);
    
    if (status.verified) {
      await this.updateSubscription(status.userId);
    }
    
    return status;
  }
}
```

This implementation provides a comprehensive notification system, engagement strategies, course recommendations, and Ghana-specific payment solutions.