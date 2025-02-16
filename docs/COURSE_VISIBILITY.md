# Course Visibility & Privacy Settings

## 1. Default Settings & Rationale

### Default Visibility Schema
```typescript
interface CourseVisibility {
  mode: 'public' | 'private' | 'unlisted';
  searchable: boolean;
  communityFeatures: boolean;
  allowCloning: boolean;
  creatorAttribution: boolean;
}

const defaultVisibilitySettings: CourseVisibility = {
  mode: 'public',  // Default to public to encourage sharing
  searchable: true,
  communityFeatures: true,
  allowCloning: true,
  creatorAttribution: true
};
```

### Visibility Logic
```typescript
class CourseVisibilityManager {
  async determineInitialVisibility(
    course: Course,
    user: User
  ): Promise<CourseVisibility> {
    // Check user's subscription tier
    if (user.subscription.tier === 'premium') {
      return {
        ...defaultVisibilitySettings,
        mode: user.preferences.defaultVisibility
      };
    }

    // Free tier users get public visibility
    return defaultVisibilitySettings;
  }

  async updateVisibility(
    courseId: string,
    settings: Partial<CourseVisibility>
  ): Promise<void> {
    const course = await this.db.courses.findById(courseId);
    const user = await this.db.users.findById(course.userId);

    // Validate permission to change visibility
    if (!this.canChangeVisibility(course, user)) {
      throw new Error('Premium subscription required for private courses');
    }

    await this.db.courses.update(courseId, {
      visibility: {
        ...course.visibility,
        ...settings
      }
    });
  }
}
```

## 2. Premium Privacy Features

### Private Course Settings
```typescript
interface PrivateCourseSettings {
  accessControl: {
    passwordProtected?: boolean;
    password?: string;
    allowedEmails?: string[];
    expirationDate?: Date;
  };
  sharingOptions: {
    allowSharing: boolean;
    shareableLink?: string;
    linkExpiration?: Date;
  };
  collaborators: {
    canEdit: string[];  // User IDs
    canView: string[];  // User IDs
  };
}

class PrivateCourseManager {
  async createPrivateCourse(
    course: Course,
    settings: PrivateCourseSettings
  ): Promise<Course> {
    // Verify premium subscription
    await this.verifyPremiumAccess(course.userId);

    // Generate shareable link if enabled
    if (settings.sharingOptions.allowSharing) {
      settings.sharingOptions.shareableLink = await this.generateShareableLink(
        course.id
      );
    }

    return this.db.courses.create({
      ...course,
      visibility: {
        mode: 'private',
        settings
      }
    });
  }

  private async generateShareableLink(
    courseId: string
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.db.shareableLinks.create({
      courseId,
      token,
      createdAt: new Date()
    });
    return `${process.env.APP_URL}/shared/${token}`;
  }
}
```

## 3. Public Sharing Incentives

### Community Contribution Program
```typescript
interface ContributionRewards {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  benefits: string[];
}

class CommunityContributions {
  async calculateRewards(
    course: Course
  ): Promise<ContributionRewards> {
    const metrics = await this.getContributionMetrics(course.id);
    
    return {
      points: this.calculatePoints(metrics),
      tier: this.determineTier(metrics),
      benefits: this.getAvailableBenefits(metrics)
    };
  }

  private calculatePoints(metrics: CourseMetrics): number {
    return (
      metrics.uniqueEnrollments * 10 +
      metrics.completions * 20 +
      metrics.positiveRatings * 5 +
      metrics.shares * 2
    );
  }

  private getAvailableBenefits(metrics: CourseMetrics): string[] {
    const benefits = [];
    
    if (metrics.totalPoints >= 1000) {
      benefits.push('Premium Month Access');
    }
    if (metrics.completions >= 100) {
      benefits.push('Featured Course Status');
    }
    if (metrics.positiveRatings >= 50) {
      benefits.push('Creator Badge');
    }

    return benefits;
  }
}
```

### Public Course Promotion
```typescript
class CoursePromotion {
  async promotePublicCourse(courseId: string): Promise<void> {
    const course = await this.db.courses.findById(courseId);
    
    // Boost course visibility in search results
    await this.searchIndex.boost(courseId, {
      factor: 1.5,
      expiration: '7d'
    });

    // Feature in relevant categories
    await this.featuredContent.add(courseId, {
      categories: course.categories,
      duration: '7d'
    });

    // Generate social sharing assets
    const socialAssets = await this.generateSocialAssets(course);
    
    // Update course promotion status
    await this.db.courses.update(courseId, {
      promotion: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assets: socialAssets
      }
    });
  }

  private async generateSocialAssets(
    course: Course
  ): Promise<SocialAssets> {
    return {
      thumbnail: await this.generateThumbnail(course),
      preview: await this.generatePreview(course),
      shareCard: await this.generateShareCard(course)
    };
  }
}
```

### Course Discovery Features
```typescript
interface DiscoveryFeatures {
  searchBoost: boolean;
  featuredPlacement: boolean;
  communitySpotlight: boolean;
  recommendationPriority: number;
}

class CourseDiscovery {
  async enhanceVisibility(
    course: Course
  ): Promise<DiscoveryFeatures> {
    const quality = await this.assessCourseQuality(course);
    const engagement = await this.getEngagementMetrics(course.id);
    
    return {
      searchBoost: quality.score > 0.8,
      featuredPlacement: engagement.completionRate > 0.7,
      communitySpotlight: engagement.ratings > 50,
      recommendationPriority: this.calculatePriority(quality, engagement)
    };
  }

  private async assessCourseQuality(
    course: Course
  ): Promise<QualityMetrics> {
    return {
      contentQuality: await this.analyzeContent(course),
      structureScore: await this.evaluateStructure(course),
      engagementScore: await this.measureEngagement(course),
      completenessScore: await this.checkCompleteness(course)
    };
  }
}
```

This implementation provides a comprehensive course visibility system that encourages public sharing while respecting premium users' privacy needs.