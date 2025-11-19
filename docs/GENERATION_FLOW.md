# Course Generation Flow: Video Data & Transcript

## Overview

This document details the flow of course generation in the Tenzzen app up to the point of video data retrieval and transcript generation (excluding the AI course outline step). It covers how video and transcript data are fetched, how `youtubei.js` is used, and how the data is displayed in the UI, along with the technologies and configuration involved.

---

## 1. Flow Overview

### Step 1: User Input

- User provides a YouTube URL (video or playlist) via the UI.

### Step 2: URL Parsing

- The backend parses the URL to extract either a video ID or playlist ID using regex patterns.
- If a playlist is detected, the playlist ID is extracted; otherwise, the video ID is extracted.

### Step 3: Fetch Video/Playlist Metadata

- If a playlist ID is present:
  - The backend calls `getPlaylistDetails(playlistId)` to fetch playlist metadata and the list of videos.
  - The first video in the playlist is selected for transcript generation.
- If a video ID is present:
  - The backend calls `getVideoDetails(videoId)` to fetch video metadata (title, description, channel, etc.).
  - This function first checks a Convex cache, then fetches from the YouTube Data API if not cached.
  - The YouTube Data API is called directly using the API key, and the response is parsed for all relevant fields (title, description, thumbnails, channel info, etc.).
  - Channel avatar is fetched with a secondary API call.
  - The result is cached in Convex for future requests.

### Step 4: Transcript Retrieval (with youtubei.js)

- The backend checks for a cached transcript for the video ID.
- If not cached, it calls `getYoutubeTranscript(videoId)`:
  - Uses the `youtubei.js` library (a Node.js implementation of YouTube's internal API) to fetch video info and available caption tracks.
  - Selects the best caption track (preferring English or user-specified language).
  - Calls `getTranscript()` on the video info to retrieve transcript segments.
  - If `youtubei.js` fails, a fallback method scrapes the YouTube video page for caption track data and fetches the transcript XML.
- The transcript is then cached for future requests.
- Transcript segments are returned as an array of `{ text, duration, offset }` and concatenated for further processing.

---

## 2. How Data is Displayed in the UI

- The React component `VideoContent` (in `components/analysis/video-content.tsx`) displays the fetched video or playlist data:
  - For a single video: shows thumbnail, title, channel, duration, views, likes, publish date, and description.
  - For a playlist: shows playlist info and a list of videos, each with thumbnail and metadata.
  - Users can expand/collapse video details, open videos in a new tab, or remove videos from the playlist view.
- The transcript (once fetched) is displayed in a transcript viewer component, showing the full text and optionally segmented by timestamps.
- All data is managed via React context (`useAnalysis`) for state sharing between sidebar and main content.

---

## 3. Technologies Used

### Next.js 15 (App Router)

- Handles API routes and server actions.
- Provides the main application structure.
- Configuration: See `next.config.js` and `app/` directory.

### Convex

- Used for backend data storage and serverless functions.
- Handles queries and mutations for course and video data, and caches video/transcript data.
- Configuration: See `convex/` directory and `convex.json`.

### Clerk

- Provides authentication and user management.
- Used to secure API endpoints and associate data with users.
- Configuration: See `convex/auth.config.ts` and Clerk setup in `middleware.ts`.

### YouTube Data Fetching

- **YouTube Data API v3**: Used for fetching video and channel metadata (title, description, thumbnails, stats, etc.).
- **youtubei.js**: Used for robust transcript fetching, bypassing some YouTube API limitations and supporting auto-generated captions.
  - See [`actions/getYoutubeTranscript.ts`](../../actions/getYoutubeTranscript.ts) for usage.
- **Fallback Scraping**: If `youtubei.js` fails, the system scrapes the YouTube video page for caption track data and fetches the transcript XML directly.
- **Caching**: Implemented in Convex and/or in-memory to avoid redundant fetches.

---

## 4. Configuration Details

- **Environment Variables:**
  - YouTube API keys and Convex/Clerk credentials are set in `.env.local`.
- **Convex:**
  - Convex server must be running before the frontend (`pnpm convex`).
  - All queries are indexed in `convex/schema.ts`.
- **Clerk:**
  - Clerk is initialized in the app and used in both frontend and backend for authentication.
- **youtubei.js:**
  - Installed as a dependency (`youtubei.js`).
  - No API key required; works by emulating YouTube's internal API.
- **Transcript Caching:**
  - Transcripts are cached in Convex or in-memory to avoid redundant fetches.

---

## 5. Example Sequence

1. User submits a YouTube URL.
2. API parses the URL and determines if it's a video or playlist.
3. Metadata is fetched for the video or playlist (with caching and fallback logic).
4. Transcript is retrieved using `youtubei.js` (with fallback scraping if needed).
5. Data is now ready for AI course generation (not covered here).

---

---

# 6. Essential Code Snippets & Instructions (for Porting)

Below are the most important code snippets and clear instructions to fetch and display YouTube video and transcript data in any app, without relying on the original codebase.

## A. Fetching YouTube Video Metadata (with YouTube Data API v3)

```js
// Fetch video metadata from YouTube Data API v3
async function fetchYoutubeVideoData(videoId, apiKey) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch video data");
  const data = await res.json();
  if (!data.items || !data.items[0]) throw new Error("Video not found");
  const video = data.items[0];
  // Parse ISO 8601 duration (e.g., PT1H2M3S)
  function parseDuration(iso) {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const h = m[1] ? parseInt(m[1]) : 0,
      min = m[2] ? parseInt(m[2]) : 0,
      s = m[3] ? parseInt(m[3]) : 0;
    return h > 0 ?
        `${h}:${min.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${min}:${s.toString().padStart(2, "0")}`;
  }
  return {
    id: videoId,
    title: video.snippet.title,
    description: video.snippet.description,
    thumbnail: video.snippet.thumbnails.high.url,
    duration: parseDuration(video.contentDetails.duration),
    channelId: video.snippet.channelId,
    channelName: video.snippet.channelTitle,
    views: video.statistics.viewCount,
    likes: video.statistics.likeCount,
    publishDate: video.snippet.publishedAt,
  };
}
```

## B. Fetching YouTube Transcript (with youtubei.js)

Install youtubei.js:

```bash
pnpm add youtubei.js
# or
npm install youtubei.js
```

```js
// Fetch transcript using youtubei.js
const { Innertube } = require("youtubei.js");

async function fetchYoutubeTranscript(videoId, language = "en") {
  const youtube = await Innertube.create({ lang: language, location: "US" });
  const info = await youtube.getInfo(videoId);
  if (!info.captions) throw new Error("No captions available");
  const tracks = info.captions.caption_tracks;
  const track = tracks.find((t) => t.language_code === language) || tracks[0];
  const transcriptInfo = await info.getTranscript();
  const segments =
    transcriptInfo.transcript?.content?.body?.initial_segments || [];
  return segments.map((item) => ({
    text: item.snippet?.text || "",
    duration:
      parseFloat(item.end_ms) / 1000 - parseFloat(item.start_ms) / 1000 || 0,
    offset: parseFloat(item.start_ms) / 1000 || 0,
  }));
}
```

## C. Displaying Video and Transcript Data (React Example)

```jsx
// Video display component
function VideoPanel({ video }) {
  if (!video) return <div>No video loaded</div>;
  return (
    <div>
      <img src={video.thumbnail} alt={video.title} style={{ width: 320 }} />
      <h2>{video.title}</h2>
      <p>{video.description}</p>
      <div>Duration: {video.duration}</div>
      <div>Channel: {video.channelName}</div>
      <div>
        Views: {video.views} | Likes: {video.likes}
      </div>
      <div>Published: {new Date(video.publishDate).toLocaleDateString()}</div>
    </div>
  );
}

// Transcript display component
function TranscriptPanel({ transcript }) {
  if (!transcript || transcript.length === 0)
    return <div>No transcript available</div>;
  return (
    <div
      style={{
        maxHeight: 300,
        overflowY: "auto",
        background: "#f9f9f9",
        padding: 12,
      }}>
      {transcript.map((seg, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <span style={{ color: "#888", fontSize: 12 }}>
            {seg.offset.toFixed(1)}s:{" "}
          </span>
          {seg.text}
        </div>
      ))}
    </div>
  );
}
```

## D. Usage Instructions

1. Obtain a YouTube Data API v3 key from Google Cloud Console.
2. Install `youtubei.js` in your project.
3. Use the `fetchYoutubeVideoData` function to get video metadata.
4. Use the `fetchYoutubeTranscript` function to get transcript segments.
5. Display the data using the provided React components or your own UI.

---

**These snippets are all you need to fetch and display YouTube video and transcript data in any app, without dependencies on the original Tenzzen codebase.**
