In this project we will build a web app for ride sharing among a group of families. The purpose is to organize rides to weekly activities for kids. The activities repeat weekly at the same time, day and location.

The app is for personal use with our friends so no accounts or login needed. But it should be self serve for everyone to require minimal coordinated administration.

Main functional pieces:

The most central component is a calendar with a week by week overview of activities, who is driving to each activity and what kid rides in what car.

Other central pieces are: drivers, kids, activities.

Drivers: Each driver is identified by family name and has a specified seat capacity.

Kids: Each kid is identified by name.

Activities: Each activity has a name, day, time and location. Additionally each activity will spawn an 'activity instance' in the calendar each week.

Activity Instance: This is a particular time for a given activity.

Finally the main thing to do in the app will be to assign drivers to activity instances in the calendar and then kids to drivers for that specific activity instance.

App Implementation:

The app should be built with React + Vite and javascript (no typescript). We can use native react + sass for the UI components.

It should have a clean, modern look with a responsive and easy to use UI. The layout should be simple and intuitive. We want it to be stylish and modern. The designwork needs to be world class.

UI Layout:

The most important central view will be the calendar week overview. It should at all times be possible to see two weeks. The current week and next week as default. It should also be possible to go back in time indefinitely to see the schedule for previous weeks.

In addition to this there will be side panels for kids, drivers and activities. For each of these it should be possible to add new items and fill in the details as needed.



Questions + answers:
For the calendar view:
Should it show all 7 days of the week, or just weekdays?

Should it show specific time slots, or just organize by day?
How should time conflicts be handled if multiple activities occur at the same time?
For drivers:
Besides family name and seat capacity, are there other attributes needed (like contact info, preferred activities)?
Can the same person drive multiple activities on the same day?
For kids:
Besides name, do we need other attributes (age, family association, preferred activities)?
Can a kid be assigned to multiple activities at the same time?
For data persistence:
Since there's no login, should data be stored locally in the browser?
Or should there be a simple backend to store shared data?
For activity instances:
How far in advance should they be generated?
Should there be a way to cancel/modify individual instances?
Should there be a way to handle exceptions (holidays, cancellations)?

All 7 days for the calendar view. It will be enough to simplify see all activities per day with their relevant info displayed. No special handling for time conflicts needed for activites, drivers or kids. Just do not worry about conflicts. No additional attributes for kids needed. We need a simple backend to store data. We can deploy the app on Vercel and use a native serverless Neon postgres solution. It will be enough to just generate one week in advance. Yes it would be great to be able to cancel/modify individual instances. No need to handle holidays and such things.

## Implementation Details

### Component Architecture

The calendar view is built with a hierarchy of components:
1. `Calendar` - Main container component handling data fetching and date navigation
2. `CalendarWeek` - Renders a week's worth of days
3. `ActivityCard` - Displays individual activity instances with their assignments
4. `AssignDriverModal` - Modal interface for driver assignments

### Data Flow
- Activity instances are fetched for a two-week period
- Each activity instance contains:
  - Basic activity info (name, time, location)
  - Instance-specific data (date, cancellation status)
  - Driver assignments (family name, seat capacity)
  - Kid assignments (per driver)

### Database Structure
Activities and their instances are stored separately to allow for:
- Weekly generation of instances
- Instance-specific modifications
- Individual cancellations
- Driver and kid assignments per instance

### UI/UX Patterns
- Modal-based assignment interface
- Clear hierarchy of information in activity cards
- Consistent date and time formatting
- Loading and error states for all async operations