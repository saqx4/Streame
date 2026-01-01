import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userMediaService } from '../services/userMedia';
import { Link } from 'react-router-dom';

const Watchlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await userMediaService.list(user.id, 'watchlist');
        setItems(data);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  const remove = async (tmdb_id: number) => {
    if (!user) return;
    await userMediaService.remove(user.id, tmdb_id, 'watchlist');
    setItems((s) => s.filter((i) => i.tmdb_id !== tmdb_id));
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1 className="mb-4">Watchlist</h1>
      {items.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {items.map((item) => (
            <div key={`${item.tmdb_id}-${item.list_type}`} className="card" style={{ padding: 12 }}>
              <Link to={`/${item.type === 'movie' ? 'movie' : 'tv'}/${item.tmdb_id}`}>
                {item.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.title} style={{ width: '100%', borderRadius: 8 }} />
                ) : (
                  <div style={{ aspectRatio: '2/3', background: 'var(--bg-tertiary)', borderRadius: 8 }} />
                )}
                <div style={{ marginTop: 8, fontWeight: 600 }}>{item.title}</div>
              </Link>
              <button className="btn btn-outline" style={{ marginTop: 8, width: '100%' }} onClick={() => remove(item.tmdb_id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
