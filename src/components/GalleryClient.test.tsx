import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import GalleryClient from './GalleryClient';
import type { RetreatSeries } from '@/lib/gallery-albums';

const series: RetreatSeries[] = [
  {
    id: 'summit',
    name: 'Summit',
    blurb: 'Annual gathering.',
    albums: [
      {
        id: 'summit-2024',
        title: 'Summit 2024',
        dates: 'Summer 2024',
        year: 2024,
        media: 'photos',
        pendingNote: 'Album coming soon.',
      },
    ],
  },
  {
    id: 'east-coast',
    name: 'East Coast',
    blurb: 'Early summer.',
    albums: [
      {
        id: 'east-coast-2025',
        title: 'East Coast 2025',
        dates: 'Summer 2025',
        year: 2025,
        media: 'photos',
        pendingNote: 'Album coming soon.',
      },
    ],
  },
];

describe('GalleryClient accordion', () => {
  it('server-renders Summit open with connected accordion ARIA attributes', () => {
    const html = renderToStaticMarkup(<GalleryClient series={series} covers={{}} />);

    expect(html).toContain('id="summit-heading"');
    expect(html).toContain('aria-controls="summit-panel"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('id="summit-panel"');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-labelledby="summit-heading"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('id="east-coast-panel"');
  });
});
