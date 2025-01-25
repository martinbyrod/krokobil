// Remove all direct database connections and only use fetch
export async function getActivities() {
  const response = await fetch('http://localhost:3001/api/all-activities');
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  return response.json();
}

export async function getActivityInstances(startDate, endDate) {
  const response = await fetch(
    `http://localhost:3001/api/activities?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  
  return response.json();
} 