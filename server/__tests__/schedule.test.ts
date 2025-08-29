import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findActiveEntry, entryToState } from '../../circadian-hue/server/lib/schedule.ts'

test('handles overnight entries', () => {
  const entries = [
    { start: '22:00', end: '02:00', bri: 1 },
    { start: '02:00', end: '06:00', bri: 2 },
  ]
  assert.strictEqual(
    findActiveEntry(entries, new Date('2024-06-01T23:00:00')),
    entries[0],
  )
  assert.strictEqual(
    findActiveEntry(entries, new Date('2024-06-02T01:00:00')),
    entries[0],
  )
  assert.strictEqual(
    findActiveEntry(entries, new Date('2024-06-02T03:00:00')),
    entries[1],
  )
  assert.strictEqual(
    findActiveEntry(entries, new Date('2024-06-02T07:00:00')),
    undefined,
  )
})

test('entryToState returns null for undefined', () => {
  assert.strictEqual(entryToState(undefined), null)
})
