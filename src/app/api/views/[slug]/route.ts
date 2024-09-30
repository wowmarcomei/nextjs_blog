import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const viewsFile = path.join(dataDir, 'views.json');

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function getViews(): Record<string, number> {
  ensureDirectoryExistence(viewsFile);
  if (!fs.existsSync(viewsFile)) {
    fs.writeFileSync(viewsFile, '{}', 'utf8');
    return {};
  }
  const data = fs.readFileSync(viewsFile, 'utf8');
  return JSON.parse(data);
}

function saveViews(views: Record<string, number>) {
  ensureDirectoryExistence(viewsFile);
  fs.writeFileSync(viewsFile, JSON.stringify(views, null, 2), 'utf8');
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;

  try {
    const views = getViews();
    views[slug] = (views[slug] || 0) + 1;
    saveViews(views);

    return NextResponse.json({ views: views[slug] });
  } catch (error) {
    console.error('Error updating view count:', error);
    return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  return GET(request, { params });
}