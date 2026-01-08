import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import './MediaFilter.css';

export interface FilterOptions {
  genre?: number;
  language?: string;
  sortBy?: string;
  year?: number;
}

interface MediaFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  type: 'movie' | 'tv';
}

const GENRES = {
  movie: [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
  ],
  tv: [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10762, name: 'Kids' },
    { id: 9648, name: 'Mystery' },
    { id: 10763, name: 'News' },
    { id: 10764, name: 'Reality' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10766, name: 'Soap' },
    { id: 10767, name: 'Talk' },
    { id: 10768, name: 'War & Politics' },
    { id: 37, name: 'Western' },
  ],
};

const LANGUAGES = [
  { code: '', name: 'All Languages' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'tr', name: 'Turkish' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularity (High to Low)' },
  { value: 'popularity.asc', label: 'Popularity (Low to High)' },
  { value: 'vote_average.desc', label: 'Rating (High to Low)' },
  { value: 'vote_average.asc', label: 'Rating (Low to High)' },
  { value: 'release_date.desc', label: 'Release Date (Newest)' },
  { value: 'release_date.asc', label: 'Release Date (Oldest)' },
  { value: 'title.asc', label: 'Title (A-Z)' },
  { value: 'title.desc', label: 'Title (Z-A)' },
];

const MediaFilter = ({ onFilterChange, type }: MediaFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('popularity.desc');
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const genres = type === 'movie' ? GENRES.movie : GENRES.tv;

  const handleApplyFilters = () => {
    const filters: FilterOptions = {
      sortBy: selectedSort,
    };

    if (selectedGenre) filters.genre = selectedGenre;
    if (selectedLanguage) filters.language = selectedLanguage;
    if (selectedYear) filters.year = selectedYear;

    onFilterChange(filters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedGenre(undefined);
    setSelectedLanguage('');
    setSelectedSort('popularity.desc');
    setSelectedYear(undefined);
    onFilterChange({ sortBy: 'popularity.desc' });
  };

  const hasActiveFilters = selectedGenre || selectedLanguage || selectedYear || selectedSort !== 'popularity.desc';

  return (
    <div className="media-filter">
      <button 
        className={`filter-toggle ${hasActiveFilters ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter size={20} />
        <span>Filters</span>
        {hasActiveFilters && <span className="filter-badge"></span>}
      </button>

      {isOpen && (
        <>
          <div className="filter-overlay" onClick={() => setIsOpen(false)} />
          <div className="filter-panel">
            <div className="filter-header">
              <h3>Filter {type === 'movie' ? 'Movies' : 'TV Shows'}</h3>
              <button className="filter-close" onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="filter-content">
              {/* Sort By */}
              <div className="filter-section">
                <label className="filter-label">Sort By</label>
                <select
                  className="filter-select"
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Genre */}
              <div className="filter-section">
                <label className="filter-label">Genre</label>
                <div className="filter-chips">
                  <button
                    className={`filter-chip ${!selectedGenre ? 'active' : ''}`}
                    onClick={() => setSelectedGenre(undefined)}
                  >
                    All Genres
                  </button>
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      className={`filter-chip ${selectedGenre === genre.id ? 'active' : ''}`}
                      onClick={() => setSelectedGenre(genre.id)}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="filter-section">
                <label className="filter-label">Language</label>
                <select
                  className="filter-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="filter-section">
                <label className="filter-label">Year</label>
                <select
                  className="filter-select"
                  value={selectedYear || ''}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-actions">
              <button className="filter-btn filter-btn-clear" onClick={handleClearFilters}>
                Clear All
              </button>
              <button className="filter-btn filter-btn-apply" onClick={handleApplyFilters}>
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MediaFilter;
