const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Remove all direct database connections and only use fetch
export async function getActivities() {
  const response = await fetch(`${API_BASE_URL}/api/activities`);
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  return response.json();
}

export async function getActivityInstances(startDate, endDate) {
  const response = await fetch(
    `${API_BASE_URL}/api/activity-instances?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
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
  const response = await fetch(`${API_BASE_URL}/api/drivers`);
  if (!response.ok) {
    throw new Error('Failed to fetch drivers');
  }
  return response.json();
}

export async function addDriver(driver) {
  const response = await fetch(`${API_BASE_URL}/api/drivers`, {
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
  const response = await fetch(`${API_BASE_URL}/api/drivers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete driver');
  }
  return response.json();
}

export async function getKids() {
  const response = await fetch(`${API_BASE_URL}/api/kids`);
  if (!response.ok) {
    throw new Error('Failed to fetch kids');
  }
  return response.json();
}

export async function addKid(kid) {
  const response = await fetch(`${API_BASE_URL}/api/kids`, {
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
  const response = await fetch(`${API_BASE_URL}/api/kids/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete kid');
  }
  return response.json();
}

export async function addActivity(activity) {
  const response = await fetch(`${API_BASE_URL}/api/activities`, {
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
  const response = await fetch(`${API_BASE_URL}/api/activities/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete activity');
  }
  return response.json();
}

export async function assignDrivers(activityInstanceId, driverIds) {
  console.log('Sending assignment request:', { activityInstanceId, driverIds });
  
  const response = await fetch(`${API_BASE_URL}/api/driver-assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ activityInstanceId, driverIds }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Assignment failed:', error);
    throw new Error(error.message || 'Failed to assign drivers');
  }
  
  const result = await response.json();
  console.log('Assignment successful:', result);
  return result;
}

export async function getDriverAssignments(activityInstanceId) {
  console.log("Getting assignements for", activityInstanceId);

  const response = await fetch(`${API_BASE_URL}/api/driver-assignments/${activityInstanceId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch driver assignments');
  }
  
  const result = await response.json();

  return result;
}

export async function getKidAssignments(activityInstanceId) {
  const response = await fetch(`${API_BASE_URL}/api/kid-assignments/${activityInstanceId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch kid assignments');
  }
  
  return response.json();
}

export async function assignKids(assignments) {
  const response = await fetch(`${API_BASE_URL}/api/kid-assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assignments }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to assign kids');
  }
  
  return response.json();
}

// Add these new functions to check for assignments

export async function checkKidAssignments(kidId) {
  const response = await fetch(`${API_BASE_URL}/api/kids/${kidId}/assignments`);
  if (!response.ok) {
    throw new Error('Failed to check kid assignments');
  }
  return response.json();
}

export async function checkDriverAssignments(driverId) {
  const response = await fetch(`${API_BASE_URL}/api/drivers/${driverId}/assignments`);
  if (!response.ok) {
    throw new Error('Failed to check driver assignments');
  }
  return response.json();
}

export async function checkActivityAssignments(activityId) {
  const response = await fetch(`${API_BASE_URL}/api/activities/${activityId}/assignments`);
  if (!response.ok) {
    throw new Error('Failed to check activity assignments');
  }
  return response.json();
}

export async function removeKidAssignments(kidId) {
  const response = await fetch(`${API_BASE_URL}/api/kids/${kidId}/assignments`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to remove kid assignments');
  }
  return response.json();
}

export async function removeDriverAssignments(driverId) {
  const response = await fetch(`${API_BASE_URL}/api/drivers/${driverId}/assignments`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to remove driver assignments');
  }
  return response.json();
}

export async function removeActivityAssignments(activityId) {
  const response = await fetch(`${API_BASE_URL}/api/activities/${activityId}/assignments`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to remove activity assignments');
  }
  return response.json();
}

export async function updateDriver(id, driver) {
  const response = await fetch(`${API_BASE_URL}/api/drivers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(driver),
  });
  if (!response.ok) {
    throw new Error('Failed to update driver');
  }
  return response.json();
}

export async function updateKid(id, kid) {
  const response = await fetch(`${API_BASE_URL}/api/kids/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(kid),
  });
  if (!response.ok) {
    throw new Error('Failed to update kid');
  }
  return response.json();
}

export async function updateActivity(id, activity) {
  // First update the activity
  const response = await fetch(`${API_BASE_URL}/api/activities/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(activity),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update activity');
  }
  
  // Get the current date range from the calendar
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of current week
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 27); // 4 weeks from start
  
  // Force regenerate activity instances for the current calendar view
  const regenerateResponse = await fetch(`${API_BASE_URL}/api/regenerate-activity-instances`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    }),
  });
  
  if (!regenerateResponse.ok) {
    console.error('Failed to regenerate activity instances');
  }
  
  return response.json();
} 