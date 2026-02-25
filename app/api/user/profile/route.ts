import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';

async function handler(request: NextRequest, session: string) {
  // TODO: Fetch user profile from database using session
  return NextResponse.json({ 
    publicKey: session,
    // Add other profile fields
  });
}

export const GET = withAuth(handler);
