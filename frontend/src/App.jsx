import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import TaskDetail from './pages/TaskDetail';
import ProfileAuth from './pages/ProfileAuth';
import './index.css';
import Calendar from './pages/Calendar';

// Компонент для отображения ошибки 404 (Страница не найдена)
function NotFound() {
  return (
    <div className="card" style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center' }}>
      <h2>Страница не найдена (404)</h2>
      <p style={{ color: '#6b7280', margin: '10px 0 20px 0' }}>
        Запрашиваемый адрес не существует, был удален или перенесен.
      </p>
      <Link to="/">
        <button style={{ width: '100%' }}>Вернуться на Дашборд</button>
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectPage />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="task/:id" element={<TaskDetail />} />
          <Route path="profile" element={<ProfileAuth />} />
          
          {/* Ловим все несуществующие URL и показываем ошибку 404 внутри макета */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}