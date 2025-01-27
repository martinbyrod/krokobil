import { addDays, format } from 'date-fns'
import ActivityCard from './ActivityCard'

export default function CalendarWeek({ startDate, activities }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

  return (
    <div className="calendar-week">
      {days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayActivities = activities[dateStr] || []
        
        return (
          <div key={day.toISOString()} className="calendar-day">
            <div className="calendar-day__header">
              <div className="calendar-day__name">{format(day, 'EEE')}</div>
              <div className="calendar-day__date">{format(day, 'd')}</div>
            </div>
            <div className="calendar-day__content">
              {dayActivities.length > 0 && (
                <div className="calendar-day__activities">
                  {dayActivities.map(activity => (
                    <ActivityCard 
                      key={activity.instance_id}
                      activity={activity}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
} 