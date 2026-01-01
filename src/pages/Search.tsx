import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import MediaGrid from '../components/MediaGrid';
import type { Movie, TVShow } from '../types';
import { tmdbService } from '../services/tmdb';
import './Search.css';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const response = await tmdbService.searchMulti(query.trim());
      
      // Filter out person results and only keep movies and TV shows
      const filteredResults = response.results.filter(
        (item): item is Movie | TVShow =>
          'media_type' in item && (item.media_type === 'movie' || item.media_type === 'tv')
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
      performSearch(searchQuery.trim());
    }
  };



  return (
    <div className="search">
      <div className="search-header">
        <h1 className="search-title">Search</h1>
        <form className="search-form-page" onSubmit={handleSearch}>
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search for movies and TV shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-page"
            />
            <button type="submit" className="search-button-page">
              <SearchIcon size={20} />
            </button>
          </div>
        </form>
      </div>

      <div className="search-content">
        {error && (
          <div className="search-error">
            <p>{error}</p>
            <button onClick={() => performSearch(searchQuery)} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {!hasSearched && !loading && (
          <div className="search-placeholder">
            <SearchIcon size={64} className="search-placeholder-icon" />
            <h2>Search for Movies and TV Shows</h2>
            <p>Enter a title, actor, or keyword to find your favorite content.</p>
          </div>
        )}

        {hasSearched && !loading && searchResults.length === 0 && !error && (
          <div className="search-no-results">
            <h2>No results found</h2>
            <p>Try searching with different keywords or check your spelling.</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <MediaGrid
            items={searchResults}
            title={`Search Results for "${searchParams.get('q')}"`}
            loading={loading}
          />
        )}

        {loading && (
          <MediaGrid
            items={[]}
            title="Searching..."
            loading={true}
          />
        )}
      </div>
    </div>
  );
};

export default Search;
