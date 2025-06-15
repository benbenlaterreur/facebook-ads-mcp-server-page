import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { getUserByFacebookId } from '../../../lib/db';
import DataInitializer from '../../../lib/data-initializer';

export async function POST(request) {
  try {
    console.log('🔄 Data initialization started...');
    
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    console.log('📋 Session check:', session ? 'Found' : 'Not found');
    
    if (!session || !session.facebookId) {
      console.log('❌ Unauthorized: No session or Facebook ID');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🆔 Facebook ID:', session.facebookId);

    // Get user from database
    const user = getUserByFacebookId.get(session.facebookId);
    console.log('👤 User lookup:', user ? `Found: ${user.name}` : 'Not found');
    
    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Check if user data is already initialized
    if (user.data_initialized) {
      console.log('✅ User data already initialized');
      return NextResponse.json({
        success: true,
        message: 'User data already initialized',
        alreadyInitialized: true
      });
    }

    console.log('🚀 Starting data initialization for:', user.name);

    // Initialize data silently
    const dataInitializer = new DataInitializer();
    const result = await dataInitializer.initializeUserData(user, user.access_token);

    console.log('✅ Data initialization completed:', result);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Data initialization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize user data',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 