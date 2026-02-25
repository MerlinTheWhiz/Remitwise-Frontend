import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';

async function getHandler(request: NextRequest, session: string) {
  // TODO: Fetch goals from Soroban savings_goals contract
  return NextResponse.json({ goals: [] });
}

async function postHandler(request: NextRequest, session: string) {
  const body = await request.json();
  // TODO: Create goal in Soroban savings_goals contract
  return NextResponse.json({ success: true });
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
