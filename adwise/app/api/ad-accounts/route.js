import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { getUserByFacebookId, getAdAccountsByUserId } from '../../../lib/db';

export async function GET() {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = getUserByFacebookId.get(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get ad accounts from database (cached data)
    const adAccounts = getAdAccountsByUserId.all(user.id);
    
    // Transform to match frontend expectations
    const transformedAccounts = adAccounts.map(account => ({
      id: account.account_id,
      name: account.account_name || `Account ${account.account_id}`,
      currency: account.currency || 'USD'
    }));

    return NextResponse.json({
      adAccounts: transformedAccounts,
      cached: true,
      dataInitialized: user.data_initialized || false
    });

  } catch (error) {
    console.error('Ad accounts API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch ad accounts',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 