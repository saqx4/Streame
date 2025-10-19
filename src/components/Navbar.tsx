import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll detection for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsMenuOpen(false);
      setSearchQuery('');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Check if current route is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} onKeyDown={handleKeyDown}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <div className="logo-circle"></div>
            <div className="logo-text">Streame</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/movies" className={`navbar-link ${isActive('/movies') ? 'active' : ''}`}>
            Movies
          </Link>
          <Link to="/tv-shows" className={`navbar-link ${isActive('/tv-shows') ? 'active' : ''}`}>
            TV Shows
          </Link>
          <Link to="/anime" className={`navbar-link ${isActive('/anime') ? 'active' : ''}`}>
            Anime
          </Link>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-container">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search movies, TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </form>
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-button" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            <Link to="/" className={`mobile-link ${isActive('/') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/movies" className={`mobile-link ${isActive('/movies') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              Movies
            </Link>
            <Link to="/tv-shows" className={`mobile-link ${isActive('/tv-shows') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              TV Shows
            </Link>
            <Link to="/anime" className={`mobile-link ${isActive('/anime') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              Anime
            </Link>
            <div className="mobile-search">
              <form onSubmit={handleSearch}>
                <div className="search-container">
                  <Search size={20} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;