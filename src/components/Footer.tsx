import { Play } from 'lucide-react';
import './Footer.css';

const Footer = () => {

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-circle">
                <Play size={20} fill="currentColor" />
              </div>
              <span className="logo-text">Streame</span>
            </div>
            <p className="footer-description">
              Your ultimate destination for streaming the latest movies, TV shows, and anime. 
              Experience high-quality entertainment with our modern platform.
            </p>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-column-title">Browse</h4>
              <ul className="footer-link-list">
                <li><a href="/movies" className="footer-link">Movies</a></li>
                <li><a href="/tv-shows" className="footer-link">TV Shows</a></li>
                <li><a href="/anime" className="footer-link">Anime</a></li>
                <li><a href="/categories" className="footer-link">Categories</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-column-title">Support</h4>
              <ul className="footer-link-list">
                <li><a href="/help" className="footer-link">Help Center</a></li>
                <li><a href="/contact" className="footer-link">Contact Us</a></li>
                <li><a href="/faq" className="footer-link">FAQ</a></li>
                <li><a href="/feedback" className="footer-link">Feedback</a></li>
                <li><a href="/bug-report" className="footer-link">Report Bug</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-column-title">Legal</h4>
              <ul className="footer-link-list">
                <li><a href="/terms" className="footer-link">Terms of Service</a></li>
                <li><a href="/privacy" className="footer-link">Privacy Policy</a></li>
                <li><a href="/cookies" className="footer-link">Cookie Policy</a></li>
                <li><a href="/dmca" className="footer-link">DMCA</a></li>
                <li><a href="/disclaimer" className="footer-link">Disclaimer</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-column-title">Company</h4>
              <ul className="footer-link-list">
                <li><a href="/about" className="footer-link">About Us</a></li>
                <li><a href="/careers" className="footer-link">Careers</a></li>
                <li><a href="/press" className="footer-link">Press</a></li>
                <li><a href="/partners" className="footer-link">Partners</a></li>
                <li><a href="/blog" className="footer-link">Blog</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>© 2025 Streame. All rights reserved.</p>
            <p className="footer-disclaimer">
              Streame does not store any files on our server. All content is provided by non-affiliated third parties.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;