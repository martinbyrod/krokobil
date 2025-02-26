import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getKids, assignKids } from '../../lib/db'
import Modal from '../common/Modal'

export default function AssignKidsModal({ 
  activity, 
  driver, 
  currentAssignments, 
  onClose, 
  onAssigned 
}) {
  const [kids, setKids] = useState([])
  const [assignments, setAssignments] = useState({}) // { driver_assignment_id: [kid_ids] }
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const loadKids = async () => {
      try {
        const allKids = await getKids()
        setKids(allKids)
        
        // Initialize assignments from current state
        const initialAssignments = {
          [driver.assignment_id]: currentAssignments.map(k => k.kid_id)
        }
        setAssignments(initialAssignments)
      } catch (error) {
        console.error('Failed to load kids:', error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadKids()
  }, [])
  
  const handleAssign = async () => {
    try {
      setIsSaving(true)
      setError(null)
      
      const assignmentArray = [{
        driver_assignment_id: driver.assignment_id,
        kid_ids: assignments[driver.assignment_id] || [],
        activity_instance_id: activity.instance_id
      }]
      
      await assignKids(assignmentArray)
      onAssigned()
      onClose()
    } catch (error) {
      console.error('Failed to assign kids:', error)
      setError(error.message)
      setIsSaving(false)
    }
  }
  
  const handleKidAssignment = (kidId, isAssigned) => {
    setAssignments(prev => {
      const newAssignments = { ...prev }
      const currentKids = newAssignments[driver.assignment_id] || []
      
      if (isAssigned) {
        newAssignments[driver.assignment_id] = [...currentKids, kidId]
      } else {
        newAssignments[driver.assignment_id] = currentKids.filter(id => id !== kidId)
      }
      
      return newAssignments
    })
  }
  
  return (
    <Modal onClose={onClose}>
      <h2>Barn som åker med {driver.family_name}</h2>
      <div className="modal__activity-info">
        <div>{activity.name}</div>
        <div>{format(new Date(activity.date), 'EEE, d MMM')}</div>
        <div>{format(new Date(`2000-01-01T${activity.time}`), 'HH:mm')}</div>
      </div>
      
      {error && (
        <div className="modal__error">{error}</div>
      )}
      
      {isLoading ? (
        <div>Laddar barn...</div>
      ) : (
        <div className="modal__assignments">
          <div className="modal__driver-section">
            <h3>{driver.family_name} ({driver.seat_capacity - (assignments[driver.assignment_id] || []).length} platser tillgängliga)</h3>
            <div className="modal__kids-list">
              {kids.map(kid => (
                <label key={kid.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={(assignments[driver.assignment_id] || []).includes(kid.id)}
                    disabled={
                      driver.seat_capacity === (assignments[driver.assignment_id] || []).length && 
                      !(assignments[driver.assignment_id] || []).includes(kid.id)
                    }
                    onChange={(e) => handleKidAssignment(
                      kid.id, 
                      e.target.checked
                    )}
                  />
                  <span>{kid.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="modal__actions">
        <button 
          className="button" 
          onClick={onClose}
          disabled={isSaving}
        >
          Avbryt
        </button>
        <button 
          className="button button--primary" 
          onClick={handleAssign}
          disabled={isSaving}
        >
          {isSaving ? 'Sparar...' : 'Spara'}
        </button>
      </div>
    </Modal>
  )
} 