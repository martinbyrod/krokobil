import { useState, useEffect, useCallback } from 'react'
import { startOfWeek, addDays, format, addWeeks } from 'date-fns'
import CalendarWeek from './CalendarWeek'
import { getActivityInstances } from '../../lib/db'

// Create custom events for calendar interactions
export const CALENDAR_RELOAD_EVENT = 'calendar-reload-event';
export const CALENDAR_DATE_EVENT = 'calendar-date-event';

export default function Calendar() {
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Broadcast the current calendar date
  useEffect(() => {
    // Format the date for the first day of the first week
    const formattedDate = format(startDate, 'yyyy-MM-dd');
    
    // Dispatch event with the current date
    window.dispatchEvent(new CustomEvent(CALENDAR_DATE_EVENT, { 
      detail: { date: formattedDate }
    }));
  }, [startDate]);
  
  const fetchActivities = useCallback(async (start = startDate) => {
    setIsLoading(true);
    try {
      const endDate = addDays(start, 13)
      const instances = await getActivityInstances(start, endDate)
      setActivities(instances)
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false)
    }
  }, [startDate]);
  
  useEffect(() => {
    fetchActivities();
    
    // Listen for the reload event
    const handleReload = () => {
      console.log('Calendar reload triggered');
      fetchActivities();
    };
    
    window.addEventListener(CALENDAR_RELOAD_EVENT, handleReload);
    
    // Clean up the event listener
    return () => {
      window.removeEventListener(CALENDAR_RELOAD_EVENT, handleReload);
    };
  }, [fetchActivities]);

  const nextWeek = async () => {
    const newDate = addWeeks(startDate, 1)
    setStartDate(newDate);
    fetchActivities(newDate);
  }

  const previousWeek = async () => {
    const newDate = addWeeks(startDate, -1)
    setStartDate(newDate);
    fetchActivities(newDate);
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
    return <div className="calendar__loading">Laddar aktiviteter...</div>
  }

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button 
          className="button button--nav" 
          onClick={previousWeek}
        >
          &larr; Föregående
        </button>
        <h2 className="calendar__date-range">
          {format(startDate, 'd MMMM')} - {format(addDays(startDate, 13), 'd MMMM yyyy')}
        </h2>
        <button 
          className="button button--nav" 
          onClick={nextWeek}
        >
          Nästa &rarr;
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