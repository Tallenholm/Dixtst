
import { Storage } from '../src/server/storage';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = './bench-storage.db';

// Clean up previous run
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const storage = new Storage(DB_PATH);

// Setup data
const KEY = 'bench_key';
storage.setSetting(KEY, { foo: 'bar' });

const ITERATIONS = 100_000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

// Benchmark getSetting
const startGet = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  storage.getSetting(KEY);
}
const endGet = performance.now();
const opsPerSecGet = (ITERATIONS / ((endGet - startGet) / 1000)).toFixed(2);
console.log(`getSetting: ${opsPerSecGet} ops/sec`);

// Benchmark setSetting
const startSet = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  storage.setSetting(KEY, { foo: 'bar', idx: i });
}
const endSet = performance.now();
const opsPerSecSet = (ITERATIONS / ((endSet - startSet) / 1000)).toFixed(2);
console.log(`setSetting: ${opsPerSecSet} ops/sec`);

// Cleanup
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}
if (fs.existsSync(DB_PATH + '-wal')) {
    fs.unlinkSync(DB_PATH + '-wal');
}
if (fs.existsSync(DB_PATH + '-shm')) {
    fs.unlinkSync(DB_PATH + '-shm');
}
