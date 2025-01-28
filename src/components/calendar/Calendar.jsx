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
      const endDate = addDays(startDate, 13)
      const instances = await getActivityInstances(startDate, endDate)
      setActivities(instances)
      setIsLoading(false)
    }
    
    fetchActivities()
  }, [startDate])

  const nextWeek = async () => {
    const newDate = addWeeks(startDate, 1)
    const endDate = addDays(newDate, 13)
    const instances = await getActivityInstances(newDate, endDate)
    setActivities(instances)
    setStartDate(newDate)
  }

  const previousWeek = async () => {
    const newDate = addWeeks(startDate, -1)
    const endDate = addDays(newDate, 13)
    const instances = await getActivityInstances(newDate, endDate)
    setActivities(instances)
    setStartDate(newDate)
  }

  const activitiesByDate = activities.reduce((acc, activity) => {
    const dateKey = format(new Date(activity.date), 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push({
      ...activity,
      id: activity.instance_id
    })
    return acc
  }, {})

  if (isLoading) {
    return <div className="calendar__loading">Loading activities...</div>
  }

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button 
          className="calendar__nav-button" 
          onClick={previousWeek}
        >
          &larr; Previous
        </button>
        <h2 className="calendar__date-range">
          {format(startDate, 'MMMM d')} - {format(addDays(startDate, 13), 'MMMM d, yyyy')}
        </h2>
        <button 
          className="calendar__nav-button" 
          onClick={nextWeek}
        >
          Next &rarr;
        </button>
      </div>
      
      <div className="calendar__weeks">
        <CalendarWeek 
          startDate={startDate} 
          activities={activitiesByDate}
        />
        <CalendarWeek 
          startDate={addWeeks(startDate, 1)} 
          activities={activitiesByDate}
        />
      </div>
    </div>
  )
} 