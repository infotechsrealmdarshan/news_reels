# News & Reels API

This is a NestJS backend API for managing News and Reels, integrated with Firebase Firestore.

## Features

- **News API**: Add and retrieve news with image links, titles, and descriptions.
- **Reels API**: Add and retrieve reels with URLs, titles, descriptions, and view counts.
- **Firestore Integration**: All data is stored in Google Cloud Firestore.
- **Sorting**: Data is automatically sorted by `createdAt` in descending order (latest first).
- **Swagger Documentation**: Interactive API documentation available at `/api`.

## API Documentation (Swagger)
You can access the interactive Swagger UI at:
`http://localhost:3000/api`
This UI allows you to test the endpoints directly from your browser.

## API Endpoints

### News

#### Add News
- **URL**: `POST /news`
- **Body**:
  ```json
  {
    "imageLink": "https://example.com/image.jpg",
    "title": "Breaking News",
    "description": "Short description of the news"
  }
  ```

#### Get News
- **URL**: `GET /news`
- **Response**:
  ```json
  {
    "data": [
      {
        "title": "Breaking News",
        "imageLink": "https://example.com/image.jpg",
        "description": "Short description of the news",
        "createdAt": "2024-04-30T10:00:00.000Z"
      }
    ]
  }
  ```

### Reels

#### Add Reel
- **URL**: `POST /reels`
- **Body**:
  ```json
  {
    "reelUrl": "https://example.com/reel.mp4",
    "title": "Cool Reel",
    "description": "Awesome content"
  }
  ```

#### Get Reels
- **URL**: `GET /reels`
- **Response**:
  ```json
  {
    "data": [
      {
        "reelUrl": "https://example.com/reel.mp4",
        "title": "Cool Reel",
        "description": "Awesome content",
        "createdAt": "2024-04-30T10:05:00.000Z",
        "views": 0
      }
    ]
  }
  ```

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   The `.env` file has been pre-configured with your Firebase credentials.

3. **Run the Application**:
   ```bash
   npm run start:dev
   ```

## Note on MongoDB
As per your latest request, this API uses **Firestore** as the primary database. MongoDB integration was excluded as requested.
