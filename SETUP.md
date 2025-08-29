# Streame App - Setup Instructions

## ✅ Project Status
**All errors have been fixed!** The application is now ready to run.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure TMDB API Key
Edit the `.env` file and replace the placeholder with your actual TMDB API key:
```bash
VITE_TMDB_API_KEY=your_actual_tmdb_api_key_here
```

**How to get a TMDB API Key:**
1. Visit [https://www.themoviedb.org/](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API
4. Request an API key (it's free!)
5. Copy the API key to your `.env` file

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open in Browser
Navigate to: `http://localhost:5173`

## 🎯 Features Working

### ✅ Navigation
- **Home Page**: Hero carousel + trending content
- **Movies Page**: Popular, Top Rated, Now Playing, Upcoming
- **TV Shows Page**: Popular, Top Rated, On The Air, Airing Today
- **Search Page**: Real-time search functionality

### ✅ Video Streaming
- **Movie Detail Pages**: Full movie information + embedded player
- **TV Show Detail Pages**: Episode selection + embedded player
- **Server Selection**: Switch between Server 1 (multiembed.mov) and Server 2 (vidsrc.xyz)

### ✅ UI/UX
- **Dark Theme**: Netflix-inspired design
- **Responsive**: Works on desktop, tablet, and mobile
- **Loading States**: Skeleton loaders while content loads
- **Error Handling**: Graceful error messages and retry options

## 🛠 Technical Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router DOM** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **CSS3** with CSS Variables for theming

## 📁 Project Structure

```
streame-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Hero.tsx        # Hero banner with carousel
│   │   ├── MediaCard.tsx   # Movie/TV show cards
│   │   ├── MediaGrid.tsx   # Grid layout for media
│   │   └── Navbar.tsx      # Navigation bar
│   ├── pages/              # Page components
│   │   ├── Home.tsx        # Home page
│   │   ├── Movies.tsx      # Movies listing
│   │   ├── TVShows.tsx     # TV shows listing
│   │   ├── Search.tsx      # Search results
│   │   ├── MovieDetail.tsx # Movie detail + player
│   │   └── TVShowDetail.tsx# TV show detail + player
│   ├── services/           # API services
│   │   └── tmdb.ts         # TMDB API integration
│   ├── types/              # TypeScript definitions
│   │   └── index.ts        # All type definitions
│   ├── App.tsx             # Main app component
│   └── main.tsx            # App entry point
├── .env                    # Environment variables
└── package.json
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎬 Streaming APIs

### Server 1 (multiembed.mov)
- Movies: `https://multiembed.mov/?video_id={TMDB_ID}&tmdb=1`
- TV Episodes: `https://multiembed.mov/?video_id={TMDB_ID}&tmdb=1&s={SEASON}&e={EPISODE}`

### Server 2 (vidsrc.xyz)
- Movies: `https://vidsrc.xyz/embed/movie?tmdb={TMDB_ID}`
- TV Episodes: `https://vidsrc.xyz/embed/tv?tmdb={TMDB_ID}&season={SEASON}&episode={EPISODE}`

## 🐛 Troubleshooting

### If you see "No content" or API errors:
1. Make sure your TMDB API key is correctly set in `.env`
2. Check your internet connection
3. Verify the API key is valid at [TMDB API Settings](https://www.themoviedb.org/settings/api)

### If the build fails:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Try `npm run build`

### If streaming doesn't work:
- The streaming servers (multiembed.mov and vidsrc.xyz) are external services
- Try switching between Server 1 and Server 2 using the buttons
- Some content may not be available on all servers

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## ⚖️ Legal Notice

This application is for educational and demonstration purposes only. Users are responsible for ensuring they comply with all applicable laws and terms of service when using streaming content.

---

**🎉 Enjoy your streaming app!**
