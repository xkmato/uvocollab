import { adminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await auth().verifyIdToken(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = decodedToken.uid;

        // Find the podcast owned by this user
        const podcastsSnapshot = await adminDb
            .collection('podcasts')
            .where('ownerId', '==', userId)
            .limit(1)
            .get();

        if (podcastsSnapshot.empty) {
            return NextResponse.json({ pitches: [] });
        }

        const podcastId = podcastsSnapshot.docs[0].id;

        // Fetch collaborations for this podcast
        const collaborationsSnapshot = await adminDb
            .collection('collaborations')
            .where('podcastId', '==', podcastId)
            .where('type', '==', 'podcast')
            .orderBy('createdAt', 'desc')
            .get();

        const pitches = await Promise.all(collaborationsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            
            // Fetch buyer details
            let buyerName = 'Unknown User';
            let buyerEmail = '';
            if (data.buyerId) {
                const buyerDoc = await adminDb.collection('users').doc(data.buyerId).get();
                if (buyerDoc.exists) {
                    const buyerData = buyerDoc.data();
                    buyerName = buyerData?.displayName || 'Unknown User';
                    buyerEmail = buyerData?.email || '';
                }
            }

            // Fetch service details
            let serviceTitle = 'Unknown Service';
            let serviceType = 'guest_spot';
            if (data.serviceId) {
                const serviceDoc = await adminDb
                    .collection('podcasts')
                    .doc(podcastId)
                    .collection('services')
                    .doc(data.serviceId)
                    .get();
                if (serviceDoc.exists) {
                    const serviceData = serviceDoc.data();
                    serviceTitle = serviceData?.title || 'Unknown Service';
                    serviceType = serviceData?.type || 'guest_spot';
                }
            }

            return {
                id: doc.id,
                ...data,
                buyerName,
                buyerEmail,
                serviceTitle,
                serviceType,
                // Convert timestamps to ISO strings
                createdAt: data.createdAt?.toDate().toISOString(),
                updatedAt: data.updatedAt?.toDate().toISOString(),
                acceptedAt: data.acceptedAt?.toDate().toISOString(),
                paidAt: data.paidAt?.toDate().toISOString(),
                completedAt: data.completedAt?.toDate().toISOString(),
            };
        }));

        return NextResponse.json({ pitches });
    } catch (error) {
        console.error('Error fetching podcast pitches:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
