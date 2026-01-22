# Tenzzen Competitive Analysis & Feature Roadmap (2025)

## 1. Competitive Matrix

| Feature               | Tenzzen                                   | NotebookLM               | RemNote                 | StudyFetch            | Mindgrasp                  |
| :-------------------- | :---------------------------------------- | :----------------------- | :---------------------- | :-------------------- | :------------------------- |
| **Core Value**        | YouTube to Course                         | Source-grounded Research | Spaced Repetition Notes | All-in-one Study Aids | Deep Multi-format Analysis |
| **Audio Overview**    | ❌ (Planned)                              | ✅ (Podcasts/Debates)    | ❌                      | ✅ (Audio Recaps)     | ❌                         |
| **Flashcards / SRS**  | ❌ (Quizzes only)                         | ✅ (2.0)                 | ✅ (Gold Standard)      | ✅ (SRS Included)     | ✅                         |
| **Source Mixed**      | 🟡 (YT + Topic + **PDF Support Planned**) | ✅ (PDF, Web, Docs)      | ✅                      | ✅ (Multi-format)     | ✅                         |
| **Material to Video** | ❌ (**Unique Opportunity**)               | ❌                       | ❌                      | ❌                    | ❌                         |
| **AI Tutoring**       | 🟡 (Planned)                              | ✅ (Citations focus)     | 🟡                      | ✅ (Spark.E / Voice)  | ✅                         |
| **Integrations**      | ❌                                        | ✅ (Drive)               | ❌                      | ✅ (Wolfram Alpha)    | ✅ (Canvas/LMS)            |
| **UI Aesthetics**     | ✅ (Modern/Premium)                       | 🟡 (Minimalist)          | ❌ (Complex/Dense)      | ✅ (Modern)           | ✅                         |

---

## 2. Gap Analysis & Strategy

### The "Aha!" Gap: Audio & Multimodal

NotebookLM has recently dominated the AI space with its **Audio Overview** (Podcast format). StudyFetch has followed suit with **Audio Recaps**. Tenzzen can leapfrog by generating "Course Podcasts" that summarize an entire module for on-the-go learning.

### The Retention Gap: Spaced Repetition (SRS)

RemNote's users are fiercely loyal because of SRS. Tenzzen currently generates quizzes on-demand, but if a user doesn't come back to them, they forget. Implementing an **SRS Dashboard** (Anki-style) transforms Tenzzen from a "content generator" to a "learning system."

### The "Reverse" Gap: Material to Video

While competitors like NotebookLM allow PDF uploads, they primarily focus on text-based summaries. Tenzzen's unique strength is its video-first architecture. By allowing users to upload a PDF and then **automatically finding relevant YouTube lectures** to explain that specific PDF, we create a "Reverse Generation" flow that creates a cohesive learning experience from static documents.

---

## 3. High-Impact Feature Proposals

### Phase 1: Quick Wins (Engagement)

1.  **AI Audio Highlights (The "Tenzzen Podcast")**
    - Generate a dialogue-based summary of a course using Gemini.
    - Rationale: High viral potential and great for mobile users.
2.  **Flashcard Deck Generation**
    - Convert AI-generated key points into flashcards automatically.
    - Integration: Export to Anki or Quizlet support.

### Phase 2: Strategic Core (Retention)

1.  **Spaced Repetition Dashboard**
    - A dedicated page to review cards/questions from all enrolled courses.
    - Uses a simple SM-2 algorithm or similar.
2.  **Citations with "Video Sync"**
    - Every AI summary point must link to the exact timestamp in the YouTube video.
    - Rationale: Builds trust and mimics NotebookLM's source-grounding.

### Phase 3: Hybrid Generation & Tracking (User Empowerment)

1.  **Reverse Learning Flow (Material -> Video)**
    - Allow users to upload PDFs/Docs. AI finds relevant YouTube videos and builds a course around both.
2.  **Universal Resource Tracker**
    - A centralized "Library" view where users can track both system-generated courses and their own added documents/videos.
    - Features: "Last studied" timestamps, material categories, and sync status.
3.  **Voice-Based AI Tutor**
    - Use Gemini Live to allow students to "talk through" both video content and uploaded PDF notes together.

---

## 4. Impact vs. Effort Estimation

| Feature                    | Impact    | Effort | Priority |
| :------------------------- | :-------- | :----- | :------- |
| **Audio Highlights**       | High      | Medium | **P0**   |
| **SRS Dashboard**          | Very High | High   | **P0**   |
| **YT Timestamp Citations** | Medium    | Low    | **P1**   |
| **PDF Source Mixing**      | High      | Medium | **P1**   |
| **Gemini Live Tutor**      | Medium    | High   | **P2**   |
