import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api';

export default function ProjectPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [tags, setTags] = useState([]);

  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjName, setEditProjName] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskDueDate, setTaskDueDate] = useState('');
  
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [newTagName, setNewTagName] = useState('');

  const token = localStorage.getItem('token');

  const fetchProjects = async () => {
    try {
      const response = await API.get('projects/');
      setProjects(response.data);
    } catch (err) {
      setError('Не удалось загрузить проекты.');
    }
  };

  const fetchTags = async () => {
    try {
      const response = await API.get('tags/');
      setTags(response.data);
    } catch (err) {
      setError('Не удалось загрузить теги.');
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchTags();
    }
  }, [token]);

  useEffect(() => {
    if (projects.length > 0 && location.state?.returnToProject && !selectedProject) {
      const proj = projects.find(p => p.id === location.state.returnToProject.id);
      if (proj) {
        handleSelectProject(proj);
        navigate('/projects', { replace: true, state: null });
      }
    }
  }, [projects, location.state, selectedProject, navigate]);

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    setEditProjName(project.name);
    setEditProjDesc(project.description || '');
    setIsEditingProject(false);
    try {
      const response = await API.get(`tasks/?project=${project.id}`);
      setProjectTasks(response.data);
    } catch (err) {
      setError('Не удалось загрузить задачи проекта.');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await API.post('projects/', { name, description });
      setName('');
      setDescription('');
      fetchProjects(); 
    } catch (err) {
      setError('Ошибка при создании проекта.');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await API.put(`projects/${selectedProject.id}/`, {
        name: editProjName,
        description: editProjDesc
      });
      setSelectedProject(response.data);
      setIsEditingProject(false);
      fetchProjects();
    } catch (err) {
      setError('Не удалось обновить проект.');
    }
  };

  const handleDeleteProject = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Вы действительно хотите удалить этот проект и все его задачи?')) {
      try {
        await API.delete(`projects/${id}/`);
        if (selectedProject?.id === id) {
          setSelectedProject(null);
        }
        fetchProjects();
      } catch (err) {
        setError('Не удалось удалить проект.');
      }
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
      fetchTags();
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
        setSelectedTagIds(prev => prev.filter(id => id !== tagId));
        fetchTags();
      } catch (err) {
        setError('Не удалось удалить тег.');
      }
    }
  };

  const handleCreateTaskInProject = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        title: taskTitle,
        description: taskDesc,
        status: taskStatus,
        due_date: taskDueDate || null,
        project: selectedProject.id,
        tag_ids: selectedTagIds
      };
      await API.post('tasks/', taskData);
      
      setTaskTitle('');
      setTaskDesc('');
      setTaskStatus('todo');
      setTaskDueDate('');
      setSelectedTagIds([]);
      
      handleSelectProject(selectedProject);
    } catch (err) {
      setError('Ошибка при создании задачи.');
    }
  };

  const handleDeleteTaskInProject = async (taskId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Вы действительно хотите удалить эту задачу?')) {
      try {
        await API.delete(`tasks/${taskId}/`);
        handleSelectProject(selectedProject);
      } catch (err) {
        setError('Не удалось удалить задачу.');
      }
    }
  };

  const handleCloseTaskInProject = async (taskId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await API.patch(`tasks/${taskId}/`, { status: 'done' });
      handleSelectProject(selectedProject);
    } catch (err) {
      setError('Не удалось закрыть задачу.');
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
        <p>Для работы с проектами необходимо авторизоваться на странице Профиль.</p>
      </div>
    );
  }

  // Разделение задач проекта на активные и выполненные
  const activeTasks = projectTasks.filter(t => t.status !== 'done');
  const completedTasks = projectTasks.filter(t => t.status === 'done');

  if (selectedProject) {
    return (
      <div>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          {isEditingProject ? (
            <form onSubmit={handleUpdateProject} style={{ flex: 1, marginRight: '20px' }}>
              <label>Название проекта:</label>
              <input type="text" value={editProjName} onChange={(e) => setEditProjName(e.target.value)} required />
              <label>Описание проекта:</label>
              <textarea value={editProjDesc} onChange={(e) => setEditProjDesc(e.target.value)}></textarea>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ backgroundColor: '#10b981' }}>Сохранить проект</button>
                <button type="button" onClick={() => setIsEditingProject(false)} style={{ backgroundColor: '#4b5563' }}>Отмена</button>
              </div>
            </form>
          ) : (
            <div>
              <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 'bold' }}>ПЕРСОНАЛЬНЫЙ ДАШБОРД</span>
              <h1 style={{ margin: '5px 0 0 0' }}>Проект: {selectedProject.name}</h1>
              <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>{selectedProject.description || 'Описание отсутствует'}</p>
            </div>
          )}
          
          {!isEditingProject && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsEditingProject(true)} style={{ backgroundColor: '#3b82f6' }}>
                Редактировать проект
              </button>
              <button onClick={() => setSelectedProject(null)} style={{ backgroundColor: '#4b5563' }}>
                Назад к списку проектов
              </button>
            </div>
          )}
        </div>

        {error && <p style={{ color: '#dc2626' }}>{error}</p>}

        <div className="flex-container" style={{ display: 'flex', gap: '20px' }}>
          
          <div style={{ flex: 1 }}>
            <div className="card">
              <h3>Добавить задачу в проект</h3>
              <form onSubmit={handleCreateTaskInProject}>
                <label>Заголовок задачи:</label>
                <input type="text" placeholder="Что сделать по этому проекту?" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
                
                <label>Описание:</label>
                <textarea placeholder="Подробное описание" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}></textarea>
                
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
                              color: isSelected ? '#111827' : 'inherit',
                              transition: 'background-color 0.2s, color 0.2s'
                            }}
                          >
                            <span style={{ fontSize: '14px', fontWeight: isSelected ? '600' : 'normal' }}>
                              {isSelected ? '✓ ' : ''}#{t.name}
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
                <input type="date" value={taskDueDate} min={getTodayDateString()} max={getMaxDateString()} onChange={(e) => setTaskDueDate(e.target.value)} />

                <label>Статус:</label>
                <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
                  <option value="todo">К выполнению</option>
                  <option value="in_progress">В процессе</option>
                </select>

                <button type="submit" style={{ width: '100%', backgroundColor: '#10b981' }}>Создать задачу</button>
              </form>
            </div>
          </div>

          <div style={{ flex: 2 }}>
            {/* Активные задачи проекта */}
            <h3>Активные задачи проекта ({activeTasks.length})</h3>
            {activeTasks.length === 0 ? (
              <p>В этом проекте пока нет активных задач. Добавьте первую задачу слева.</p>
            ) : (
              <div className="tasks-grid">
                {activeTasks.map(task => (
                  <div key={task.id} className="card" style={{ margin: 0, borderLeft: '5px solid #10b981', position: 'relative' }}>
                    <button 
                      onClick={(e) => handleDeleteTaskInProject(task.id, e)}
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

                    {task.status !== 'done' && (
                      <button 
                        onClick={(e) => handleCloseTaskInProject(task.id, e)}
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

                    <Link 
                      to={`/task/${task.id}`} 
                      state={{ from: '/projects', project: selectedProject }} 
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <h4 style={{ margin: '0 0 10px 0', paddingRight: '140px' }}>{task.title}</h4>
                      <p style={{ margin: '5px 0' }}>Статус: <strong>{task.status === 'todo' ? 'К выполнению' : task.status === 'in_progress' ? 'В процессе' : 'Готово'}</strong></p>
                      {task.due_date && <p style={{ fontSize: '12px', color: '#dc2626', margin: '5px 0' }}>Срок: {task.due_date}</p>}
                      
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

            {/* Выполненные задачи проекта в выпадающем списке */}
            {completedTasks.length > 0 && (
              <details style={{ marginTop: '30px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', outline: 'none' }}>
                  Выполненные задачи проекта ({completedTasks.length})
                </summary>
                <div className="tasks-grid" style={{ marginTop: '15px' }}>
                  {completedTasks.map(task => (
                    <div key={task.id} className="card" style={{ margin: 0, borderLeft: '5px solid #10b981', position: 'relative' }}>
                      <button 
                        onClick={(e) => handleDeleteTaskInProject(task.id, e)}
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

                      <Link 
                        to={`/task/${task.id}`} 
                        state={{ from: '/projects', project: selectedProject }} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <h4 style={{ margin: '0 0 10px 0', paddingRight: '80px', textDecoration: 'line-through', color: '#6b7280' }}>
                          {task.title}
                        </h4>
                        <p style={{ margin: '5px 0' }}>Статус: <strong>Готово</strong></p>
                        {task.due_date && <p style={{ fontSize: '12px', color: '#dc2626', margin: '5px 0' }}>Срок: {task.due_date}</p>}
                        
                        <div style={{ marginTop: '10px' }}>
                          {task.tags && task.tags.map(tag => (
                            <span key={tag.id} className="tag-badge">#{tag.name}</span>
                          ))}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Мои Проекты</h1>
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      
      <div className="flex-container" style={{ display: 'flex', gap: '20px' }}>
        
        <div style={{ flex: 1 }}>
          <div className="card" style={{ height: 'fit-content' }}>
            <h3>Создать новый проект</h3>
            <form onSubmit={handleCreateProject}>
              <label>Название проекта:</label>
              <input type="text" placeholder="Например: Работа" value={name} onChange={(e) => setName(e.target.value)} required />
              <label>Описание проекта:</label>
              <textarea placeholder="Описание целей проекта" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              <button type="submit" style={{ width: '100%' }}>Создать проект</button>
            </form>
          </div>
        </div>

        <div style={{ flex: 2 }}>
          <h3>Список проектов (кликните для перехода в дашборд)</h3>
          {projects.length === 0 ? (
            <p>Проектов пока нет. Создайте первый проект слева.</p>
          ) : (
            <div className="tasks-grid">
              {projects.map(proj => (
                <div 
                  key={proj.id} 
                  className="card" 
                  onClick={() => handleSelectProject(proj)}
                  style={{ margin: 0, cursor: 'pointer', position: 'relative', borderLeft: '5px solid #3b82f6' }}
                >
                  <button 
                    onClick={(e) => handleDeleteProject(proj.id, e)}
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

                  <h4 style={{ margin: '0 0 10px 0', paddingRight: '60px' }}>{proj.name}</h4>
                  <p style={{ color: '#4b5563', fontSize: '13px', margin: 0 }}>{proj.description || 'Описание отсутствует'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

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