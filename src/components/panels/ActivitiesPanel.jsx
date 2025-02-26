import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getActivities, addActivity, deleteActivity, checkActivityAssignments, removeActivityAssignments, updateActivity } from '../../lib/db';
import PlusIcon from '../common/icons/PlusIcon';
import { CALENDAR_RELOAD_EVENT, CALENDAR_DATE_EVENT } from '../calendar/Calendar';

export default function ActivitiesPanel() {
  const [activities, setActivities] = useState([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    day: 1,
    time: '15:00',
    location: '',
    is_recurring: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [hasAssignments, setHasAssignments] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(null);

  useEffect(() => {
    loadActivities();
    
    // Listen for calendar date changes
    const handleCalendarDateChange = (e) => {
      setCurrentCalendarDate(e.detail.date);
    };
    
    window.addEventListener(CALENDAR_DATE_EVENT, handleCalendarDateChange);
    
    return () => {
      window.removeEventListener(CALENDAR_DATE_EVENT, handleCalendarDateChange);
    };
  }, []);

  async function loadActivities() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getActivities();
      setActivities(data);
    } catch (err) {
      setError('Failed to load activities. Please try again later.');
      console.error('Error loading activities:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddActivity(e) {
    e.preventDefault();
    try {
      setError(null);
      if (editingActivityId) {
        // Update existing activity
        await updateActivity(editingActivityId, newActivity);
      } else {
        // Add new activity
        const activityToAdd = { ...newActivity };
        
        // If it's a one-off activity and we have a calendar date, use it
        if (!activityToAdd.is_recurring && currentCalendarDate) {
          // Calculate the correct date based on the selected day of week
          // currentCalendarDate is the start of the week (Monday)
          const startDate = new Date(currentCalendarDate);
          const targetDay = activityToAdd.day; // 1-7 (Mon-Sun)
          
          // Add days to the start date to get to the selected day
          // Monday is day 1, so we subtract 1 to get the correct offset
          const daysToAdd = targetDay - 1;
          startDate.setDate(startDate.getDate() + daysToAdd);
          
          activityToAdd.targetDate = startDate.toISOString().split('T')[0];
        }
        
        await addActivity(activityToAdd);
      }
      setNewActivity({ name: '', day: 1, time: '15:00', location: '', is_recurring: true });
      setIsAddingActivity(false);
      setEditingActivityId(null);
      loadActivities();
      
      // Trigger calendar reload
      window.dispatchEvent(new Event(CALENDAR_RELOAD_EVENT));
    } catch (err) {
      setError(`Failed to ${editingActivityId ? 'update' : 'add'} activity. Please try again.`);
      console.error(`Error ${editingActivityId ? 'updating' : 'adding'} activity:`, err);
    }
  }

  function handleEditActivity(activity) {
    setNewActivity({
      name: activity.name,
      day: activity.day,
      time: activity.time,
      location: activity.location
    });
    setEditingActivityId(activity.id);
    setIsAddingActivity(true);
  }

  function handleCancelEdit() {
    setNewActivity({ name: '', day: 1, time: '15:00', location: '', is_recurring: true });
    setIsAddingActivity(false);
    setEditingActivityId(null);
  }

  async function handleDeleteActivity(id, removeAssignmentsFirst = false) {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        setError(null);
        
        if (removeAssignmentsFirst) {
          await removeActivityAssignments(id);
        }
        
        await deleteActivity(id);
        setConfirmingDelete(null);
        setHasAssignments(false);
        loadActivities();
        
        // Trigger calendar reload
        window.dispatchEvent(new Event(CALENDAR_RELOAD_EVENT));
      } catch (err) {
        setError('Failed to delete activity. Please try again.');
        console.error('Error deleting activity:', err);
      }
    }
  }

  return (
    <div className="panel activities-panel">
      <div className="panel__header">
        <h2>Aktiviteter</h2>
        <button 
          className="button button--add"
          onClick={() => setIsAddingActivity(true)}
        >
          <PlusIcon />
        </button>
      </div>

      {error && (
        <div className="panel__error">
          {error}
        </div>
      )}

      {isAddingActivity && (
        <form className="panel__form" onSubmit={handleAddActivity}>
          <input
            type="text"
            placeholder="Aktivitetsnamn"
            value={newActivity.name}
            onChange={e => setNewActivity({...newActivity, name: e.target.value})}
            required
          />
          <select
            value={newActivity.day}
            onChange={e => setNewActivity({...newActivity, day: parseInt(e.target.value)})}
            required
          >
            <option value={1}>Måndag</option>
            <option value={2}>Tisdag</option>
            <option value={3}>Onsdag</option>
            <option value={4}>Torsdag</option>
            <option value={5}>Fredag</option>
            <option value={6}>Lördag</option>
            <option value={7}>Söndag</option>
          </select>
          <input
            type="time"
            value={newActivity.time}
            onChange={e => setNewActivity({...newActivity, time: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Plats"
            value={newActivity.location}
            onChange={e => setNewActivity({...newActivity, location: e.target.value})}
            required
          />
          
          {!editingActivityId && (
            <div className="panel__form-check">
              <input
                type="checkbox"
                id="is_recurring"
                checked={newActivity.is_recurring}
                onChange={e => setNewActivity({...newActivity, is_recurring: e.target.checked})}
              />
              <label htmlFor="is_recurring">Återkommande</label>
            </div>
          )}
          
          <div className="panel__form-actions">
            <button type="submit" className="button button--primary">
              {editingActivityId ? 'Uppdatera' : 'Spara'}
            </button>
            <button 
              type="button" 
              className="button button--secondary"
              onClick={handleCancelEdit}
            >
              Avbryt
            </button>
          </div>
        </form>
      )}

      <div className="panel__list">
        {isLoading ? (
          <div className="panel__loading">Laddar aktiviteter...</div>
        ) : activities.length === 0 ? (
          <div className="panel__empty">Inga aktiviteter tillagda ännu</div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="panel__list-item">
              <div 
                className="panel__list-item-content"
                onClick={() => handleEditActivity(activity)}
              >
                <span className="panel__list-item-name">{activity.name}</span>
                <div className="panel__list-item-details">
                  <span>{['Mån','Tis','Ons','Tor','Fre','Lör','Sön'][activity.day - 1]}</span>
                  <span>{format(new Date(`2000-01-01T${activity.time}`), 'HH:mm')}</span>
                  <span>{activity.location}</span>
                </div>
              </div>
              <button 
                className="button button--delete"
                onClick={() => handleDeleteActivity(activity.id)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 