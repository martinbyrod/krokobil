export interface Driver {
  id: string;
  name: string;
  seatCapacity: number;
}

export interface Kid {
  id: string;
  name: string;
}

export interface Activity {
  id: string;
  name: string;
  day: string;
  time: string;
  location: string;
}

export interface Assignment {
  id: string;
  weekStartDate: string;
  activityId: string;
  toDriver?: Driver;
  fromDriver?: Driver;
  toKids: Kid[];
  fromKids: Kid[];
} 