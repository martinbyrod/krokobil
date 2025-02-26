import { useState, useEffect } from 'react';
import { getKids, addKid, deleteKid, updateKid } from '../../lib/db';
import PlusIcon from '../common/icons/PlusIcon';
import { CALENDAR_RELOAD_EVENT } from '../calendar/Calendar';

export default function KidsPanel() {
  const [kids, setKids] = useState([]);
  const [isAddingKid, setIsAddingKid] = useState(false);
  const [newKid, setNewKid] = useState({ name: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingKidId, setEditingKidId] = useState(null);

  useEffect(() => {
    loadKids();
  }, []);

  async function loadKids() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getKids();
      setKids(data);
    } catch (err) {
      setError('Failed to load kids. Please try again later.');
      console.error('Error loading kids:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddKid(e) {
    e.preventDefault();
    try {
      setError(null);
      if (editingKidId) {
        // Update existing kid
        await updateKid(editingKidId, newKid);
      } else {
        // Add new kid
        await addKid(newKid);
      }
      setNewKid({ name: '' });
      setIsAddingKid(false);
      setEditingKidId(null);
      loadKids();
      
      // Trigger calendar reload if editing
      if (editingKidId) {
        window.dispatchEvent(new Event(CALENDAR_RELOAD_EVENT));
      }
    } catch (err) {
      setError(`Failed to ${editingKidId ? 'update' : 'add'} kid. Please try again.`);
      console.error(`Error ${editingKidId ? 'updating' : 'adding'} kid:`, err);
    }
  }

  function handleEditKid(kid) {
    setNewKid({ name: kid.name });
    setEditingKidId(kid.id);
    setIsAddingKid(true);
  }

  function handleCancelEdit() {
    setNewKid({ name: '' });
    setIsAddingKid(false);
    setEditingKidId(null);
  }

  async function handleDeleteKid(id) {
    if (window.confirm('Are you sure you want to delete this kid?')) {
      try {
        setError(null);
        await deleteKid(id);
        loadKids();
        
        // Trigger calendar reload
        window.dispatchEvent(new Event(CALENDAR_RELOAD_EVENT));
      } catch (err) {
        setError('Failed to delete kid. Please try again.');
        console.error('Error deleting kid:', err);
      }
    }
  }

  return (
    <div className="panel kids-panel">
      <div className="panel__header">
        <h2>Barn</h2>
        <button 
          className="button button--add"
          onClick={() => setIsAddingKid(true)}
        >
          <PlusIcon />
        </button>
      </div>

      {error && (
        <div className="panel__error">
          {error}
        </div>
      )}

      {isAddingKid && (
        <form className="panel__form" onSubmit={handleAddKid}>
          <input
            type="text"
            placeholder="Namn"
            value={newKid.name}
            onChange={e => setNewKid({ name: e.target.value })}
            required
          />
          <div className="panel__form-actions">
            <button type="submit" className="button button--primary">
              {editingKidId ? 'Update' : 'Save'}
            </button>
            <button 
              type="button" 
              className="button button--secondary"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="panel__list">
        {isLoading ? (
          <div className="panel__loading">Loading kids...</div>
        ) : kids.length === 0 ? (
          <div className="panel__empty">No kids added yet</div>
        ) : (
          kids.map(kid => (
            <div key={kid.id} className="panel__list-item">
              <div 
                className="panel__list-item-content"
                onClick={() => handleEditKid(kid)}
              >
                <span className="panel__list-item-name">{kid.name}</span>
              </div>
              <button 
                className="button button--delete"
                onClick={() => handleDeleteKid(kid.id)}
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