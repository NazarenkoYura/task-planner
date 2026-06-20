import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  // Инициализация темы из localStorage или по умолчанию 'light'
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`app-container ${theme}`}>
      <aside className="sidebar">
        <div>
          <h2>Планировщик</h2>
          <nav>
            <Link to="/dashboard">Дашборд</Link>
            <Link to="/projects">Проекты</Link>
            <Link to="/calendar">Календарь</Link> {/* Добавлено */}
            <Link to="/profile">Профиль</Link>
          </nav>
        </div>
        
        {/* Кнопка смены темы внизу боковой панели */}
        <button 
          onClick={toggleTheme} 
          style={{ 
            width: '100%', 
            backgroundColor: theme === 'light' ? '#374151' : '#f3f4f6',
            color: theme === 'light' ? '#ffffff' : '#111827',
            marginTop: '20px'
          }}
        >
          {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}