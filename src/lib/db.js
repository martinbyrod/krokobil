// Remove all direct database connections and only use fetch
export async function getActivities() {
  const response = await fetch('http://localhost:3001/api/activities');
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  return response.json();
}

export async function getActivityInstances(startDate, endDate) {
  const response = await fetch(
    `http://localhost:3001/api/activity-instances?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
    {
      cache: 'no-store'
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch activity instances');
  }
  
  return response.json();
}

export async function getDrivers() {
  const response = await fetch('http://localhost:3001/api/drivers');
  if (!response.ok) {
    throw new Error('Failed to fetch drivers');
  }
  return response.json();
}

export async function addDriver(driver) {
  const response = await fetch('http://localhost:3001/api/drivers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(driver),
  });
  if (!response.ok) {
    throw new Error('Failed to add driver');
  }
  return response.json();
}

export async function deleteDriver(id) {
  const response = await fetch(`http://localhost:3001/api/drivers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete driver');
  }
  return response.json();
}

export async function getKids() {
  const response = await fetch('http://localhost:3001/api/kids');
  if (!response.ok) {
    throw new Error('Failed to fetch kids');
  }
  return response.json();
}

export async function addKid(kid) {
  const response = await fetch('http://localhost:3001/api/kids', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(kid),
  });
  if (!response.ok) {
    throw new Error('Failed to add kid');
  }
  return response.json();
}

export async function deleteKid(id) {
  const response = await fetch(`http://localhost:3001/api/kids/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete kid');
  }
  return response.json();
}

export async function addActivity(activity) {
  const response = await fetch('http://localhost:3001/api/activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(activity),
  });
  if (!response.ok) {
    throw new Error('Failed to add activity');
  }
  return response.json();
}

export async function deleteActivity(id) {
  const response = await fetch(`http://localhost:3001/api/activities/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete activity');
  }
  return response.json();
} 