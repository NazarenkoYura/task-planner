import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function ProfileAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Состояния сессии
  const [userToken, setUserToken] = useState(localStorage.getItem('token'));
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username'));

  // Состояния для статистики и дедлайнов в профиле
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  // Запрос статистики при авторизации
  useEffect(() => {
    if (userToken) {
      Promise.all([
        API.get('tasks/'),
        API.get('projects/')
      ])
        .then(([tasksRes, projectsRes]) => {
          setTasks(tasksRes.data);
          setProjects(projectsRes.data);
        })
        .catch(() => {
          setError('Не удалось загрузить данные статистики профиля.');
        });
    }
  }, [userToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const response = await API.post('auth/login/', { username, password });
        const token = response.data.token;
        
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        setUserToken(token);
        setCurrentUsername(username);

        setUsername('');
        setPassword('');
      } else {
        await API.post('users/', { username, email, password });
        
        const response = await API.post('auth/login/', { username, password });
        const token = response.data.token;
        
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        setUserToken(token);
        setCurrentUsername(username);

        setUsername('');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError('Произошла ошибка при выполнении запроса.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUserToken(null);
    setCurrentUsername(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setTasks([]);
    setProjects([]);
  };

  // ЭКРАН 👤 Мой Профиль (со статистикой и разделенными дедлайнами)
  if (userToken) {
    // Вычисление статистики
    const currentTasksCount = tasks.filter(t => t.status !== 'done').length;
    const projectsCount = projects.length;

    // Вычисление текущей даты на клиенте в формате YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Фильтрация невыполненных задач с дедлайнами
    const activeTasksWithDeadlines = tasks.filter(t => t.status !== 'done' && t.due_date);

    // 1. Просроченные дедлайны (дедлайн строго меньше сегодняшней даты)
    const overdueTasks = activeTasksWithDeadlines
      .filter(t => t.due_date < todayStr)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 3); // Показываем максимум 3 просроченные задачи

    // 2. Ближайшие дедлайны (дедлайн сегодня или в будущем)
    const upcomingTasks = activeTasksWithDeadlines
      .filter(t => t.due_date >= todayStr)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 3); // Показываем максимум 3 ближайшие задачи

    return (
      <div style={{ maxWidth: '600px', margin: '20px auto' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Мой Профиль</h2>
          <p>Вы вошли как: <strong>{currentUsername}</strong></p>
          
          <hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />
          
          {/* Блок статистики */}
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-around', margin: '20px 0' }} className="flex-container">
            <div className="card" style={{ flex: 1, margin: 0, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Текущие задачи</h4>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{currentTasksCount}</span>
            </div>
            <div className="card" style={{ flex: 1, margin: 0, backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Мои проекты</h4>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{projectsCount}</span>
            </div>
          </div>

          <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', width: '100%', marginTop: '10px' }}>
            Выйти из аккаунта
          </button>
        </div>

        {/* Блок 1: Просроченные дедлайны*/}
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>Просроченные дедлайны</h3>
          {overdueTasks.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Просроченных задач нет.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {overdueTasks.map(task => (
                <div key={task.id} className="card" style={{ margin: 0, padding: '15px', borderLeft: '5px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="flex-container">
                  <Link to={`/task/${task.id}`} state={{ from: '/profile' }} style={{ textDecoration: 'none', color: 'inherit', flex: 1, textAlign: 'left' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Проект: {task.project_name || 'Без проекта'}</p>
                  </Link>
                  <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    Просрочено: {task.due_date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Блок 2: Ближайшие дедлайны */}
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>Ближайшие дедлайны</h3>
          {upcomingTasks.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Нет текущих задач с дедлайнами.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingTasks.map(task => (
                <div key={task.id} className="card" style={{ margin: 0, padding: '15px', borderLeft: '5px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="flex-container">
                  <Link to={`/task/${task.id}`} state={{ from: '/profile' }} style={{ textDecoration: 'none', color: 'inherit', flex: 1, textAlign: 'left' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Проект: {task.project_name || 'Без проекта'}</p>
                  </Link>
                  <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    Срок: {task.due_date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ЭКРАН Входа/Регистрации (если пользователь не вошел)
  return (
    <div style={{ maxWidth: '450px', margin: '40px auto' }} className="card">
      <h2>{isLogin ? 'Вход в систему' : 'Регистрация'}</h2>
      {error && <p style={{ color: '#dc2626', fontSize: '14px', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <label>Email:</label>
            <input type="email" placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </>
        )}
        <label>Имя пользователя:</label>
        <input type="text" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <label>Пароль:</label>
        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" style={{ width: '100%', marginTop: '10px' }}>
          {isLogin ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'} {' '}
        <span 
          style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Регистрация' : 'Войти'}
        </span>
      </p>
    </div>
  );
}