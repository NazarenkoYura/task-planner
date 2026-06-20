import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'; // Импорт Navigate добавлен
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import TaskDetail from './pages/TaskDetail';
import ProfileAuth from './pages/ProfileAuth';
import Calendar from './pages/Calendar';
import './index.css';

// Компонент для отображения ошибки 404 (Страница не найдена)
function NotFound() {
  return (
    <div className="card" style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center' }}>
      <h2>Страница не найдена (404)</h2>
      <p style={{ color: '#6b7280', margin: '10px 0 20px 0' }}>
        Запрашиваемый адрес не существует, был удален или перенесен.
      </p>
      {/* Путь изменен на /dashboard для соответствия кнопке */}
      <Link to="/dashboard">
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
          {/* Автоматическое перенаправление с корня "/" на "/profile" по умолчанию */}
          <Route index element={<Navigate to="/profile" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<ProjectPage />} />
          <Route path="task/:id" element={<TaskDetail />} />
          <Route path="profile" element={<ProfileAuth />} />
          <Route path="calendar" element={<Calendar />} />

          {/* Регистрация роута-ловушки "*" для вывода кастомной 404-страницы */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}