import React from 'react';

/**
 * Renders a plain-text description string preserving formatting:
 * - Markdown bold using double asterisks: **text** -> <strong>text</strong>
 * - Bullet points: lines starting with "-" or "*" or "•" are styled as bullet list items
 * - Newlines and multiple/consecutive spaces are preserved
 */
export function renderFormattedDescription(text: string | null | undefined): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <span style={{ display: 'block', whiteSpace: 'pre-wrap', width: '100%' }}>
      {lines.map((line, lineIndex) => {
        let isBullet = false;
        let cleanLine = line;

        // Trim leading spacing for check but preserve it in rendering
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          isBullet = true;
          // Match the list prefix and content
          const match = line.match(/^(\s*)([-*•]\s+)(.*)$/);
          if (match) {
            cleanLine = match[1] + '• ' + match[3];
          }
        }

        // Regex parser to find **bold** tags and convert to <strong>
        const parts: React.ReactNode[] = [];
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;
        let lastIndex = 0;

        while ((match = boldRegex.exec(cleanLine)) !== null) {
          const index = match.index;
          if (index > lastIndex) {
            parts.push(cleanLine.substring(lastIndex, index));
          }
          parts.push(
            <strong key={index} style={{ fontWeight: 700 }}>
              {match[1]}
            </strong>
          );
          lastIndex = boldRegex.lastIndex;
        }

        if (lastIndex < cleanLine.length) {
          parts.push(cleanLine.substring(lastIndex));
        }

        return (
          <span
            key={lineIndex}
            style={{
              display: 'block',
              paddingLeft: isBullet ? '1.25rem' : '0px',
              textIndent: isBullet ? '-0.75rem' : '0px',
              minHeight: line.trim() === '' ? '0.75rem' : 'auto',
            }}
          >
            {parts.length > 0 ? parts : ' '}
          </span>
        );
      })}
    </span>
  );
}
