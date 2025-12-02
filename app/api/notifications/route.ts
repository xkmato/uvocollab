import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CreateNotificationData, Notification } from '@/app/types/notification';

/**
 * GET /api/notifications
 * Fetch notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limitCount = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build query
    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (unreadOnly) {
      q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const notifications: Notification[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate(),
      } as Notification;
    });

    // Filter out expired notifications
    const validNotifications = notifications.filter(n => 
      !n.expiresAt || n.expiresAt > new Date()
    );

    return NextResponse.json({ notifications: validNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const data: CreateNotificationData = await request.json();

    const { userId, type, title, message, actionUrl, actionText, expiresAt, metadata } = data;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notificationData = {
      userId,
      type,
      title,
      message,
      actionUrl: actionUrl || null,
      actionText: actionText || null,
      read: false,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
      metadata: metadata || {},
    };

    const notificationRef = await addDoc(
      collection(db, 'notifications'),
      notificationData
    );

    return NextResponse.json({
      success: true,
      notificationId: notificationRef.id,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const { notificationIds, userId } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update each notification
    const updatePromises = notificationIds.map(async (notificationId) => {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      updatedCount: notificationIds.length,
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Mark all notifications as read for a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all unread notifications for user
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    
    // Mark all as read
    const updatePromises = snapshot.docs.map(async (document) => {
      await updateDoc(doc(db, 'notifications', document.id), {
        read: true,
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      updatedCount: snapshot.size,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
