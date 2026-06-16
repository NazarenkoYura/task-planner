import React, { useState } from 'react';
import API from '../api';

export default function ProfileAuth() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Переменные состояния для полей ввода
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  
  // Состояния для хранения сессии
  const [userToken, setUserToken] = useState(localStorage.getItem('token'));
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        // Запрос на авторизацию
        const response = await API.post('auth/login/', { username, password });
        const token = response.data.token;
        
        // Сохраняем сессию локально
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        setUserToken(token);
        setCurrentUsername(username);

        // ОЧИСТКА ПОЛЕЙ ПОСЛЕ ВХОДА
        setUsername('');
        setPassword('');
      } else {
        // Запрос на регистрацию нового пользователя
        await API.post('users/', { username, email, password });
        
        // Автоматический вход после успешной регистрации
        const response = await API.post('auth/login/', { username, password });
        const token = response.data.token;
        
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        setUserToken(token);
        setCurrentUsername(username);

        // ОЧИСТКА ПОЛЕЙ ПОСЛЕ РЕГИСТРАЦИИ
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

    // ОЧИСТКА ПОЛЕЙ ПРИ ВЫХОДЕ ИЗ АККАУНТА
    setUsername('');
    setEmail('');
    setPassword('');
  };

  if (userToken) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center' }}>
        <h2>Мой Профиль</h2>
        <p>Вы вошли как: <strong>{currentUsername}</strong></p>
        <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', width: '100%', marginTop: '20px' }}>
          Выйти из аккаунта
        </button>
      </div>
    );
  }

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