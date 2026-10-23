// Limits: a Host runs untrusted Scripts safely by bounding each Run.
//
// - `fuelPerRun` caps the work one Run may do; a runaway loop is stopped
//   and its Request fails, while the Group and other Scripts carry on.
// - A load error reports where the source is wrong, before anything runs.
import { createCore, LoadError, num, ScriptError, talk } from '@northtalk/ts';
import { newDrivenGroup } from '@northtalk/ts/driver';

export const run = async () => {
  const lines: string[] = [];
  const { group, drive } = newDrivenGroup(createCore(), { name: 'sandbox' });
  try {
    const script = group.load({
      name: 'untrusted',
      limits: { fuelPerRun: 5_000 },
      source: talk`
        on sum n
          put 0 into total
          repeat for each i in 1..n
            add i to total
          end repeat
          return total
        end sum
      `,
    });
    lines.push(`sum 10 = ${await script.invoke('sum', num(10))}`);
    try {
      await script.invoke('sum', num(1_000_000));
    } catch (error) {
      if (!(error instanceof ScriptError)) throw error;
      lines.push(`sum 1000000 failed: ${error.code} (${error.reason})`);
    }
    // The Script is still loaded and still answers.
    lines.push(`sum 3 = ${await script.invoke('sum', num(3))}`);

    try {
      group.load({
        name: 'broken',
        source: 'on oops\n  put into x\nend oops\n',
      });
    } catch (error) {
      if (!(error instanceof LoadError)) throw error;
      lines.push(`broken did not load: ${error.message}`);
    }
  } finally {
    await drive.close('sandbox closed');
  }
  return lines;
};

if (import.meta.main) {
  for (const line of await run()) console.log(line);
}
