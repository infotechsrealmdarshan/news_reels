import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import {
  collection, addDoc, getDocs, query, orderBy, Timestamp, where,
  doc, updateDoc, increment, getDoc,
} from 'firebase/firestore';
import { GetReelsDto } from './dto/get-reels.dto';

@Injectable()
export class ReelsService {
  private collectionName = 'reels';

  constructor(private firebaseService: FirebaseService) { }

  async createReel(data: { videoId: string; reelUrl: string; title: string; description: string; category?: string; language?: string; }) {
    return this.createReelWithEngagement({ ...data, likes: 0, views: 0 });
  }

  async createReelWithEngagement(data: {
    videoId: string;
    reelUrl: string;
    title: string;
    description: string;
    category?: string;
    thumbnailUrl?: string;
    profileImage?: string;
    likes?: number;
    views?: number;
  }) {
    try {
      const db = this.firebaseService.getFirestore();
      const reelsCollection = collection(db, this.collectionName);

      // Duplicate check by videoId
      const dupQuery = query(reelsCollection, where('videoId', '==', data.videoId));
      const dupSnapshot = await getDocs(dupQuery);
      if (!dupSnapshot.empty) {
        return { error: true, msg: 'Reel already exists', data: null };
      }

      const reelData = {
        videoId: data.videoId,
        reelUrl: data.reelUrl,
        title: data.title,
        description: data.description,
        category: data.category || '',
        thumbnailUrl: data.thumbnailUrl || '',
        profileImage: data.profileImage || '',
        views: data.views ?? 0,
        likes: data.likes ?? 0,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(reelsCollection, reelData);
      return {
        error: false,
        msg: 'Reel created successfully',
        data: { id: docRef.id, ...reelData, createdAt: reelData.createdAt.toDate() },
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to create reel',
        data: null,
      };
    }
  }

  async getReels(params: GetReelsDto) {
    try {
      const { page = 1, limit = 10 } = params;
      const db = this.firebaseService.getFirestore();
      const reelsCollection = collection(db, this.collectionName);
      const reelsQuery = query(reelsCollection, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(reelsQuery);
      const allData = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          videoId: docData.videoId,
          reelUrl: docData.reelUrl,
          title: docData.title,
          description: docData.description,
          category: docData.category,
          thumbnailUrl: docData.thumbnailUrl || '',
          views: docData.views || 0,
          likes: docData.likes || 0,
          createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : docData.createdAt,
        };
      });

      // Search and Filter
      let filteredData = allData;
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredData = filteredData.filter(
          (reel) =>
            (reel.title && reel.title.toLowerCase().includes(searchTerm)) ||
            (reel.description && reel.description.toLowerCase().includes(searchTerm)),
        );
      }
      if (params.category) {
        const categorySearch = params.category.toLowerCase();
        filteredData = filteredData.filter(
          (reel) => reel.category && reel.category.toLowerCase() === categorySearch
        );
      }

      // Interleave reels by category to avoid same category consecutively
      const interleavedData = this.interleaveByCategory(filteredData);

      // Pagination
      const parsedPage = Number(page) || 1;
      const parsedLimit = Number(limit) || 10;

      const total = interleavedData.length;
      const totalPages = Math.ceil(total / parsedLimit);
      const startIndex = (parsedPage - 1) * parsedLimit;
      const paginatedData = interleavedData.slice(startIndex, startIndex + parsedLimit);

      return {
        error: false,
        msg: 'Reels fetched successfully',
        data: paginatedData,
        pagination: { total, page: parsedPage, limit: parsedLimit, totalPages },
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to fetch reels',
        data: [],
        pagination: null,
      };
    }
  }

  async likeReel(id: string) {
    try {
      const db = this.firebaseService.getFirestore();
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, { likes: increment(1) });
      const updated = await getDoc(docRef);
      return {
        error: false,
        msg: 'Liked successfully',
        data: { id, likes: updated.data()?.likes ?? 0 },
      };
    } catch (error) {
      return { error: true, msg: error.message || 'Failed to like reel', data: null };
    }
  }

  async viewReel(id: string) {
    try {
      const db = this.firebaseService.getFirestore();
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, { views: increment(1) });
      const updated = await getDoc(docRef);
      return {
        error: false,
        msg: 'View counted',
        data: { id, views: updated.data()?.views ?? 0 },
      };
    } catch (error) {
      return { error: true, msg: error.message || 'Failed to count view', data: null };
    }
  }

  private interleaveByCategory(reels: any[]): any[] {
    if (reels.length === 0) return [];

    // Group reels by category
    const categoryMap = new Map<string, any[]>();
    for (const reel of reels) {
      const category = reel.category || 'uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(reel);
    }

    const categories = Array.from(categoryMap.keys());
    const interleaved: any[] = [];
    let index = 0;

    // Round-robin interleaving
    while (interleaved.length < reels.length) {
      for (const category of categories) {
        const categoryReels = categoryMap.get(category)!;
        if (index < categoryReels.length) {
          interleaved.push(categoryReels[index]);
        }
      }
      index++;
    }

    return interleaved;
  }
}
