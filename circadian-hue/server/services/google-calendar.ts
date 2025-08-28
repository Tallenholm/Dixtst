export class GoogleCalendarService {
  constructor(private apiKey: string) {}

  async getBusyTimes(calendarId: string, timeMin: Date, timeMax: Date) {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: calendarId }],
        }),
      });
    const data = await res.json();
    return data.calendars?.[calendarId]?.busy || [];
  }
}
