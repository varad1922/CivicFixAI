# CivicFix AI - Civic Intelligence & Issue Resolution Platform

> Report. Track. Resolve.

CivicFix AI is a civic technology platform where citizens can report real-world public infrastructure problems using images and location data. It leverages Google Gemini AI to assist with categorizing and understanding reported issues, making civic operations highly efficient.

## Features

- **Mobile-First Experience**: Designed primarily for phone usage, featuring intelligent touch-targets and responsive layout transformation.
- **AI Integration**: Automatically analyzes uploaded issue images to determine category (e.g., Pothole, Graffiti, Streetlight) and safety impact using Google Gemini API.
- **Geospatial Tracking**: Reports include accurate GPS coordinates. Interactive map clustering and proximity search are built with Leaflet and MongoDB `$near` queries.
- **Role-based Workflows**:
  - **Citizens**: Report issues, track status, and view history.
  - **Authorities**: Receive prioritized queues, update statuses, and resolve tickets.
  - **Admins**: View high-level analytics, civic hotspots, and manage users.
- **Authentication**: Secure JWT email/password login, plus Google OAuth2 integration.
- **Robust Security**: Rate limiting, Helmet headers, CORS policies, and secure image upload streams (Cloudinary).

## Technology Stack

- **Frontend**: React, Vite, TailwindCSS, React-Leaflet, Lucide React, Axios, React-GA4.
- **Backend**: Node.js, Express, Mongoose, Multer.
- **Database**: MongoDB (Atlas) with `2dsphere` geospatial indexing.
- **AI Services**: Google Gemini API.
- **Image Storage**: Cloudinary.

## Installation

### Prerequisites
- Node.js (v18+)
- MongoDB connection URI
- Cloudinary Account
- Google Cloud Console Project (OAuth & Gemini API)

### Environment Variables

Check `.env.example` in both `client/` and `server/` directories.

**Backend (`server/.env`):**
```
PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
GEMINI_API_KEY=your_gemini_key
CLIENT_URL=http://localhost:5173
```

**Frontend (`client/.env`):**
```
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_API_URL=http://localhost:5000/api
VITE_GA_MEASUREMENT_ID=your_ga4_id
```

### Running Locally

1. Install Dependencies:
```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

2. Start the Application:
```bash
# Terminal 1 (Backend)
cd server
npm run dev

# Terminal 2 (Frontend)
cd client
npm run dev
```

## Deployment

### Frontend (Vercel)
Set up a Vercel project linked to your repository. Set root directory to `client/`. Add all `VITE_` environment variables in the Vercel dashboard.

### Backend (Render / Railway)
Deploy the `server/` directory as a Node web service. Add all backend environment variables. Update `CLIENT_URL` to your production Vercel domain.

## Project Structure
- `/client`: React Single Page Application (SPA).
- `/server`: Express REST API.
- `/server/services`: Encapsulated third-party integrations (AI, Cloudinary, Activity Tracking).

## License
MIT License
