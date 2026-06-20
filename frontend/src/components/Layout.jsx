import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
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
            {/* Эмодзи удалены из названий вкладок */}
            <Link to="/dashboard">Дашборд</Link>
            <Link to="/projects">Проекты</Link>
            <Link to="/calendar">Календарь</Link>
            <Link to="/profile">Профиль</Link>
          </nav>
        </div>
        
        {/* Эмодзи удалены из названия кнопки */}
        <button 
          onClick={toggleTheme} 
          style={{ 
            width: '100%', 
            backgroundColor: theme === 'light' ? '#374151' : '#f3f4f6',
            color: theme === 'light' ? '#ffffff' : '#111827',
            marginTop: '20px'
          }}
        >
          {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}