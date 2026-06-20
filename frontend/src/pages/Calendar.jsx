import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api';

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function Calendar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [projectId, setProjectId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const formatDateStr = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchData = async () => {
    try {
      const tasksRes = await API.get('tasks/');
      const projectsRes = await API.get('projects/');
      const tagsRes = await API.get('tags/');
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setTags(tagsRes.data);

      if (location.state?.returnToDate) {
        const dateStr = location.state.returnToDate;
        const dateParts = dateStr.split('-');
        const returnDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        
        setCurrentDate(returnDate);
        setSelectedDateStr(dateStr);
        setSelectedDateTasks(tasksRes.data.filter(t => t.due_date === dateStr));
        
        navigate('/calendar', { replace: true, state: null });
      }
    } catch (err) {
      setError('Не удалось загрузить данные планировщика.');
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, location.state]);

  const handlePrevMonth = () => {
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 10);
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    if (prevMonth >= minDate) {
      setCurrentDate(prevMonth);
    }
  };

  const handleNextMonth = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    if (nextMonth <= maxDate) {
      setCurrentDate(nextMonth);
    }
  };

  const minLimitDate = new Date();
  minLimitDate.setFullYear(minLimitDate.getFullYear() - 10);
  const isPrevMonthBlocked = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1) < minLimitDate;

  const maxLimitDate = new Date();
  maxLimitDate.setFullYear(maxLimitDate.getFullYear() + 10);
  const isNextMonthBlocked = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) > maxLimitDate;

  const todayStr = formatDateStr(new Date());
  const isSelectedDateInPast = selectedDateStr < todayStr;

  const handleCellClick = (cellDate) => {
    const dateStr = formatDateStr(cellDate);
    setSelectedDateStr(dateStr);
    setIsAddingTask(false); 
    setSelectedDateTasks(tasks.filter(t => t.due_date === dateStr));
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
    if (window.confirm('Вы действительно хотите удалить этот тег во всей системе?')) {
      try {
        await API.delete(`tags/${tagId}/`);
        setSelectedTagIds(prev => prev.filter(id => id !== tagId));
        fetchData();
      } catch (err) {
        setError('Не удалось удалить тег.');
      }
    }
  };

  const handleCreateTaskInCalendar = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        title: taskTitle,
        description: taskDesc,
        status: taskStatus,
        due_date: selectedDateStr, 
        project: projectId || null,
        tag_ids: selectedTagIds,
      };
      await API.post('tasks/', taskData);
      
      setTaskTitle('');
      setTaskDesc('');
      setTaskStatus('todo');
      setProjectId('');
      setSelectedTagIds([]);
      setIsAddingTask(false); 
      fetchData(); 
    } catch (err) {
      setError('Ошибка при создании задачи.');
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    
    const cells = [];
    
    for (let i = startDayOffset - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false,
      });
    }
    
    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    const totalCells = cells.length > 35 ? 42 : 35;
    const remainingCells = totalCells - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return cells;
  };

  if (!token) {
    return (
      <div className="card" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Доступ ограничен</h2>
        <p>Для просмотра календаря необходимо авторизоваться на странице Профиль.</p>
      </div>
    );
  }

  const dayCells = getDaysInMonth();

  const activeTasks = selectedDateTasks.filter(t => t.status !== 'done');
  const completedTasks = selectedDateTasks.filter(t => t.status === 'done');

  return (
    <div>
      {/* Шапка календаря */}
      <div className="card" style={{ margin: 0, marginBottom: '20px' }}>
        <div className="calendar-top-bar">
          <button 
            onClick={handlePrevMonth} 
            disabled={isPrevMonthBlocked}
            style={{ 
              backgroundColor: isPrevMonthBlocked ? '#9ca3af' : '#4b5563',
              cursor: isPrevMonthBlocked ? 'not-allowed' : 'pointer'
            }}
          >
            Пред. месяц
          </button>
          <h2 style={{ margin: 0 }}>
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button 
            onClick={handleNextMonth} 
            disabled={isNextMonthBlocked}
            style={{ 
              backgroundColor: isNextMonthBlocked ? '#9ca3af' : '#4b5563',
              cursor: isNextMonthBlocked ? 'not-allowed' : 'pointer'
            }}
          >
            След. месяц
          </button>
        </div>

        {error && <p style={{ color: '#dc2626' }}>{error}</p>}

        <div className="calendar-grid" style={{ marginBottom: '10px' }}>
          {WEEKDAY_NAMES.map(name => (
            <div key={name} className="calendar-header-cell">{name}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {dayCells.map((cell, idx) => {
            const cellDateStr = formatDateStr(cell.date);
            const isSelected = selectedDateStr === cellDateStr;
            const dayTasks = tasks.filter(t => t.due_date === cellDateStr);

            return (
              <div 
                key={idx} 
                onClick={() => handleCellClick(cell.date)}
                className={`calendar-cell ${!cell.isCurrentMonth ? 'inactive' : ''} ${isSelected ? 'selected' : ''}`}
              >
                <span className="calendar-cell-num">{cell.date.getDate()}</span>
                
                <div className="calendar-badges">
                  {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} className={`task-badge-compact ${task.status}`}>
                      {task.title.length > 10 ? `${task.title.slice(0, 8)}...` : task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="task-badge-more">+ еще {dayTasks.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Панель детального просмотра и добавления задач для выбранного дня */}
      {selectedDateStr && (
        <div style={{ display: 'flex', gap: '20px' }} className="flex-container">
          
          {/* Левый блок: Форма добавления задачи (теперь первая в DOM) */}
          {isAddingTask && !isSelectedDateInPast && (
            <div className="card" style={{ flex: 1, margin: 0, height: 'fit-content' }}>
              <h3>Добавить задачу на {new Date(selectedDateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' })}</h3>
              <form onSubmit={handleCreateTaskInCalendar}>
                <label>Заголовок задачи:</label>
                <input type="text" placeholder="Что нужно сделать?" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
                
                <label>Описание:</label>
                <textarea placeholder="Подробное описание задачи" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}></textarea>
                
                <label>Проект:</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">Без проекта</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <label>Теги для задачи (кликните для выбора):</label>
                <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {tags.map(t => {
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
                          <span>{isSelected ? '[выбран] ' : ''}#{t.name}</span>
                          <button 
                            type="button"
                            onClick={(e) => handleDeleteTag(t.id, e)}
                            style={{ backgroundColor: '#ef4444', padding: '2px 6px', fontSize: '10px', margin: 0 }}
                          >
                            Удалить
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', padding: '10px', borderTop: '1px solid #d1d5db', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <input 
                      type="text" 
                      placeholder="Новый тег" 
                      value={newTagName} 
                      onChange={(e) => setNewTagName(e.target.value)} 
                      style={{ margin: 0, padding: '8px' }}
                    />
                    <button type="button" onClick={handleCreateTag} style={{ backgroundColor: '#10b981', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      Добавить тег
                    </button>
                  </div>
                </div>

                <label>Статус:</label>
                <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
                  <option value="todo">К выполнению</option>
                  <option value="in_progress">В процессе</option>
                </select>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" style={{ backgroundColor: '#10b981' }}>Создать</button>
                  <button type="button" onClick={() => setIsAddingTask(false)} style={{ backgroundColor: '#4b5563' }}>Отмена</button>
                </div>
              </form>
            </div>
          )}

          {/* Правый блок: Списки задач на день (теперь второй в DOM) */}
          <div className="card" style={{ flex: 2, margin: 0 }}>
            <h3>Задачи на {new Date(selectedDateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}:</h3>
            
            <h4>Активные задачи</h4>
            {activeTasks.length === 0 ? (
              <p>На этот день активных задач нет.</p>
            ) : (
              <div className="tasks-grid">
                {activeTasks.map(task => (
                  <div key={task.id} className="card" style={{ margin: 0, borderLeft: '5px solid #3b82f6' }}>
                    <Link to={`/task/${task.id}`} state={{ from: '/calendar', selectedDateStr: selectedDateStr }} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>{task.title}</h4>
                      <p style={{ margin: '5px 0' }}>Статус: <strong>{task.status === 'todo' ? 'К выполнению' : task.status === 'in_progress' ? 'В процессе' : 'Готово'}</strong></p>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '5px 0' }}>Проект: {task.project_name || 'Без проекта'}</p>
                      <div>
                        {task.tags && task.tags.map(tag => (
                          <span key={tag.id} className="tag-badge">#{tag.name}</span>
                        ))}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {completedTasks.length > 0 && (
              <details style={{ marginTop: '25px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', outline: 'none' }}>
                  Выполненные задачи дня ({completedTasks.length})
                </summary>
                <div className="tasks-grid" style={{ marginTop: '15px' }}>
                  {completedTasks.map(task => (
                    <div key={task.id} className="card" style={{ margin: 0, borderLeft: '5px solid #10b981' }}>
                      <Link to={`/task/${task.id}`} state={{ from: '/calendar', selectedDateStr: selectedDateStr }} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h4 style={{ margin: '0 0 10px 0', textDecoration: 'line-through', color: '#6b7280' }}>
                          {task.title}
                        </h4>
                        <p style={{ margin: '5px 0' }}>Статус: <strong>Готово</strong></p>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '5px 0' }}>Проект: {task.project_name || 'Без проекта'}</p>
                        <div>
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

            {!isAddingTask && (
              <button 
                onClick={() => setIsAddingTask(true)} 
                disabled={isSelectedDateInPast}
                style={{ 
                  backgroundColor: isSelectedDateInPast ? '#9ca3af' : '#10b981', 
                  marginTop: '25px', 
                  width: '100%',
                  cursor: isSelectedDateInPast ? 'not-allowed' : 'pointer'
                }}
              >
                {isSelectedDateInPast ? 'Планирование на прошедшие дни заблокировано' : 'Добавить задачу на этот день'}
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}