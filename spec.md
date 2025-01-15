Executive Summary

Purpose & Scope
A family-friendly rideshare scheduler for weekly kids’ activities. The app is shared among a small group of families (no need for formal user accounts). Users can:

Define recurring activities (name, day, time, location) which appear every week in the schedule.
Add drivers (with seat capacities) and kids, visible to everyone.
For each week, assign drivers and kids to “to” and “from” rides via simple drag-and-drop.
Navigate to past or future weeks, preserving the assignments for historical reference or future planning.
Key Features
Recurring Activities
Created once (e.g., “Soccer, Monday 4 PM”), automatically appear each new week with empty assignment slots.

Main Week View
By default shows the current and next week. Buttons to go back to “Previous Week” (unlimited history). Each week shows the same set of activities, but the driver/kid assignments are distinct per week.
No Logins
The entire user base can access the same URL and see/edit the schedule.
Driver & Kid Management
Users can add/edit drivers (with seat capacity) and kids at any time.
Drag-and-Drop Assignments
A single-page layout with a left panel for drivers/kids and a main schedule for the current week’s activities.
Drag drivers and kids into the “To” and “From” slots for each activity.
Seat capacity is enforced in a minimal, user-friendly way (e.g., error message or highlight if capacity is exceeded).
Historical Data
Past weeks’ assignments remain stored indefinitely. Users can navigate backward to review or forward to plan.
Why This Matters
Simplicity: All info on one page, intuitive drag-and-drop, minimal overhead for busy parents.
Collaboration: Everyone can add data (drivers, kids) and set weekly assignments, reducing confusion.
Automatic Recurrence: No need to re-create the same activity details every week.
Recommended Tech Stack

Frontend Framework: React
Offers a component-based structure ideal for building a dynamic drag-and-drop UI.
Large ecosystem of libraries for drag-and-drop (e.g., React DnD, React Beautiful DnD).
Styling: Tailwind CSS
A utility-first CSS framework that speeds up development with prebuilt classes.
Easier to iterate on design, keep it simple and consistent.
Deployment: Vercel
Seamless integration with GitHub, CI/CD out of the box, quick environment setups.
Free tier that’s well-suited for small group apps.
Data Storage / Sync:
Lightweight Database: For storing drivers, kids, and weekly assignments. Let's aim for a simple serverless database (e.g., Neon Postgres integrated native in Vercel).

High-Level Implementation Outline

React Setup
Create a React app (e.g., using Create React App or Vite).
Integrate Tailwind CSS for styling (configure tailwind.config.js).
Data Model
Activities:
ID, name, day, time, location.
Drivers:
ID, name, seatCapacity.
Kids:
ID, name.
Assignments:
A structure that ties a specific week to each activity’s “To” and “From” slots, referencing driver IDs and kid IDs.
Pages / Components
Top-Level Layout: Single-page design with:
Header: “Previous/Next Week” buttons, “Add Activity,” “Add Driver,” “Add Kid.”
Main:
Left Panel: Drivers & Kids lists (draggable).
Center / “Activities Panel”: Cards for each activity in the current week and next week (with “To / From” assignment areas).
Add Forms (inline or modal-like but still on the same page) for adding Activities, Drivers, Kids.
Drag-and-Drop
Use a React drag-and-drop library to handle:
Draggable items (drivers/kids)
Droppable slots (“To Driver,” “From Driver,” “To Kids,” “From Kids”).
On drop, validate seat capacities and update assignments in state + database.
Weekly Navigation
A simple date-based approach (e.g., each week is identified by a start date like “2025-01-13”).
When user clicks “Next Week,” compute the next Monday (or next 7 days) and fetch assignments for that week.
Display the same activity list, but with (new or existing) assignment data for that week.
Data Persistence
On every change (drag-and-drop, add, remove), update the database in real-time or on a short debounce.
Past assignments remain stored, so navigation to previous weeks loads historical data.
Deploy on Vercel
Connect GitHub repo, auto-deploy on push.
For a serverless DB approach, either use built-in Vercel serverless functions or configure external services like Firestore / Supabase.



SPEC
---------------
We’re aiming for a single-page, lean web app with a simple drag-and-drop interface. The key additions are:

A way to create activities once (they auto-populate each week).
Navigation for “previous/next week” so that each new week starts empty (assignment-wise), but the same set of activities appear.
Unlimited history—you can go back in time to see old assignments.
Everyone can add drivers and kids (with seat capacity).
No code here—just the high-level user flow and layout.

Overall Page Layout

Header Bar:
Previous / Next Week Arrows: Clicking arrows changes the view to the corresponding week’s assignments.
Week Indicator: Shows which week is currently displayed (e.g. “January 14 - January 20”).
Add Activity / Add Driver / Add Kid: Inline or small dropdown forms (no popups) to add these items.
Body:
Left Pane: List of Drivers (with seat capacity) + Kids.
Right Pane / Main Panel: Activity list for the currently selected week and following week (always display two consecutive weeks), each with “To / From” assignment areas.
1. Managing Activities (Once)

Adding Activities
Click “+ Add Activity” in the header.
A tiny inline form appears (still on the same page, no popup) with fields:
Name: e.g., “Soccer Practice”
Day of the week (e.g., Monday)
Time (e.g., 4:00 PM)
Location (optional)
Submit -> Activity is saved to a global list of recurring activities.
Auto-Populating Each Week
These activities appear automatically every week, but without any driver/kid assignments.
When you navigate to a new (future) week, you’ll see the same list of activities, each with empty assignment slots.
History / Past Weeks
If you go to a past week, you’ll see the old assignments as they were entered.
2. Week Navigation & Storage

Previous / Next Week Arrows
< “Prev Week” and > “Next Week” buttons:
When clicked, the main panel updates to show that and the following week’s assignment data.
Activities are the same (since they’re recurring), but the “To” and “From” driver/kid slots are unique per week.
This effectively creates a perpetual timeline.
Week Data
Each week has:
Activities (generated automatically from the master activity list).
An empty set of driver/kid assignments initially.
Once users drag and drop drivers/kids for a specific week, it’s stored (in local storage or a lightweight backend).
You can revisit that week at any time to see what was set.
3. Drivers & Kids (Seat Capacity)

Adding Drivers
Click “+ Add Driver” in the header.
A small inline form appears with:
Driver Name (e.g., “Mom,” “Dad,” “Alice”)
Seat Capacity (integer, e.g., 4 seats)
Submit -> Driver appears immediately in the “Drivers” list on the left panel.
Adding Kids
Click “+ Add Kid” in the header.
A small inline form appears with:
Kid Name (e.g., “Kid A,” “Kid B,” “Jimmy”)
Submit -> Kid appears in the “Kids” list on the left panel.
Left Panel Layout Example
DRIVERS:
  Mom (Seats: 4)
  Dad (Seats: 2)
  Alice (Seats: 3)

KIDS:
  Kid A
  Kid B
  Kid C
Seat Capacity Check: If a driver has 3 seats but you try to drag 4 kids into that driver’s slot, the interface could:
Highlight an error (“Not enough seats!”),
or prevent dropping the 4th kid.
Keep it minimal but ensure seat capacity is respected.
4. Weekly Schedule (Main Panel)

Auto-Listed Activities
For the current week (e.g., “Week of Jan 14 – Jan 20”), we might see:
Activity 1: Soccer (Monday 4 PM, Park)
   - To:   [drag driver here]   [drag kids here]
   - From: [drag driver here]   [drag kids here]

Activity 2: Dance (Wednesday 3 PM, Studio)
   - To:   [drag driver here]   [drag kids here]
   - From: [drag driver here]   [drag kids here]

Activity 3: Piano (Friday 5 PM, Music Hall)
   - To:   [drag driver here]   [drag kids here]
   - From: [drag driver here]   [drag kids here]

... and so on ...
Each activity is represented by a “card” or “box.” It displays:
Name (“Soccer”), Day/Time (“Monday 4 PM”), and optionally Location (“Park”).
Two sections: “To” and “From.”
Each has:
Driver slot: Drag one driver from the left panel here.
Kids slot: Drag any kids who will be in that ride.
Drag-and-Drop Interaction
Driver → “Driver slot”
If that driver is already assigned somewhere else, it’s still okay (some families might do multiple rides).
The only constraint is seat capacity.
Kids → “Kids slot”
Keep dragging kids until the capacity is reached.
Seat Capacity Enforcement
If dragging more kids than seats, display a subtle alert or highlight.
Real-Time Visibility
Everyone who opens this single page sees the updated assignments as soon as they refresh (or in real-time if shared state is possible).
5. Workflow Summary

Set Up Master Data
Add drivers (with seat capacity) and kids in the top bar.
Add recurring activities (Name, Day, Time, Location) once.
Navigate to Desired Week
Use the “Previous/Next Week” arrows in the header to pick the relevant week.
Assign Rides
For each activity in that week (which auto-populated from the master list but with empty assignments):
Drag a driver to the “To” slot.
Drag the kids who need to go in that car.
Do the same for the “From” slot (maybe the same or a different driver).
History & Future
At any point, click “< Prev Week” to see last week’s completed assignments or “> Next Week” to plan ahead.
Past and future weeks remain stored indefinitely.
No Manual Clearing
Each new week starts with empty assignments by default (the app does that automatically).
The same activities appear each week, but with no assigned driver or kids until you set them.
Why This Meets Your Requirements

Single-Page Simplicity: Everything (adding items, assigning rides, navigating weeks) happens in one view without popups or multiple pages.
Recurring Activities: Only defined once; each subsequent week automatically shows them (empty) for new assignments.
Unlimited History: You can scroll back to see how rides were assigned in any previous week.
Independent Editing: Anyone can add drivers (with seat capacity) or new kids. That data is then available to everyone.
Lean Drag-and-Drop: Assigning who drives and which kids ride is done purely by dragging from the left panel to each activity slot in the main panel.
That’s the high-level conceptual design for your family-and-friends rideshare app. It’s minimal, intuitive, and supports the key features you need:
Create activities (repeat weekly).
Scroll through weeks with empty assignment slots each time.
Keep historical records.
Easily add drivers (with seat capacity) and kids.
Single-page with drag-and-drop.