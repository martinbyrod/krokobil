import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { getDriverAssignments, getKidAssignments } from '../../lib/db'
import AssignDriverModal from './AssignDriverModal'
import AssignKidsModal from './AssignKidsModal'

export default function ActivityCard({ activity }) {
  const [isAssigningDrivers, setIsAssigningDrivers] = useState(false)
  const [isAssigningKids, setIsAssigningKids] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [kidAssignments, setKidAssignments] = useState({})
  
  const activityDate = parseISO(activity.date)
  const activityTime = activity.time ? new Date(`2000-01-01T${activity.time}`) : null
  
  useEffect(() => {
    if (activity.instance_id) {
      loadAssignments()
    }
  }, [activity.instance_id])
  
  async function loadAssignments() {
    try {
      const [driverData, kidData] = await Promise.all([
        getDriverAssignments(activity.instance_id),
        getKidAssignments(activity.instance_id)
      ])
      
      const kidsByDriver = kidData.reduce((acc, assignment) => {
        if (!acc[assignment.driver_assignment_id]) {
          acc[assignment.driver_assignment_id] = []
        }
        acc[assignment.driver_assignment_id].push(assignment)
        return acc
      }, {})
      
      setAssignments(driverData)
      setKidAssignments(kidsByDriver)
    } catch (error) {
      console.error('Failed to load assignments:', error)
    }
  }
  
  return (
    <div className="calendar-activity">
      <div className="calendar-activity__header">
        <div className="calendar-activity__title">
          <div className="calendar-activity__name">{activity.name}</div>
          <div className="calendar-activity__time">
            {activityTime ? format(activityTime, 'h:mm a') : 'No time set'}
          </div>
        </div>
        <button 
          className="button button--add"
          onClick={() => setIsAssigningDrivers(true)}
        >
          +
        </button>
      </div>
      <div className="calendar-activity__location">{activity.location}</div>
      
      <div className="calendar-activity__drivers">
        <div className="calendar-activity__driver-list">
          {assignments.map(driver => (
            <div key={driver.assignment_id} className="calendar-activity__driver-box">
              <div className="calendar-activity__driver-header">
                <span>{driver.family_name}</span>
                <button 
                  className="button button--add"
                  onClick={() => {
                    setSelectedDriver(driver)
                    setIsAssigningKids(true)
                  }}
                >
                  +
                </button>
              </div>
              <div className="calendar-activity__kids-list">
                {(kidAssignments[driver.assignment_id] || []).map(kid => (
                  <div key={kid.id} className="calendar-activity__kid">
                    {kid.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAssigningDrivers && (
        <AssignDriverModal
          activity={activity}
          currentAssignments={assignments}
          onClose={() => setIsAssigningDrivers(false)}
          onAssigned={loadAssignments}
        />
      )}
      
      {isAssigningKids && selectedDriver && (
        <AssignKidsModal
          activity={activity}
          driver={selectedDriver}
          currentAssignments={kidAssignments[selectedDriver.assignment_id] || []}
          onClose={() => {
            setIsAssigningKids(false)
            setSelectedDriver(null)
          }}
          onAssigned={loadAssignments}
        />
      )}
    </div>
  )
} 