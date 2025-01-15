import { format, addWeeks, subWeeks } from 'date-fns';
import AddActivityForm from './AddActivityForm';
import AddDriverForm from './AddDriverForm';
import AddKidForm from './AddKidForm';

interface HeaderProps {
  currentWeekStart: Date;
  onWeekChange: (date: Date) => void;
  onAddActivity: (activity: Activity) => void;
  onAddDriver: (driver: Driver) => void;
  onAddKid: (kid: Kid) => void;
}

function Header({ currentWeekStart, onWeekChange, onAddActivity, onAddDriver, onAddKid }: HeaderProps) {
  return (
    <header className="bg-white shadow-md p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            className="btn"
            onClick={() => onWeekChange(subWeeks(currentWeekStart, 1))}
          >
            Previous Week
          </button>
          <span className="text-lg font-semibold">
            {format(currentWeekStart, 'MMM d')} - {format(addWeeks(currentWeekStart, 1), 'MMM d, yyyy')}
          </span>
          <button 
            className="btn"
            onClick={() => onWeekChange(addWeeks(currentWeekStart, 1))}
          >
            Next Week
          </button>
        </div>
        <div className="flex gap-4">
          <AddActivityForm onAdd={onAddActivity} />
          <AddDriverForm onAdd={onAddDriver} />
          <AddKidForm onAdd={onAddKid} />
        </div>
      </div>
    </header>
  );
}

export default Header; 