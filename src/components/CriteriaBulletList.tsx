import React from 'react';

interface CriteriaBulletListProps {
  text: string;
  isChanged?: boolean;
  className?: string;
}

/**
 * Parses criteria text into separate bullet items.
 * Handles newlines, bullet symbols (•, ●, -), numbering (1., 2., (1), (2), ข้อ 1), and inline list markers,
 * ensuring that every bullet item always starts on a new line for effortless reading.
 */
export function parseBullets(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Normalize newlines and whitespace
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Split into primary lines
  const rawLines = normalized.split('\n');
  const items: string[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check if line contains multiple bullet markers inline:
    // 1. Multiple bullet symbols: • or ● or ▪
    if (/[•●▪]/.test(trimmed)) {
      const parts = trimmed
        .split(/[•●▪]/)
        .map((p) => p.trim())
        .filter(Boolean);
      items.push(...parts);
      continue;
    }

    // 2. Multiple numbered points: e.g. "1. ... 2. ..." or "(1) ... (2) ..." or "1) ... 2) ..."
    // Match inline numbering pattern like " 2. " or " (2) "
    if (/(?:^|\s)(?:[1-9]\.|\([1-9]\)|[1-9]\))\s+/.test(trimmed)) {
      // Split on positions before numbering markers (except at the very start)
      const parts = trimmed
        .split(/(?=(?:^|\s+)(?:[1-9]\.|\([1-9]\)|[1-9]\)|ข้อ\s*\d+)\s+)/)
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length > 1) {
        items.push(...parts);
        continue;
      }
    }

    // 3. Hyphen / dash bullets:
    // If line has multiple dashes (e.g. "- ผู้ป่วย... - อีกข้อ..." or "ข้อแรก - ข้อสอง")
    if (trimmed.includes(' - ') || trimmed.includes(' – ')) {
      const parts = trimmed
        .split(/\s+[-–]\s+/)
        .map((p) => p.trim().replace(/^[-–]\s*/, ''))
        .filter(Boolean);
      items.push(...parts);
      continue;
    }

    // 4. Semicolon followed by dash or bullet
    if (/;\s*[-–•]/.test(trimmed)) {
      const parts = trimmed
        .split(/;\s*[-–•]\s*/)
        .map((p) => p.trim().replace(/^[-–•]\s*/, ''))
        .filter(Boolean);
      items.push(...parts);
      continue;
    }

    // 5. Single item on this line (clean leading bullet marker)
    const clean = trimmed.replace(/^[-–•*·●▪]\s*/, '').trim();
    if (clean) {
      items.push(clean);
    }
  }

  return items;
}

export const CriteriaBulletList: React.FC<CriteriaBulletListProps> = ({
  text,
  isChanged = false,
  className = '',
}) => {
  const items = parseBullets(text);

  if (items.length === 0) {
    return <span className="text-slate-400 italic text-[13px]">-</span>;
  }

  // Single short item without bullet points or newlines
  if (items.length === 1 && !text.includes('\n') && !/^[-–•*●▪]/.test(text.trim()) && !/^[1-9][\.\)]/.test(text.trim())) {
    return (
      <div
        className={`leading-relaxed text-[14px] ${
          isChanged ? 'text-red-700 font-bold' : 'text-slate-900 font-normal'
        } ${className}`}
      >
        {items[0]}
      </div>
    );
  }

  // Multiple bullet items - each item guaranteed to start on its own new line!
  return (
    <ul className={`space-y-2 list-none m-0 p-0 ${className}`}>
      {items.map((item, idx) => {
        // Detect number prefixes like "1.", "1)", "(1)", "ข้อ 1."
        const numMatch = item.match(/^(\([1-9]\)|[1-9][\.\)]|ข้อ\s*\d+[\.\)]?)\s*(.*)$/);

        return (
          <li
            key={idx}
            className="flex items-start gap-2 text-[14px] leading-relaxed group"
          >
            {numMatch ? (
              <>
                <span
                  className={`inline-flex items-center justify-center font-bold text-[12px] flex-shrink-0 mt-0.5 px-1.5 py-0.2 rounded ${
                    isChanged
                      ? 'text-red-800 bg-red-100 border border-red-300'
                      : 'text-slate-800 bg-slate-100 border border-slate-300'
                  }`}
                >
                  {numMatch[1]}
                </span>
                <span
                  className={`flex-1 ${
                    isChanged ? 'text-red-700 font-bold' : 'text-slate-900 font-normal'
                  }`}
                >
                  {numMatch[2]}
                </span>
              </>
            ) : (
              <>
                {/* Visual bullet dot indicator on a new line */}
                <span
                  className={`inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    isChanged ? 'bg-red-600 ring-1 ring-red-200' : 'bg-slate-600'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`flex-1 ${
                    isChanged ? 'text-red-700 font-bold' : 'text-slate-900 font-normal'
                  }`}
                >
                  {item}
                </span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
};
