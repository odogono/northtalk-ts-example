import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createReminders } from '../examples/messages-and-time/main.ts';

test('delivered reminders wait on the real Clock, in due order', async () => {
  const said: string[] = [];
  const reminders = createReminders(line => said.push(line));
  try {
    reminders.remind('second', 0.15);
    reminders.remind('first', 0.05);
    assert.equal(await reminders.pending(), 2);
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.deepEqual(said, ['Reminder: first', 'Reminder: second']);
    assert.equal(await reminders.pending(), 0);
  } finally {
    await reminders.close();
  }
});
