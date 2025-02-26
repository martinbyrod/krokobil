import { useState, useEffect } from 'react';
import { getDrivers, addDriver, deleteDriver, removeDriverAssignments, updateDriver } from '../../lib/db';
import PlusIcon from '../common/icons/PlusIcon';
import { CALENDAR_RELOAD_EVENT } from '../calendar/Calendar';

export default function DriversPanel() {
  const [drivers, setDrivers] = useState([]);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriver, setNewDriver] = useState({ family_name: '', seat_capacity: 4 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDriverId, setEditingDriverId] = useState(null);

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
      if (editingDriverId) {
        // Update existing driver
        await updateDriver(editingDriverId, newDriver);
      } else {
        // Add new driver
        await addDriver(newDriver);
      }
      setNewDriver({ family_name: '', seat_capacity: 4 });
      setIsAddingDriver(false);
      setEditingDriverId(null);
      loadDrivers();
      
      // Trigger calendar reload if editing
      if (editingDriverId) {
        window.dispatchEvent(new Event(CALENDAR_RELOAD_EVENT));
      }
    } catch (err) {
      setError(`Failed to ${editingDriverId ? 'update' : 'add'} driver. Please try again.`);
      console.error(`Error ${editingDriverId ? 'updating' : 'adding'} driver:`, err);
    }
  }

  function handleEditDriver(driver) {
    setNewDriver({
      family_name: driver.family_name,
      seat_capacity: driver.seat_capacity
    });
    setEditingDriverId(driver.id);
    setIsAddingDriver(true);
  }

  function handleCancelEdit() {
    setNewDriver({ family_name: '', seat_capacity: 4 });
    setIsAddingDriver(false);
    setEditingDriverId(null);
  }

  async function handleDeleteDriver(id) {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        setError(null);
        
        // First remove all driver assignments
        await removeDriverAssignments(id);
        
        // Then delete the driver
        await deleteDriver(id);
        loadDrivers();
        
        // Trigger calendar reload
        window.dispatchEvent(new Event(CALENDAR_RELOAD_EVENT));
      } catch (err) {
        setError('Failed to delete driver. Please try again.');
        console.error('Error deleting driver:', err);
      }
    }
  }

  return (
    <div className="panel drivers-panel">
      <div className="panel__header">
        <h2>Förare</h2>
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
            placeholder="Efternamn"
            value={newDriver.family_name}
            onChange={e => setNewDriver({...newDriver, family_name: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Antal platser"
            value={newDriver.seat_capacity}
            onChange={e => setNewDriver({...newDriver, seat_capacity: parseInt(e.target.value)})}
            min="1"
            required
          />
          <div className="panel__form-actions">
            <button type="submit" className="button button--primary">
              {editingDriverId ? 'Uppdatera' : 'Spara'}
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
          <div className="panel__loading">Laddar förare...</div>
        ) : drivers.length === 0 ? (
          <div className="panel__empty">Inga förare tillagda ännu</div>
        ) : (
          drivers.map(driver => (
            <div key={driver.id} className="panel__list-item">
              <div 
                className="panel__list-item-content"
                onClick={() => handleEditDriver(driver)}
              >
                <span className="panel__list-item-name">{driver.family_name}</span>
                <span className="panel__list-item-capacity">{driver.seat_capacity} platser</span>
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