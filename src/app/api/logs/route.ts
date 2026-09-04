import { NextResponse } from 'next/server';
import { parseLogEntries, getMetricsSummary, formatSummaryMarkdown } from '@/lib/log-parser';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    if (format === 'markdown' || format === 'md') {
      const markdown = await formatSummaryMarkdown();
      return new Response(markdown, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      });
    }

    const summary = await getMetricsSummary();
    const entries = await parseLogEntries(limit);

    return NextResponse.json({
      success: true,
      summary,
      entries,
    });
  } catch (error: unknown) {
    console.error('Error fetching logs:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve logs';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
