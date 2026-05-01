import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { NewsCategory } from './dto/create-news.dto';
import { GetNewsDto } from './dto/get-news.dto';

@Injectable()
export class NewsService {
  private collectionName = 'news';

  constructor(private firebaseService: FirebaseService) {}

  async createNews(data: {
    imageLink: string;
    title: string;
    description: string;
    category: NewsCategory;
  }) {
    try {
      const db = this.firebaseService.getFirestore();
      const newsCollection = collection(db, this.collectionName);

      const newsData = {
        ...data,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(newsCollection, newsData);
      return {
        error: false,
        msg: 'News created successfully',
        data: {
          id: docRef.id,
          ...newsData,
          createdAt: newsData.createdAt.toDate(),
        },
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to create news',
        data: null,
      };
    }
  }

  async getNews(params: GetNewsDto) {
    try {
      const { category, page = 1, limit = 10 } = params;

      const db = this.firebaseService.getFirestore();
      const newsCollection = collection(db, this.collectionName);

      // Build query — filter by category only when it's not "all" (or omitted)
      const constraints: any[] = [orderBy('createdAt', 'desc')];
      if (category && category !== NewsCategory.ALL) {
        constraints.unshift(where('category', '==', category));
      }

      const newsQuery = query(newsCollection, ...constraints);
      const querySnapshot = await getDocs(newsQuery);

      const allDocs = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          title: docData.title,
          imageLink: docData.imageLink,
          description: docData.description,
          category: docData.category ?? NewsCategory.ALL,
          createdAt:
            docData.createdAt instanceof Timestamp
              ? docData.createdAt.toDate()
              : docData.createdAt,
        };
      });

      // Pagination (client-side after full fetch — Firestore offset workaround)
      const total = allDocs.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedDocs = allDocs.slice(startIndex, startIndex + limit);

      return {
        error: false,
        msg: 'News fetched successfully',
        data: paginatedDocs,
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
        msg: error.message || 'Failed to fetch news',
        data: [],
        pagination: null,
      };
    }
  }
}
