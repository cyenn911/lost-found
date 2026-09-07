import test from 'node:test';
import assert from 'node:assert/strict';
import { startNext, finishCurrent, queuePosition, initialReports } from '../lib/demo.ts';

const requests = () => Array.from({ length: 5 }, (_, i) => ({ ...initialReports[0], id: `request-${i}`, createdAt: i, status: 'queued' }));

test('five requests complete in FIFO order with exactly one active request', () => {
  let queue = startNext(requests().reverse(), 100);
  const order = [];
  while (queue.some(r => r.status === 'running')) {
    assert.equal(queue.filter(r => r.status === 'running').length, 1);
    order.push(queue.find(r => r.status === 'running').id);
    queue = finishCurrent(queue, 200);
  }
  assert.deepEqual(order, ['request-0', 'request-1', 'request-2', 'request-3', 'request-4']);
  assert.equal(queue.filter(r => r.status === 'success').length, 5);
});

test('repeated dispatcher starts cannot overlap the active request', () => {
  const queue = startNext(requests(), 100);
  assert.equal(startNext(queue, 101), queue);
  assert.equal(startNext(queue, 101).filter(r => r.status === 'running').length, 1);
});

test('new submissions wait behind an existing active request', () => {
  const queue = startNext(requests().slice(0, 2), 100);
  const submitted = [...queue, { ...initialReports[1], id: 'new', createdAt: 300, status: 'queued' }];
  assert.equal(startNext(submitted, 400).find(r => r.status === 'running').id, 'request-0');
  assert.equal(queuePosition(submitted, 'new'), 2);
  assert.equal(queuePosition(submitted, 'request-0'), 0);
});

test('queue positions advance after completion and never include completed jobs', () => {
  const next = finishCurrent(startNext(requests(), 100), 200);
  assert.equal(queuePosition(next, 'request-2'), 1);
  assert.equal(queuePosition(next, 'request-0'), 0);
  assert.equal(next.find(r => r.id === 'request-0').status, 'success');
});

test('empty and completed queues never produce phantom work', () => {
  assert.deepEqual(startNext([], 100), []);
  const done = requests().map(r => ({ ...r, status: 'success' }));
  assert.deepEqual(startNext(done, 100), done);
});
