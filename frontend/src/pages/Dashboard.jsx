import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function Dashboard() {
  const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
  };

  const getMaxDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear() + 10;
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  // Корректировка для високосного 29 февраля
  if (mm === '02' && dd === '29') {
    const isLeap = (yyyy % 4 === 0 && yyyy % 100 !== 0) || (yyyy % 400 === 0);
    if (!isLeap) return `${yyyy}-02-28`;
  }
  return `${yyyy}-${mm}-${dd}`;
  };
  
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const tasksRes = await API.get('tasks/');
      const projectsRes = await API.get('projects/');
      const tagsRes = await API.get('tags/');
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setTags(tagsRes.data);
    } catch (err) {
      setError('Не удалось загрузить данные планировщика.');
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleDeleteTask = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Вы действительно хотите удалить эту задачу?')) {
      try {
        await API.delete(`tasks/${id}/`);
        fetchData();
      } catch (err) {
        setError('Не удалось удалить задачу.');
      }
    }
  };

  // Функция "Закрыть задачу" (пометка статусом done)
  const handleCloseTask = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await API.patch(`tasks/${id}/`, { status: 'done' });
      fetchData(); // Обновляем списки
    } catch (err) {
      setError('Не удалось закрыть задачу.');
    }
  };

  const handleToggleTagSelection = (tagId) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await API.post('tags/', { name: newTagName });
      setNewTagName('');
      fetchData();
    } catch (err) {
      setError('Ошибка при создании тега.');
    }
  };

  const handleDeleteTag = async (tagId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Вы действительно хотите удалить этот тег?')) {
      try {
        await API.delete(`tags/${tagId}/`);
        setSelectedTagIds(prev => prev.filter(id => id !== tagId));
        fetchData();
      } catch (err) {
        setError('Не удалось удалить тег.');
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        title,
        description,
        status,
        due_date: dueDate || null,
        project: projectId || null,
        tag_ids: selectedTagIds,
      };
      await API.post('tasks/', taskData);
      
      setTitle('');
      setDescription('');
      setStatus('todo');
      setProjectId('');
      setDueDate('');
      setSelectedTagIds([]);
      fetchData();
    } catch (err) {
      setError('Ошибка при создании задачи.');
    }
  };

  const handleTagSelectionChange = (e) => {
    const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setSelectedTagIds(values);
  };

  if (!token) {
    return (
      <div className="card" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Доступ ограничен</h2>
        <p>Для работы с планировщиком необходимо авторизоваться на странице Профиль.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Мой Дашборд</h1>
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      
      <div className="flex-container" style={{ display: 'flex', gap: '20px' }}>
        
        <div style={{ flex: 1 }}>
          <div className="card" style={{ margin: 0 }}>
            <h3>Добавить новую задачу</h3>
            <form onSubmit={handleCreateTask}>
              <label>Заголовок задачи:</label>
              <input type="text" placeholder="Что нужно сделать?" value={title} onChange={(e) => setTitle(e.target.value)} required />
              
              <label>Описание:</label>
              <textarea placeholder="Подробное описание задачи" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              
              <label>Проект:</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">Без проекта</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <label>Теги для задачи (кликните для выбора):</label>
              <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                
                <div style={{ maxHeight: '150px', overflowY: 'auto', backgroundColor: 'transparent' }}>
                  {tags.length === 0 ? (
                    <p style={{ padding: '10px', color: '#6b7280', margin: 0, fontSize: '13px' }}>Тегов пока нет. Создайте первый ниже.</p>
                  ) : (
                    tags.map(t => {
                      const isSelected = selectedTagIds.includes(t.id);
                      return (
                        <div 
                          key={t.id} 
                          onClick={() => handleToggleTagSelection(t.id)}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '8px 12px', 
                            borderBottom: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                            color: isSelected ? '#111827' : 'inherit', // Цвет текста при включенной темной теме меняется на темный
                            transition: 'background-color 0.2s, color 0.2s'
                          }}
                        >
                          <span style={{ fontSize: '14px', fontWeight: isSelected ? '600' : 'normal' }}>
                            {isSelected ? 'v ' : ''}#{t.name}
                          </span>
                          <button 
                            type="button"
                            onClick={(e) => handleDeleteTag(t.id, e)}
                            style={{ 
                              backgroundColor: '#ef4444', 
                              padding: '2px 6px', 
                              fontSize: '10px', 
                              margin: 0 
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', padding: '10px', borderTop: '1px solid #d1d5db', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <input 
                    type="text" 
                    placeholder="Новый тег" 
                    value={newTagName} 
                    onChange={(e) => setNewTagName(e.target.value)} 
                    style={{ margin: 0, padding: '8px' }}
                  />
                  <button 
                    type="button" 
                    onClick={handleCreateTag}
                    style={{ backgroundColor: '#10b981', padding: '8px 12px', whiteSpace: 'nowrap' }}
                  >
                    Добавить тег
                  </button>
                </div>
              </div>

              <label>Дедлайн:</label>
              <input type="date" value={dueDate} min={getTodayDateString()} max={getMaxDateString()} onChange={(e) => setDueDate(e.target.value)} />

              <label>Статус:</label>
              {/* Статус 'done' (Готово) удален из выбора */}
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="todo">К выполнению</option>
                <option value="in_progress">В процессе</option>
              </select>

              <button type="submit" style={{ width: '100%' }}>Создать задачу</button>
            </form>
          </div>
        </div>

        <div style={{ flex: 2 }}>
          <h3>Все задачи</h3>
          {tasks.length === 0 ? (
            <p>Задач пока нет. Добавьте первую задачу слева.</p>
          ) : (
            <div className="tasks-grid">
              {tasks.map(task => (
                <div key={task.id} className="card" style={{ margin: 0, borderLeft: '5px solid #3b82f6', position: 'relative' }}>
                  
                  {/* Кнопка "Удалить" */}
                  <button 
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    style={{ 
                      position: 'absolute', 
                      top: '10px', 
                      right: '10px', 
                      backgroundColor: '#ef4444', 
                      padding: '4px 8px', 
                      fontSize: '11px' 
                    }}
                  >
                    Удалить
                  </button>

                  {/* Кнопка "Закрыть задачу" (отображается только если статус не равен 'done') */}
                  {task.status !== 'done' && (
                    <button 
                      onClick={(e) => handleCloseTask(task.id, e)}
                      style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '80px', 
                        backgroundColor: '#10b981', 
                        padding: '4px 8px', 
                        fontSize: '11px' 
                      }}
                    >
                      Закрыть
                    </button>
                  )}

                  <Link to={`/task/${task.id}`} state={{ from: '/' }} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h4 style={{ margin: '0 0 10px 0', paddingRight: '140px' }}>{task.title}</h4>
                    <p style={{ margin: '5px 0' }}>Статус: <strong>{task.status === 'todo' ? 'К выполнению' : task.status === 'in_progress' ? 'В процессе' : 'Готово'}</strong></p>
                    {task.due_date && <p style={{ fontSize: '13px', color: '#dc2626', margin: '5px 0' }}>Срок: {task.due_date}</p>}
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '5px 0' }}>Проект: {task.project_name || 'Без проекта'}</p>
                    
                    <div style={{ marginTop: '10px' }}>
                      {task.tags && task.tags.map(tag => (
                        <span key={tag.id} className="tag-badge">#{tag.name}</span>
                      ))}
                    </div>
                  </Link>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}