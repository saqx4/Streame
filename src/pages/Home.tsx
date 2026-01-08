import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import MediaRow from '../components/MediaRow';
import ContinueWatching from '../components/ContinueWatching';
import type { Movie, TVShow } from '../types';
import { tmdbService } from '../services/tmdb';
import './Home.css';

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTVShows, setTrendingTVShows] = useState<TVShow[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<TVShow[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<TVShow[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [dramaMovies, setDramaMovies] = useState<Movie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<Movie[]>([]);
  const [romanceMovies, setRomanceMovies] = useState<Movie[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<Movie[]>([]);
  const [documentaries, setDocumentaries] = useState<Movie[]>([]);
  const [animationMovies, setAnimationMovies] = useState<Movie[]>([]);
  const [heroItems, setHeroItems] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [
          trendingAllResponse,
          trendingMoviesResponse,
          trendingTVResponse,
          popularMoviesResponse,
          popularTVResponse,
          topRatedMoviesResponse,
          topRatedTVResponse,
          actionMoviesResponse,
          comedyMoviesResponse,
          dramaMoviesResponse,
          horrorMoviesResponse,
          romanceMoviesResponse,
          sciFiMoviesResponse,
          documentariesResponse,
          animationMoviesResponse
        ] = await Promise.all([
          tmdbService.getTrendingAll('week'),
          tmdbService.getTrendingMovies('week'),
          tmdbService.getTrendingTVShows('week'),
          tmdbService.getPopularMovies(),
          tmdbService.getPopularTVShows(),
          tmdbService.getTopRatedMovies(),
          tmdbService.getTopRatedTVShows(),
          tmdbService.getPopularMovies(1),
          tmdbService.getPopularMovies(2),
          tmdbService.getPopularMovies(3),
          tmdbService.getTopRatedMovies(1),
          tmdbService.getTopRatedMovies(2),
          tmdbService.getNowPlayingMovies(),
          tmdbService.getUpcomingMovies(),
          tmdbService.getPopularMovies(4)
        ]);

        // Set hero items (mix of trending movies and TV shows only; exclude people)
        const heroContent = trendingAllResponse.results
          .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 5);
        setHeroItems(heroContent);

        setTrendingMovies(trendingMoviesResponse.results.slice(0, 12));
        setTrendingTVShows(trendingTVResponse.results.slice(0, 12));
        setPopularMovies(popularMoviesResponse.results.slice(0, 12));
        setPopularTVShows(popularTVResponse.results.slice(0, 12));
        setTopRatedMovies(topRatedMoviesResponse.results.slice(0, 12));
        setTopRatedTVShows(topRatedTVResponse.results.slice(0, 12));
        
        // Set genre-specific movies
        setActionMovies(actionMoviesResponse.results.slice(0, 12));
        setComedyMovies(comedyMoviesResponse.results.slice(0, 12));
        setDramaMovies(dramaMoviesResponse.results.slice(0, 12));
        setHorrorMovies(horrorMoviesResponse.results.slice(0, 12));
        setRomanceMovies(romanceMoviesResponse.results.slice(0, 12));
        setSciFiMovies(sciFiMoviesResponse.results.slice(0, 12));
        setDocumentaries(documentariesResponse.results.slice(0, 12));
        setAnimationMovies(animationMoviesResponse.results.slice(0, 12));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="home-error">
        <div className="error-content">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section */}
      {heroItems.length > 0 && (
        <Hero items={heroItems} />
      )}

      {/* Continue Watching */}
      <ContinueWatching />

      {/* Content Sections */}
      <div className="home-content">
        {/* Content Categories */}
        <MediaRow
          items={trendingMovies}
          type="movie"
          title="Trending Movies"
          loading={loading}
          category="trending"
        />

        <MediaRow
          items={trendingTVShows}
          type="tv"
          title="Trending TV Shows"
          loading={loading}
          category="trending"
        />

        <MediaRow
          items={topRatedMovies}
          type="movie"
          title="Top Rated Movies"
          loading={loading}
          category="top-rated"
        />

        <MediaRow
          items={topRatedTVShows}
          type="tv"
          title="Top Rated TV Shows"
          loading={loading}
          category="top-rated"
        />

        <MediaRow
          items={popularMovies}
          type="movie"
          title="Popular Movies"
          loading={loading}
          category="popular"
        />

        <MediaRow
          items={popularTVShows}
          type="tv"
          title="Popular TV Shows"
          loading={loading}
          category="popular"
        />

        <MediaRow
          items={actionMovies}
          type="movie"
          title="Action Movies"
          loading={loading}
          category="action"
        />

        <MediaRow
          items={comedyMovies}
          type="movie"
          title="Comedy Movies"
          loading={loading}
          category="comedy"
        />

        <MediaRow
          items={dramaMovies}
          type="movie"
          title="Drama Movies"
          loading={loading}
          category="drama"
        />

        <MediaRow
          items={horrorMovies}
          type="movie"
          title="Horror Movies"
          loading={loading}
          category="horror"
        />

        <MediaRow
          items={romanceMovies}
          type="movie"
          title="Romance Movies"
          loading={loading}
          category="romance"
        />

        <MediaRow
          items={sciFiMovies}
          type="movie"
          title="Sci-Fi Movies"
          loading={loading}
          category="sci-fi"
        />

        <MediaRow
          items={documentaries}
          type="movie"
          title="Documentaries"
          loading={loading}
          category="documentaries"
        />

        <MediaRow
          items={animationMovies}
          type="movie"
          title="Animation Movies"
          loading={loading}
          category="animation"
        />
      </div>
    </div>
  );
};

export default Home;