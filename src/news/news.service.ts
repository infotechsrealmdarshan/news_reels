import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

@Injectable()
export class NewsService {
  private collectionName = 'news';

  constructor(private firebaseService: FirebaseService) {}

  async createNews(data: { imageLink: string; title: string; description: string }) {
    try {
      const db = this.firebaseService.getFirestore();
      const newsCollection = collection(db, this.collectionName);
      
      const newsData = {
        ...data,
        createdAt: Timestamp.now(),
      };

      await addDoc(newsCollection, newsData);
      return {
        error: false,
        msg: 'News created successfully',
        data: { ...newsData, createdAt: newsData.createdAt.toDate() },
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to create news',
        data: null,
      };
    }
  }

  async getNews() {
    try {
      const db = this.firebaseService.getFirestore();
      const newsCollection = collection(db, this.collectionName);
      const newsQuery = query(newsCollection, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(newsQuery);
      const data = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          title: docData.title,
          imageLink: docData.imageLink,
          description: docData.description,
          createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : docData.createdAt,
        };
      });

      return {
        error: false,
        msg: 'News fetched successfully',
        data: data,
      };
    } catch (error) {
      return {
        error: true,
        msg: error.message || 'Failed to fetch news',
        data: [],
      };
    }
  }
}
