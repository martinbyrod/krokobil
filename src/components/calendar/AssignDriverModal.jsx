import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getDrivers, assignDrivers } from '../../lib/db'
import Modal from '../common/Modal'

export default function AssignDriverModal({ activity, currentAssignments, onClose, onAssigned }) {
  const [drivers, setDrivers] = useState([])
  const [selectedDrivers, setSelectedDrivers] = useState(
    currentAssignments?.map(a => a.driver_id) || []
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        console.log('Loading drivers...')
        const availableDrivers = await getDrivers()
        console.log('Loaded drivers:', availableDrivers)
        setDrivers(availableDrivers)
      } catch (error) {
        console.error('Failed to load drivers:', error)
        setError('Failed to load drivers')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDrivers()
  }, [])
  
  const handleAssign = async () => {
    try {
      setIsSaving(true)
      setError(null)
      console.log('Assigning drivers:', {
        activityInstanceId: activity.instance_id,
        selectedDrivers
      })
      
      const result = await assignDrivers(activity.instance_id, selectedDrivers)
      console.log('Assignment result:', result)
      
      onAssigned()
      onClose()
    } catch (error) {
      console.error('Failed to assign drivers:', error)
      setError(error.message || 'Failed to assign drivers')
      setIsSaving(false)
    }
  }
  
  return (
    <Modal onClose={onClose}>
      <h2>Assign Drivers</h2>
      <div className="modal__activity-info">
        <div>{activity.name}</div>
        <div>{format(new Date(activity.date), 'EEE, MMM d')}</div>
        <div>{format(new Date(`2000-01-01T${activity.time}`), 'h:mm a')}</div>
        <div>Instance ID: {activity.instance_id}</div>
      </div>
      
      {error && (
        <div className="modal__error">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div>Loading drivers...</div>
      ) : (
        <div className="modal__kids-list">
          {drivers.map(driver => (
            <label key={driver.id} className="checkbox">
              <input
                type="checkbox"
                checked={selectedDrivers.includes(driver.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDrivers([...selectedDrivers, driver.id])
                  } else {
                    setSelectedDrivers(selectedDrivers.filter(id => id !== driver.id))
                  }
                }}
              />
              <span>{driver.family_name} ({driver.seat_capacity} seats)</span>
            </label>
          ))}
        </div>
      )}
      
      <div className="modal__actions">
        <button 
          className="button" 
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button 
          className="button button--primary" 
          onClick={handleAssign}
          disabled={isSaving || selectedDrivers.length === 0}
        >
          {isSaving ? 'Saving...' : 'Assign Drivers'}
        </button>
      </div>
    </Modal>
  )
} 