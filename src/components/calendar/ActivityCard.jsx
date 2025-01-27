import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { getDriverAssignments } from '../../lib/db'
import AssignDriverModal from './AssignDriverModal'

export default function ActivityCard({ activity }) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    if (activity.instance_id) {
      loadAssignments()
    }
  }, [activity.instance_id])
  
  async function loadAssignments() {
    try {
      console.log('Loading assignments for activity:', activity)
      setIsLoading(true)
      setError(null)
      const data = await getDriverAssignments(activity.instance_id)
      console.log('Received assignments:', data)
      setAssignments(data)
    } catch (error) {
      console.error('Failed to load assignments:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  const totalSeats = assignments.reduce((sum, driver) => sum + driver.seat_capacity, 0)
  
  // Parse the date properly
  const activityDate = parseISO(activity.date)
  const activityTime = activity.time ? new Date(`2000-01-01T${activity.time}`) : null
  
  return (
    <div className="calendar-activity">
      <div className="calendar-activity__header">
        <div className="calendar-activity__name">{activity.name}</div>
        <div className="calendar-activity__time">
          {activityTime ? format(activityTime, 'h:mm a') : 'No time set'}
        </div>
      </div>
      <div className="calendar-activity__location">{activity.location}</div>
      
      <div className="calendar-activity__debug" style={{ fontSize: '10px', color: '#666' }}>
        Instance ID: {activity.instance_id}
        <br />
        Date: {format(activityDate, 'yyyy-MM-dd')}
      </div>
      
      <div className="calendar-activity__drivers">
        <h4>Drivers & Passengers:</h4>
        {error && (
          <div className="calendar-activity__error" style={{ color: 'red' }}>
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="calendar-activity__loading">Loading...</div>
        ) : assignments.length > 0 ? (
          <>
            <div className="calendar-activity__assignments">
              {assignments.map(driver => (
                <div key={driver.assignment_id} className="calendar-activity__driver">
                  <div className="calendar-activity__driver-name">
                    {driver.family_name} ({driver.seat_capacity} seats)
                  </div>
                  {/* We'll add kids here later */}
                  <div className="calendar-activity__seats-available">
                    {driver.seat_capacity} seats available
                  </div>
                </div>
              ))}
            </div>
            <div className="calendar-activity__summary">
              Total capacity: {totalSeats} seats
            </div>
          </>
        ) : (
          <div className="calendar-activity__empty-state">
            No drivers assigned
          </div>
        )}
        <button 
          className="button button--secondary"
          onClick={() => setIsAssigning(true)}
        >
          {assignments.length > 0 ? 'Edit Drivers' : 'Assign Drivers'}
        </button>
      </div>

      {isAssigning && (
        <AssignDriverModal
          activity={activity}
          currentAssignments={assignments}
          onClose={() => setIsAssigning(false)}
          onAssigned={loadAssignments}
        />
      )}
    </div>
  )
} 