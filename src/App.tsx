import { useState } from 'react';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import MainPanel from './components/MainPanel';
import { Activity, Driver, Kid, Assignment } from './types';

function App() {
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [activities, setActivities] = useState<Activity[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        currentWeekStart={currentWeekStart}
        onWeekChange={setCurrentWeekStart}
        onAddActivity={(activity) => setActivities([...activities, activity])}
        onAddDriver={(driver) => setDrivers([...drivers, driver])}
        onAddKid={(kid) => setKids([...kids, kid])}
      />
      <div className="flex gap-4 p-4">
        <LeftPanel drivers={drivers} kids={kids} />
        <MainPanel 
          currentWeekStart={currentWeekStart}
          activities={activities}
          assignments={assignments}
          onAssignmentChange={setAssignments}
        />
      </div>
    </div>
  );
}

export default App; 