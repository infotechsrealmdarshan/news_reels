import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

@Injectable()
export class ReelsService {
  private collectionName = 'reels';

  constructor(private firebaseService: FirebaseService) {}

  async createReel(data: { reelUrl: string; title: string; description: string }) {
    try {
      const db = this.firebaseService.getFirestore();
      const reelsCollection = collection(db, this.collectionName);
      
      const reelData = {
        ...data,
        views: 0,
        createdAt: Timestamp.now(),
      };

      await addDoc(reelsCollection, reelData);
      return {
        error: false,
        msg: 'Reel created successfully',
        data: { ...reelData, createdAt: reelData.createdAt.toDate() },
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to create reel',
        data: null,
      };
    }
  }

  async getReels() {
    try {
      const db = this.firebaseService.getFirestore();
      const reelsCollection = collection(db, this.collectionName);
      const reelsQuery = query(reelsCollection, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(reelsQuery);
      const data = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          reelUrl: docData.reelUrl,
          title: docData.title,
          description: docData.description,
          views: docData.views || 0,
          createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : docData.createdAt,
        };
      });

      return {
        error: false,
        msg: 'Reels fetched successfully',
        data: data,
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to fetch reels',
        data: [],
      };
    }
  }
}
