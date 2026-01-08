import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TVShows from './pages/TVShows';
import Search from './pages/Search';
import MovieDetail from './pages/MovieDetail';
import TVShowDetail from './pages/TVShowDetail';
import PlayerMovie from './pages/PlayerMovie';
import PlayerEpisode from './pages/PlayerEpisode';
import ViewAll from './pages/ViewAll';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Watchlist from './pages/Watchlist';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { trackPageView } from './utils/telemetry';
import './App.css';

// Scroll restoration component
function ScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <ScrollRestoration />
              <div className="app">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/movies" element={<Movies />} />
                    <Route path="/tv-shows" element={<TVShows />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/movie/:id" element={<MovieDetail />} />
                    <Route path="/tv/:id" element={<TVShowDetail />} />
                    <Route path="/watch/movie/:id" element={<PlayerMovie />} />
                    <Route path="/watch/tv/:tvId/season/:seasonNumber/episode/:episodeNumber" element={<PlayerEpisode />} />
                    <Route path="/view-all/:type/:category" element={<ViewAll />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
