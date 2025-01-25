import { useState, useEffect } from 'react'
import { startOfWeek, addDays, format, addWeeks } from 'date-fns'
import CalendarWeek from './CalendarWeek'
import { getActivityInstances } from '../../lib/db'

export default function Calendar() {
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [activities, setActivities] = useState([])
  
  useEffect(() => {
    const fetchActivities = async () => {
      // Get activities for the two weeks we're displaying
      const endDate = addDays(startDate, 13) // 2 weeks minus 1 day
      const instances = await getActivityInstances(startDate, endDate)
      setActivities(instances)
    }
    
    fetchActivities()
  }, [startDate])

  const nextWeek = () => {
    setStartDate(date => addWeeks(date, 1))
  }

  const previousWeek = () => {
    setStartDate(date => addWeeks(date, -1))
  }

  // Group activities by date
  const activitiesByDate = activities.reduce((acc, activity) => {
    const dateKey = activity.date
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(activity)
    return acc
  }, {})

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button className="calendar__nav-button" onClick={previousWeek}>&larr; Previous</button>
        <h2 className="calendar__date-range">{format(startDate, 'MMMM d')} - {format(addDays(startDate, 13), 'MMMM d, yyyy')}</h2>
        <button className="calendar__nav-button" onClick={nextWeek}>Next &rarr;</button>
      </div>
      
      <div className="calendar__weeks">
        <CalendarWeek startDate={startDate} activities={activitiesByDate} />
        <CalendarWeek startDate={addWeeks(startDate, 1)} activities={activitiesByDate} />
      </div>
    </div>
  )
} 