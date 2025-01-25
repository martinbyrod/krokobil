import { useState, useEffect } from 'react';
import { getActivities, addActivity, deleteActivity } from '../../lib/db';

export default function ActivitiesPanel() {
  const [activities, setActivities] = useState([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    day: 1, // Monday by default
    time: '15:00', // 3:00 PM by default
    location: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const weekdays = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' }
  ];

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
      setNewActivity({
        name: '',
        day: 1,
        time: '15:00',
        location: ''
      });
      setIsAddingActivity(false);
      loadActivities();
    } catch (err) {
      setError('Failed to add activity. Please try again.');
      console.error('Error adding activity:', err);
    }
  }

  async function handleDeleteActivity(id) {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        setError(null);
        await deleteActivity(id);
        loadActivities();
      } catch (err) {
        setError('Failed to delete activity. Please try again.');
        console.error('Error deleting activity:', err);
      }
    }
  }

  function formatTime(timeString) {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  }

  return (
    <div className="panel activities-panel">
      <div className="panel__header">
        <h2>Activities</h2>
        <button 
          className="button button--add"
          onClick={() => setIsAddingActivity(true)}
        >
          +
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
            {weekdays.map(day => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
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
                  <span>{weekdays.find(d => d.value === activity.day)?.label}</span>
                  <span>{formatTime(activity.time)}</span>
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