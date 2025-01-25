import { useState, useEffect } from 'react';
import { getKids, addKid, deleteKid } from '../../lib/db';

export default function KidsPanel() {
  const [kids, setKids] = useState([]);
  const [isAddingKid, setIsAddingKid] = useState(false);
  const [newKid, setNewKid] = useState({ name: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      await addKid(newKid);
      setNewKid({ name: '' });
      setIsAddingKid(false);
      loadKids();
    } catch (err) {
      setError('Failed to add kid. Please try again.');
      console.error('Error adding kid:', err);
    }
  }

  async function handleDeleteKid(id) {
    if (window.confirm('Are you sure you want to delete this kid?')) {
      try {
        setError(null);
        await deleteKid(id);
        loadKids();
      } catch (err) {
        setError('Failed to delete kid. Please try again.');
        console.error('Error deleting kid:', err);
      }
    }
  }

  return (
    <div className="panel kids-panel">
      <div className="panel__header">
        <h2>Kids</h2>
        <button 
          className="button button--add"
          onClick={() => setIsAddingKid(true)}
        >
          +
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
            placeholder="Name"
            value={newKid.name}
            onChange={e => setNewKid({ name: e.target.value })}
            required
          />
          <div className="panel__form-actions">
            <button type="submit" className="button button--primary">Save</button>
            <button 
              type="button" 
              className="button button--secondary"
              onClick={() => setIsAddingKid(false)}
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
              <div className="panel__list-item-content">
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