import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../api';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Состояния для режима редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('todo');
  const [editDueDate, setEditDueDate] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editTagIds, setEditTagIds] = useState([]);

  // Опции для выпадающих списков
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');

  const fetchData = async () => {
    try {
      const taskResponse = await API.get(`tasks/${id}/`);
      setTask(taskResponse.data);

      setEditTitle(taskResponse.data.title);
      setEditDescription(taskResponse.data.description || '');
      setEditStatus(taskResponse.data.status);
      setEditDueDate(taskResponse.data.due_date || '');
      setEditProjectId(taskResponse.data.project || '');
      setEditTagIds(taskResponse.data.tags ? taskResponse.data.tags.map(t => t.id) : []);

      const projectsRes = await API.get('projects/');
      const tagsRes = await API.get('tags/');
      setProjects(projectsRes.data);
      setTags(tagsRes.data);
    } catch (err) {
      setError('Не удалось загрузить подробную информацию о задаче.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // ДИНАМИЧЕСКИЙ ВОЗВРАТ НАЗАД (поддерживает Projects, Dashboard и Calendar)
  const handleBack = () => {
    if (location.state?.from === '/projects' && location.state?.project) {
      navigate('/projects', { state: { returnToProject: location.state.project } });
    } else if (location.state?.from === '/calendar' && location.state?.selectedDateStr) {
      navigate('/calendar', { state: { returnToDate: location.state.selectedDateStr } });
    } else if (location.state?.from === '/profile') {
      navigate('/profile'); // Поддержка возврата в профиль
    } else {
      navigate('/dashboard'); // Изменено на /dashboard
    }
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Вы действительно хотите удалить эту задачу?')) {
      try {
        await API.delete(`tasks/${id}/`);
        handleBack();
      } catch (err) {
        setError('Не удалось удалить задачу.');
      }
    }
  };

  const handleCloseTask = async () => {
    try {
      const response = await API.patch(`tasks/${id}/`, { status: 'done' });
      setTask(response.data);
    } catch (err) {
      setError('Не удалось закрыть задачу.');
    }
  };

  const handleToggleTagSelection = (tagId) => {
    setEditTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await API.post('tags/', { name: newTagName });
      setNewTagName('');
      const tagsRes = await API.get('tags/');
      setTags(tagsRes.data);
    } catch (err) {
      setError('Ошибка при создании тега.');
    }
  };

  const handleDeleteTag = async (tagId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Вы действительно хотите удалить этот тег во всей системе?')) {
      try {
        await API.delete(`tags/${tagId}/`);
        setEditTagIds(prev => prev.filter(id => id !== tagId));
        const tagsRes = await API.get('tags/');
        setTags(tagsRes.data);
      } catch (err) {
        setError('Не удалось удалить тег.');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        due_date: editDueDate || null,
        project: editProjectId || null,
        tag_ids: editTagIds
      };
      
      const response = await API.put(`tasks/${id}/`, updatedData);
      setTask(response.data);
      setIsEditing(false);
    } catch (err) {
      setError('Не удалось сохранить изменения.');
    }
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditStatus(task.status);
    setEditDueDate(task.due_date || '');
    setEditProjectId(task.project || '');
    setEditTagIds(task.tags ? task.tags.map(t => t.id) : []);
    setIsEditing(false);
  };

  if (loading) return <div className="card">Загрузка информации о задаче...</div>;
  if (error) return <div className="card" style={{ color: '#dc2626' }}>{error}</div>;
  if (!task) return <div className="card">Задача не найдена.</div>;

  if (isEditing) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '20px auto' }}>
        <h2>Редактирование задачи</h2>
        {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        <hr style={{ borderColor: '#e5e7eb', margin: '15px 0' }} />
        
        <form onSubmit={handleSave}>
          <label>Заголовок задачи:</label>
          <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />

          <label>Описание:</label>
          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}></textarea>

          <label>Проект:</label>
          <select value={editProjectId} onChange={(e) => setEditProjectId(e.target.value)}>
            <option value="">Без проекта</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <label>Теги для задачи (кликните для выбора):</label>
          <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
            
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {tags.length === 0 ? (
                <p style={{ padding: '10px', color: '#6b7280', margin: 0, fontSize: '13px' }}>Тегов пока нет.</p>
              ) : (
                tags.map(t => {
                  const isSelected = editTagIds.includes(t.id);
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
                        color: isSelected ? '#111827' : 'inherit',
                        transition: 'background-color 0.2s, color 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: isSelected ? '600' : 'normal' }}>
                        {isSelected ? 'v ' : ''}#{t.name}
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteTag(t.id, e)}
                        style={{ backgroundColor: '#ef4444', padding: '2px 6px', fontSize: '10px', margin: 0 }}
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
          {/* Фронтенд ограничение на 10 лет при редактировании сохраняется */}
          <input type="date" value={editDueDate} min={getTodayDateString()} max={getMaxDateString()} onChange={(e) => setEditDueDate(e.target.value)} />

          <label>Статус:</label>
          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
            <option value="todo">К выполнению</option>
            <option value="in_progress">В процессе</option>
          </select>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" style={{ backgroundColor: '#10b981' }}>Сохранить изменения</button>
            <button type="button" onClick={handleCancel} style={{ backgroundColor: '#4b5563' }}>Отмена</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '20px auto' }}>
      <h2>Детали задачи</h2>
      <hr style={{ borderColor: '#e5e7eb', margin: '15px 0' }} />
      
      <h3 style={{ marginTop: 0 }}>{task.title}</h3>
      
      <p><strong>Описание:</strong></p>
      <p className="description-block">
        {task.description || 'Описание отсутствует.'}
      </p>

      <p><strong>Статус:</strong> {' '}
        <span style={{ fontWeight: 'bold' }}>
          {task.status === 'todo' ? 'К выполнению' : task.status === 'in_progress' ? 'В процессе' : 'Готово'}
        </span>
      </p>

      {task.due_date && (
        <p><strong>Срок выполнения (Дедлайн):</strong> {' '}
          <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{task.due_date}</span>
        </p>
      )}

      <p><strong>Проект:</strong> {task.project_name || 'Без проекта'}</p>

      {task.tags && task.tags.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <p><strong>Теги:</strong></p>
          <div>
            {task.tags.map(tag => (
              <span key={tag.id} className="tag-badge">#{tag.name}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleBack} style={{ backgroundColor: '#4b5563' }}>
          Назад
        </button>

        {task.status !== 'done' && (
          <button onClick={handleCloseTask} style={{ backgroundColor: '#10b981' }}>
            Выполнить задачу
          </button>
        )}

        <button onClick={() => setIsEditing(true)} style={{ backgroundColor: '#3b82f6' }}>
          Редактировать
        </button>
        
        <button onClick={handleDeleteTask} style={{ backgroundColor: '#ef4444' }}>
          Удалить задачу
        </button>
      </div>
    </div>
  );
}

// Вспомогательные функции валидации дат
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
  if (mm === '02' && dd === '29') {
    const isLeap = (yyyy % 4 === 0 && yyyy % 100 !== 0) || (yyyy % 400 === 0);
    if (!isLeap) return `${yyyy}-02-28`;
  }
  return `${yyyy}-${mm}-${dd}`;
};