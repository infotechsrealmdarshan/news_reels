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
  limit as firestoreLimit,
} from 'firebase/firestore';
import { NewsCategory, NewsLanguage, CreateNewsDto } from './dto/create-news.dto';
import { GetNewsDto } from './dto/get-news.dto';

@Injectable()
export class NewsService {
  private collectionName = 'news';

  constructor(private firebaseService: FirebaseService) {}

  async createNews(data: CreateNewsDto) {
    try {
      const db = this.firebaseService.getFirestore();
      const newsCollection = collection(db, this.collectionName);

      // Check if news with same sourceUrl already exists to avoid duplicates
      if (data.sourceUrl) {
        const duplicateQuery = query(
          newsCollection,
          where('sourceUrl', '==', data.sourceUrl),
        );
        const duplicateSnapshot = await getDocs(duplicateQuery);

        if (!duplicateSnapshot.empty) {
          return {
            error: true,
            msg: 'News already exists',
            data: null,
          };
        }
      }


      const newsData = {
        ...data,
        publishedAt: data.publishedAt ? Timestamp.fromDate(new Date(data.publishedAt)) : Timestamp.now(),
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
          publishedAt: newsData.publishedAt.toDate(),
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

  async getNews(params: GetNewsDto & { language?: NewsLanguage }) {
    try {
      const { category, page = 1, limit = 10 } = params;

      const db = this.firebaseService.getFirestore();
      const newsCollection = collection(db, this.collectionName);

      // Build query
      const constraints: any[] = [orderBy('createdAt', 'desc')];
      
      if (category && category !== NewsCategory.ALL) {
        constraints.push(where('category', '==', category));
      }

      const newsQuery = query(newsCollection, ...constraints);
      const querySnapshot = await getDocs(newsQuery);


      const allDocs = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          title: docData.title,
          imageLink: docData.imageLink,
          imageLinks: docData.imageLinks || [docData.imageLink],
          description: docData.description,
          category: docData.category,
          createdAt:
            docData.createdAt instanceof Timestamp
              ? docData.createdAt.toDate()
              : docData.createdAt,
        };
      });

      // Search filter
      let filteredDocs = allDocs;
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredDocs = allDocs.filter(
          (doc) =>
            (doc.title && doc.title.toLowerCase().includes(searchTerm)) ||
            (doc.description && doc.description.toLowerCase().includes(searchTerm)),
        );
      }

      // Pagination
      const parsedPage = Number(page) || 1;
      const parsedLimit = Number(limit) || 10;
      
      const total = filteredDocs.length;
      const totalPages = Math.ceil(total / parsedLimit);
      const startIndex = (parsedPage - 1) * parsedLimit;
      const paginatedDocs = filteredDocs.slice(startIndex, startIndex + parsedLimit);

      return {
        error: false,
        msg: 'News fetched successfully',
        data: paginatedDocs,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages,
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


