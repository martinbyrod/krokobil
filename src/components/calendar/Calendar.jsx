import { useState, useEffect } from 'react'
import { startOfWeek, addDays, format, addWeeks } from 'date-fns'
import CalendarWeek from './CalendarWeek'
import { getActivityInstances } from '../../lib/db'

export default function Calendar() {
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true)
        const endDate = addDays(startDate, 13)
        console.log('Fetching activities for:', {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        })
        const instances = await getActivityInstances(startDate, endDate)
        console.log('Raw instances from server:', instances)
        setActivities(instances)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchActivities()
  }, [startDate])

  const nextWeek = () => {
    setStartDate(date => addWeeks(date, 1))
  }

  const previousWeek = () => {
    setStartDate(date => addWeeks(date, -1))
  }

  // Group activities by date, handling the date format from the server
  const activitiesByDate = activities.reduce((acc, activity) => {
    const dateKey = format(new Date(activity.date), 'yyyy-MM-dd')
    console.log('Processing activity:', { activity, dateKey })
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push({
      ...activity,
      id: activity.instance_id
    })
    return acc
  }, {})

  console.log('Final activitiesByDate:', activitiesByDate)

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button className="calendar__nav-button" onClick={previousWeek}>&larr; Previous</button>
        <h2 className="calendar__date-range">
          {format(startDate, 'MMMM d')} - {format(addDays(startDate, 13), 'MMMM d, yyyy')}
        </h2>
        <button className="calendar__nav-button" onClick={nextWeek}>Next &rarr;</button>
      </div>
      
      {isLoading ? (
        <div className="calendar__loading">Loading activities...</div>
      ) : (
        <div className="calendar__weeks">
          <CalendarWeek startDate={startDate} activities={activitiesByDate} />
          <CalendarWeek startDate={addWeeks(startDate, 1)} activities={activitiesByDate} />
        </div>
      )}
    </div>
  )
} 