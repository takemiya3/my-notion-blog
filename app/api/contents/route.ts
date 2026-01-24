import { NextResponse } from 'next/server';
import { getContents } from '@/lib/notion';

export async function GET() {
  try {
    const contents = await getContents();
    return NextResponse.json(contents);
  } catch (error) {
    console.error('Error fetching contents:', error);
    return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 });
  }
}