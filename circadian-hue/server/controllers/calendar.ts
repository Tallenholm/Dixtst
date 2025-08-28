import { Request, Response } from 'express';
import { GoogleCalendarService } from '../services/google-calendar';

export class CalendarController {
  constructor(private readonly service: GoogleCalendarService) {}

  busy = async (
    req: Request<unknown, unknown, unknown, { calendarId: string; timeMin: string; timeMax: string }>,
    res: Response,
  ) => {
    const { calendarId, timeMin, timeMax } = req.query;
    const busy = await this.service.getBusyTimes(
      calendarId,
      new Date(timeMin),
      new Date(timeMax),
    );
    res.json({ busy });
  };
}
