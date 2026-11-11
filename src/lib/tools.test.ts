import { describe, expect, it } from 'vitest';
import { searchTools } from '@/lib/tools';

describe('searchTools', () => {
  it('finds tools by synonyms and task descriptions', () => {
    expect(searchTools('join').map((tool) => tool.slug)).toContain('merge-pdf');
    expect(searchTools('combine multiple PDFs').map((tool) => tool.slug)).toContain('merge-pdf');
  });

  it('matches case-insensitively and ignores surrounding whitespace', () => {
    expect(searchTools('  RESIZE IMAGE  ').map((tool) => tool.slug)).toContain('resize-image');
  });
});
