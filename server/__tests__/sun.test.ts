import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.TZ = 'America/New_York'
const { getSunTimes, CoordinateRangeError } = await import('../../circadian-hue/server/lib/sun.ts')

test('throws when latitude out of range', () => {
  assert.throws(() => getSunTimes(91, 0), CoordinateRangeError)
  assert.throws(() => getSunTimes(-91, 0), CoordinateRangeError)
})

test('throws when longitude out of range', () => {
  assert.throws(() => getSunTimes(0, 181), CoordinateRangeError)
  assert.throws(() => getSunTimes(0, -181), CoordinateRangeError)
})

test('caches by rounded coordinates and date', () => {
  const date = new Date('2024-01-01')
  const a = getSunTimes(40.1234, -74.0059, date)
  const b = getSunTimes(40.12349, -74.00591, date)
  assert.strictEqual(a, b)
})

test('cache differentiates dates', () => {
  const a = getSunTimes(35.12, -80.0, new Date('2024-01-01'))
  const b = getSunTimes(35.12, -80.0, new Date('2024-01-02'))
  assert.notStrictEqual(a, b)
})

test('cache handles timezone boundary', () => {
  const a = getSunTimes(40, -74, new Date('2024-06-01T23:30:00'))
  const b = getSunTimes(40, -74, new Date('2024-06-02T00:30:00'))
  assert.notStrictEqual(a, b)
})
