import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-text">Streame</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">
            Home
          </Link>
          <Link to="/movies" className="navbar-link">
            Movies
          </Link>
          <Link to="/tv-shows" className="navbar-link">
            TV Shows
          </Link>
        </div>

        {/* Search Bar */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search movies and TV shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <Search size={20} />
            </button>
          </div>
        </form>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-button" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/movies" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            Movies
          </Link>
          <Link to="/tv-shows" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            TV Shows
          </Link>
          <form className="mobile-search-form" onSubmit={handleSearch}>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <Search size={20} />
              </button>
            </div>
          </form>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
