# Analysis Page Layout: Full Details & Code Structure

## 1. High-Level Layout

- The analysis page is a **two-panel layout**:

  - **Left Panel:** Navigation/context (video/playlist info, selection, etc.), implemented as a resizable sidebar.
  - **Right Panel:** Main content (course generation, progress, course panel, transcript, etc.).

- The left panel uses the `ResizablePanel` component for drag-to-resize functionality.

---

## 2. Main Page Composition

### `app/analysis/[video-id]/page.tsx`

- Server component that fetches video/playlist data and passes it to the client component.
- Renders `<AnalysisClient initialContent={...} initialError={...} />`.

### `app/analysis/[video-id]/client.tsx`

- **Client component** that manages all state and UI for the analysis experience.
- Wraps content in `<AnalysisProvider>` for context/state management.
- Renders:
  - `<AnalysisHeader />` (top bar)
  - `<Content initialContent initialError />` (main two-panel layout)

---

## 3. Resizable Panel Implementation

### `components/resizable-panel.tsx`

- Provides a horizontally resizable container for the sidebar.
- Key logic:
  - Uses a `div` with a drag handle (`w-1 cursor-ew-resize`) on the right edge.
  - Mouse events update the width state, constrained by min/max.
  - Notifies parent via `onWidthChange`.

**Usage Example:**

```tsx
<ResizablePanel
  defaultWidth={width}
  minWidth={minWidth}
  maxWidth={maxWidth}
  onWidthChange={setWidth}
  className='h-full'>
  <div className='h-full overflow-auto'>
    <VideoContent loading={loading} error={initialVideoLoadError} />
  </div>
</ResizablePanel>
```

---

## 4. Main Components in Each Panel

### Left Panel: `<VideoContent />`

- Shows video or playlist details, thumbnails, and allows selection.
- Handles playlist expansion, video removal, and opening videos in new tabs.
- Communicates with the main context via `useAnalysis()` to update selected video.

### Right Panel: Main Content Area

- Renders different content based on state:
  - **Course Generation:** Shows progress, errors, or a button to start.
  - **Course Panel:** Shows generated course (via `<CoursePanel />`).
  - **Transcript:** Shows transcript display.
- Uses context state (`showCoursePanel`, `courseData`, etc.) to determine what to render.

---

## 5. Communication & State Management

- **Context:** `useAnalysis` (from `AnalysisProvider`) manages all shared state:
  - Sidebar width, open/close state, selected video, course data, progress, etc.
- **Course Generation:** When the user clicks "Generate Course", the client:
  - Calls the `/api/course-generation/stream` endpoint.
  - Streams progress and partial results, updating UI in real time.
  - On completion, loads the full course and displays it in the right panel.

---

## 6. Rendering Flow

1. **Initial Load:**

   - Server fetches video/playlist, passes to client.
   - Client sets up context and renders header + two-panel layout.

2. **Sidebar (ResizablePanel):**

   - Renders `<VideoContent />` with video/playlist info.
   - User can select videos, expand/collapse, or remove from playlist.

3. **Main Content:**

   - Shows course generation UI, progress, or the generated course.
   - Handles streaming updates and error states.

4. **Responsiveness:**
   - On mobile, the sidebar becomes a bottom sheet (`<MobileSheet />`).

---

## 7. Key Files

- `app/analysis/[video-id]/page.tsx` — Server entry, fetches data.
- `app/analysis/[video-id]/client.tsx` — Main client logic, state, and rendering.
- `components/resizable-panel.tsx` — Resizable sidebar logic.
- `components/analysis/video-content.tsx` — Sidebar content.
- `components/analysis/course-panel.tsx` — Main course display (right panel).
- `hooks/use-analysis-context.ts` — Context for shared state.

---

## 8. Example: How Components Communicate

- **Sidebar selection** updates context (`setVideoData`), which triggers main content to update.
- **Course generation** streams progress and partial data, updating context and UI in real time.
- **ResizablePanel** notifies parent of width changes, which are stored in context for persistence.

---

## 9. Rendering Example (Simplified)

```tsx
<main className="flex-1 relative overflow-hidden">
  <div className="flex h-[calc(100vh-64px)] overflow-hidden">
    {/* Left panel */}
    <ResizablePanel ...>
      <VideoContent ... />
    </ResizablePanel>
    {/* Right panel */}
    <div className="flex-1 min-w-0">
      {showCoursePanel ? <CoursePanel ... /> : <CourseGenerationUI ... />}
    </div>
  </div>
</main>
```

---

---

# Self-Contained Example: Full Two-Panel Resizable Layout (React)

Below is a single-file, self-contained React component that implements the core logic and UI of the analysis page’s two-panel, resizable layout. This file includes the resizable panel logic, sidebar, and main content area, and uses only React and Tailwind CSS (no external dependencies except for icons, which you can replace as needed).

```tsx
// AnalysisLayout.tsx
import React, { useRef, useState, useEffect, useCallback } from "react";

// Simple placeholder icons (replace with your own or a library)
const ChevronDown = () => <span>▼</span>;
const ChevronUp = () => <span>▲</span>;

// ResizablePanel: handles resizing logic for the sidebar
function ResizablePanel({
  defaultWidth = 320,
  minWidth = 240,
  maxWidth = 600,
  onWidthChange,
  className = "",
  children,
}) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizableRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !resizableRef.current) return;
      const newWidth =
        e.clientX - resizableRef.current.getBoundingClientRect().left;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        onWidthChange && onWidthChange(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, onWidthChange]);

  return (
    <div
      ref={resizableRef}
      className={`relative flex-none bg-white border-r ${className}`}
      style={{ width }}>
      {children}
      <div
        className='absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-gray-200 active:bg-gray-300'
        onMouseDown={() => setIsResizing(true)}
        tabIndex={0}
        aria-label='Resize sidebar'
        role='separator'
      />
    </div>
  );
}

// Sidebar: displays navigation/context (replace with your own logic)
function Sidebar({ items, onSelect, selectedId }) {
  return (
    <div className='h-full overflow-auto p-4'>
      <h2 className='font-bold mb-4'>Items</h2>
      <ul className='space-y-2'>
        {items.map((item) => (
          <li
            key={item.id}
            className={`p-2 rounded cursor-pointer ${
              selectedId === item.id ?
                "bg-blue-100 font-semibold"
              : "hover:bg-gray-100"
            }`}
            onClick={() => onSelect(item.id)}>
            {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

// MainContent: displays main analysis content (replace with your own logic)
function MainContent({ selectedItem }) {
  if (!selectedItem) {
    return (
      <div className='flex items-center justify-center h-full text-gray-400'>
        Select an item from the sidebar
      </div>
    );
  }
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>{selectedItem.title}</h1>
      <p className='text-gray-700'>{selectedItem.description}</p>
    </div>
  );
}

// The main layout component
export default function AnalysisLayoutDemo() {
  // Example data
  const [items] = useState([
    { id: 1, title: "Analysis 1", description: "Details for analysis 1..." },
    { id: 2, title: "Analysis 2", description: "Details for analysis 2..." },
    { id: 3, title: "Analysis 3", description: "Details for analysis 3..." },
  ]);
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const selectedItem = items.find((item) => item.id === selectedId);

  // Optional: persist sidebar width in localStorage
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("sidebarWidth");
    return saved ? Number(saved) : 320;
  });
  const handleSidebarWidthChange = useCallback((w) => {
    setSidebarWidth(w);
    localStorage.setItem("sidebarWidth", String(w));
  }, []);

  return (
    <div className='flex h-screen bg-gray-50'>
      <ResizablePanel
        defaultWidth={sidebarWidth}
        minWidth={240}
        maxWidth={500}
        onWidthChange={handleSidebarWidthChange}
        className='shadow'>
        <Sidebar
          items={items}
          onSelect={setSelectedId}
          selectedId={selectedId}
        />
      </ResizablePanel>
      <div className='flex-1 min-w-0 bg-white'>
        <MainContent selectedItem={selectedItem} />
      </div>
    </div>
  );
}
```

**How to use:**

- Copy this file as `AnalysisLayout.tsx` (or any name you like) into your new app.
- Import and render `<AnalysisLayoutDemo />` in your app.
- Replace the `Sidebar` and `MainContent` logic with your own as needed.
- This file is fully self-contained and does not depend on any other files from the original project.

Let me know if you want a version with more advanced features (e.g., mobile drawer, keyboard resizing, etc.)!
