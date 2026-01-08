import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Page not found</h2>
        <p className="not-found-message">The page you’re looking for doesn’t exist or was moved.</p>
        <Link to="/" className="btn-primary">Go to Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
