import type { TranscriptSegmentLike } from "@/lib/server/transcript-cache";

export interface PromptTranscriptChunk {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  tokenEstimate: number;
}

export interface PromptTranscriptContext {
  chunks: PromptTranscriptChunk[];
  fullText: string;
  totalDurationSeconds: number;
  totalSegments: number;
}

interface BuildContextOptions {
  transcriptSegments?: TranscriptSegmentLike[];
  fallbackTranscript?: string;
  chunkCharTarget?: number;
  minSegmentsPerChunk?: number;
}

const DEFAULT_CHUNK_CHAR_TARGET = 8000;
const DEFAULT_MIN_SEGMENTS = 40;

export const formatSecondsAsTimestamp = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "0:00";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const coerceSegments = (
  segments?: TranscriptSegmentLike[],
  fallbackTranscript?: string
): TranscriptSegmentLike[] => {
  if (segments && segments.length > 0) {
    return segments;
  }

  if (!fallbackTranscript) {
    return [];
  }

  return fallbackTranscript
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .map((text, index) => ({
      text,
      offset: index * 5,
      duration: 5,
    }));
};

export const buildPromptTranscriptContext = (
  options: BuildContextOptions
): PromptTranscriptContext => {
  const chunkCharTarget = options.chunkCharTarget ?? DEFAULT_CHUNK_CHAR_TARGET;
  const minSegments = options.minSegmentsPerChunk ?? DEFAULT_MIN_SEGMENTS;

  const segments = coerceSegments(
    options.transcriptSegments,
    options.fallbackTranscript
  );

  if (segments.length === 0) {
    return {
      chunks: [],
      fullText: "",
      totalDurationSeconds: 0,
      totalSegments: 0,
    };
  }

  const chunkAccumulator: PromptTranscriptChunk[] = [];
  let currentText: string[] = [];
  let currentStart = segments[0]?.offset ?? segments[0]?.start ?? 0;
  let currentEnd = currentStart;
  let currentChars = 0;
  let chunkIndex = 0;

  const flushChunk = () => {
    if (currentText.length === 0) return;

    const text = currentText.join(" ").trim();
    const tokenEstimate = Math.max(1, Math.round(text.split(/\s+/).length * 1.35));

    chunkAccumulator.push({
      index: chunkIndex,
      startSeconds: currentStart,
      endSeconds: currentEnd,
      text,
      tokenEstimate,
    });

    chunkIndex += 1;
    currentText = [];
    currentChars = 0;
    currentStart = currentEnd;
  };

  segments.forEach((segment, idx) => {
    const text = segment.text?.trim();
    if (!text) return;

    const segmentStart = segment.offset ?? segment.start ?? currentEnd;
    const segmentEnd = segmentStart + (segment.duration ?? 0);
    const formatted = `[${formatSecondsAsTimestamp(segmentStart)}] ${text}`;

    const exceedsCharBudget =
      currentChars + formatted.length > chunkCharTarget &&
      currentText.length >= minSegments;

    if (exceedsCharBudget) {
      flushChunk();
      currentStart = segmentStart;
    }

    currentText.push(formatted);
    currentChars += formatted.length;
    currentEnd = Math.max(currentEnd, segmentEnd || segmentStart);

    // Flush trailing chunk at end of loop
    if (idx === segments.length - 1) {
      flushChunk();
    }
  });

  // Guard for cases where flush never called due to low segment count
  if (chunkAccumulator.length === 0 && currentText.length > 0) {
    flushChunk();
  }

  const fullText = chunkAccumulator
    .map(
      (chunk) =>
        `### TRANSCRIPT CHUNK ${chunk.index + 1} | ${formatSecondsAsTimestamp(
          chunk.startSeconds
        )} - ${formatSecondsAsTimestamp(chunk.endSeconds)} | ~${chunk.tokenEstimate} tokens\n${chunk.text}`
    )
    .join("\n\n");

  return {
    chunks: chunkAccumulator,
    fullText,
    totalDurationSeconds: chunkAccumulator[chunkAccumulator.length - 1]?.endSeconds ?? 0,
    totalSegments: segments.length,
  };
};
