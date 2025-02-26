import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getActivities, addActivity, deleteActivity, checkActivityAssignments, removeActivityAssignments } from '../../lib/db';
import PlusIcon from '../common/icons/PlusIcon';
import { CALENDAR_RELOAD_EVENT } from '../calendar/Calendar';

export default function ActivitiesPanel() {
  const [activities, setActivities] = useState([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    day: 1,
    time: '15:00',
    location: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [hasAssignments, setHasAssignments] = useState(false);

  useEffect(() => {
    loadActivities();
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
      await addActivity(newActivity);
      setNewActivity({ name: '', day: 1, time: '15:00', location: '' });
      setIsAddingActivity(false);
      loadActivities();
    } catch (err) {
      setError('Failed to add activity. Please try again.');
      console.error('Error adding activity:', err);
    }
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
        <h2>Activities</h2>
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
            placeholder="Activity Name"
            value={newActivity.name}
            onChange={e => setNewActivity({...newActivity, name: e.target.value})}
            required
          />
          <select
            value={newActivity.day}
            onChange={e => setNewActivity({...newActivity, day: parseInt(e.target.value)})}
            required
          >
            <option value={1}>Monday</option>
            <option value={2}>Tuesday</option>
            <option value={3}>Wednesday</option>
            <option value={4}>Thursday</option>
            <option value={5}>Friday</option>
            <option value={6}>Saturday</option>
            <option value={7}>Sunday</option>
          </select>
          <input
            type="time"
            value={newActivity.time}
            onChange={e => setNewActivity({...newActivity, time: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={newActivity.location}
            onChange={e => setNewActivity({...newActivity, location: e.target.value})}
            required
          />
          <div className="panel__form-actions">
            <button type="submit" className="button button--primary">Save</button>
            <button 
              type="button" 
              className="button button--secondary"
              onClick={() => setIsAddingActivity(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="panel__list">
        {isLoading ? (
          <div className="panel__loading">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="panel__empty">No activities added yet</div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="panel__list-item">
              <div className="panel__list-item-content">
                <span className="panel__list-item-name">{activity.name}</span>
                <div className="panel__list-item-details">
                  <span>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][activity.day - 1]}</span>
                  <span>{format(new Date(`2000-01-01T${activity.time}`), 'h:mm a')}</span>
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