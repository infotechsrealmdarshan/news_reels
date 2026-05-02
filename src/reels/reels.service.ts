import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { GetReelsDto } from './dto/get-reels.dto';

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
          reelUrl: docData.reelUrl,
          title: docData.title,
          description: docData.description,
          views: docData.views || 0,
          createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : docData.createdAt,
        };
      });

      // Search filter
      let filteredData = allData;
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredData = allData.filter(
          (reel) =>
            (reel.title && reel.title.toLowerCase().includes(searchTerm)) ||
            (reel.description && reel.description.toLowerCase().includes(searchTerm)),
        );
      }

      // Pagination
      const total = filteredData.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedData = filteredData.slice(startIndex, startIndex + limit);

      return {
        error: false,
        msg: 'Reels fetched successfully',
        data: paginatedData,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
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
}
