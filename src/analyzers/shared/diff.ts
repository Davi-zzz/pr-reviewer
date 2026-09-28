import { CATEGORIES, isNoisePath } from "./signals.ts";

/** ~100k tokens: leaves plenty of room in the context window for the rest of the prompt */
export const DEFAULT_MAX_DIFF_CHARS = 400_000;

export interface PreparedDiff {
  text: string;
  /** Lockfiles / generated files left out on purpose */
  skippedNoise: string[];
  /** Real files left out because the diff was over the size budget */
  omittedForSize: string[];
  truncated: boolean;
}

interface FileSection {
  path: string;
  text: string;
  index: number;
}

/**
 * Drops noise files and, when the diff is still too big, keeps the files in
 * sensitive areas and the smaller ones first. Omitted files are always
 * reported so the model (and the user) know the picture is partial.
 */
export function prepareDiff(diff: string, maxChars = DEFAULT_MAX_DIFF_CHARS): PreparedDiff {
  const sections = splitByFile(diff);
  const skippedNoise = sections.filter((s) => isNoisePath(s.path)).map((s) => s.path);
  const relevant = sections.filter((s) => !isNoisePath(s.path));

  const total = relevant.reduce((sum, s) => sum + s.text.length, 0);
  if (total <= maxChars) {
    return { text: relevant.map((s) => s.text).join(""), skippedNoise, omittedForSize: [], truncated: false };
  }

  const isSensitive = (s: FileSection) => CATEGORIES.some((c) => c.pattern.test(s.path));
  const byPriority = [...relevant].sort(
    (a, b) => Number(isSensitive(b)) - Number(isSensitive(a)) || a.text.length - b.text.length,
  );

  const kept: FileSection[] = [];
  const omittedForSize: string[] = [];
  let used = 0;
  for (const section of byPriority) {
    if (used + section.text.length <= maxChars) {
      kept.push(section);
      used += section.text.length;
    } else {
      omittedForSize.push(section.path);
    }
  }

  kept.sort((a, b) => a.index - b.index);
  return { text: kept.map((s) => s.text).join(""), skippedNoise, omittedForSize, truncated: true };
}

function splitByFile(diff: string): FileSection[] {
  const parts = diff.split(/^(?=diff --git )/m).filter((p) => p.trim());
  return parts.map((text, index) => {
    const header = /^diff --git a\/(.+?) b\/(.+)$/m.exec(text);
    return { path: header?.[2] ?? header?.[1] ?? `(section ${index + 1})`, text, index };
  });
}
