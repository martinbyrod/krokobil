import { useState, useEffect } from 'react';
import { getDrivers, addDriver, deleteDriver } from '../../lib/db';
import PlusIcon from '../common/icons/PlusIcon';

export default function DriversPanel() {
  const [drivers, setDrivers] = useState([]);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriver, setNewDriver] = useState({ family_name: '', seat_capacity: 4 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDrivers();
      setDrivers(data);
    } catch (err) {
      setError('Failed to load drivers. Please try again later.');
      console.error('Error loading drivers:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddDriver(e) {
    e.preventDefault();
    try {
      setError(null);
      await addDriver(newDriver);
      setNewDriver({ family_name: '', seat_capacity: 4 });
      setIsAddingDriver(false);
      loadDrivers();
    } catch (err) {
      setError('Failed to add driver. Please try again.');
      console.error('Error adding driver:', err);
    }
  }

  async function handleDeleteDriver(id) {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        setError(null);
        await deleteDriver(id);
        loadDrivers();
      } catch (err) {
        setError('Failed to delete driver. Please try again.');
        console.error('Error deleting driver:', err);
      }
    }
  }

  return (
    <div className="panel drivers-panel">
      <div className="panel__header">
        <h2>Drivers</h2>
        <button 
          className="button button--add"
          onClick={() => setIsAddingDriver(true)}
        >
          <PlusIcon />
        </button>
      </div>

      {error && (
        <div className="panel__error">
          {error}
        </div>
      )}

      {isAddingDriver && (
        <form className="panel__form" onSubmit={handleAddDriver}>
          <input
            type="text"
            placeholder="Family Name"
            value={newDriver.family_name}
            onChange={e => setNewDriver({...newDriver, family_name: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Seat Capacity"
            value={newDriver.seat_capacity}
            onChange={e => setNewDriver({...newDriver, seat_capacity: parseInt(e.target.value)})}
            min="1"
            required
          />
          <div className="panel__form-actions">
            <button type="submit" className="button button--primary">Save</button>
            <button 
              type="button" 
              className="button button--secondary"
              onClick={() => setIsAddingDriver(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="panel__list">
        {isLoading ? (
          <div className="panel__loading">Loading drivers...</div>
        ) : drivers.length === 0 ? (
          <div className="panel__empty">No drivers added yet</div>
        ) : (
          drivers.map(driver => (
            <div key={driver.id} className="panel__list-item">
              <div className="panel__list-item-content">
                <span className="panel__list-item-name">{driver.family_name}</span>
                <span className="panel__list-item-capacity">{driver.seat_capacity} seats</span>
              </div>
              <button 
                className="button button--delete"
                onClick={() => handleDeleteDriver(driver.id)}
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