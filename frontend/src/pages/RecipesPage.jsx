import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { fetchWorkouts } from '../api/mockApi';
import { WORKOUT_CATEGORIES } from '../data/mockData';
import RecipeCard from '../components/RecipeCard';
import Loader from '../components/Loader';
import './RecipesPage.css';

const RecipesPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Все');

  useEffect(() => {
    fetchWorkouts().then((data) => {
      setWorkouts(data);
      setLoading(false);
    });
  }, []);

  const filtered = workouts.filter((w) => {
    const matchesCategory = activeCategory === 'Все' || w.category === activeCategory;
    const q = search.toLowerCase().trim();
    const matchesQuery =
      !q ||
      w.name.toLowerCase().includes(q) ||
      w.muscles.some((m) => m.toLowerCase().includes(q)) ||
      w.equipment.some((eq) => eq.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  if (loading) return <Loader />;

  return (
    <div className="workouts-page">
      <div className="workouts-header">
        <div>
          <h1 className="workouts-title">База упражнений</h1>
          <p className="workouts-subtitle">
            Техника выполнения, рабочие диапазоны и разбор частых ошибок
          </p>
        </div>

        <div className="workouts-search-box">
          <Search size={16} className="workouts-search-icon" />
          <input
            type="text"
            className="workouts-search"
            placeholder="Поиск по названию, мышцам или инвентарю..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="workouts-chips">
        {WORKOUT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`workouts-chip ${activeCategory === cat ? 'workouts-chip-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="workouts-empty">
          По вашему запросу ничего не найдено. Попробуйте сбросить фильтр или изменить запрос.
        </div>
      ) : (
        <div className="workouts-grid">
          {filtered.map((w) => (
            <RecipeCard key={w.id} workout={w} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipesPage;