// Messages and time: delivering Messages, Script state, and waits on the real
// Clock.
//
// - `deliver` sends a Message that needs no answer; `invoke` asks for one.
// - Each Message starts a Run. A Run that waits is parked, and others run.
// - The driver pumps the Group when a wait falls due, so `wait 1 s` in a
//   Script is one second of wall-clock time.
// - `say` goes through the `console` Standard Capability, bound to the Host.
import { readFileSync } from 'node:fs';
import {
  consoleCapability,
  createCore,
  fromValue,
  text,
  dec,
  quantity,
} from '@northtalk/ts';
import { newDrivenGroup } from '@northtalk/ts/driver';

export const createReminders = (write: (line: string) => void) => {
  const { group, drive } = newDrivenGroup(createCore(), { name: 'reminders' });
  const consoleDef = consoleCapability(
    {
      write: (_call, value) => write(value.asText() ?? String(value)),
      read: () => {},
    },
    { write: { fuel: 0 }, read: { fuel: 0 } },
  );
  const script = group.load({
    name: 'reminders',
    source: readFileSync(new URL('reminders.talk', import.meta.url), 'utf8'),
    grants: { console: consoleDef.grant(['write'], undefined) },
  });
  return {
    /** Fire and forget: the Script says the note after `seconds`. */
    remind: (note: string, seconds: number) => {
      script.deliver({
        name: 'remind',
        args: [text(note), quantity(dec(String(seconds)), 's')],
      });
    },
    pending: async () => Number(fromValue(await script.invoke('status'))),
    close: () => drive.close('reminders closed'),
  };
};

if (import.meta.main) {
  const reminders = createReminders(line => console.log(line));
  reminders.remind('stretch', 0.2);
  reminders.remind('drink some water', 0.1);
  console.log('pending:', await reminders.pending());
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('pending:', await reminders.pending());
  await reminders.close();
}
