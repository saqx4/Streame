
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TVShows from './pages/TVShows';
import Search from './pages/Search';
import MovieDetail from './pages/MovieDetail';
import TVShowDetail from './pages/TVShowDetail';
import './App.css';

function App() {
  return (
    <Router>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
