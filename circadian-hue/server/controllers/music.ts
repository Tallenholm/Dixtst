import { Request, Response } from 'express'
import type { MusicMode } from '../services/music-mode'
import { error } from '../lib/error'

export class MusicController {
  constructor(private readonly music: MusicMode) {}

  start = async (
    req: Request<{ roomId: string }, any, { sensitivity?: number }>,
    res: Response,
  ) => {
    const { roomId } = req.params
    const sens = Number(req.body?.sensitivity ?? 1.0)
    const state = this.music.start(roomId, sens)
    res.json({ ok: true, state })
  }

  stop = async (req: Request<{ roomId: string }>, res: Response) => {
    const { roomId } = req.params
    const state = this.music.stop(roomId)
    res.json({ ok: true, state })
  }

  telemetry = async (
    req: Request<
      any,
      any,
      { roomId?: string; energy?: number; tempo?: number }
    >,
    res: Response,
  ) => {
    const { roomId, energy, tempo } = req.body || {}
    if (typeof energy !== 'number' || !roomId) {
      res
        .status(400)
        .json(error('invalid_telemetry', 'roomId and numeric energy required'))
      return
    }
    await this.music.telemetry(
      String(roomId),
      Number(energy),
      typeof tempo === 'number' ? tempo : undefined,
    )
    res.json({ ok: true })
  }
}
