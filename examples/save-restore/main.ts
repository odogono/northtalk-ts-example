// Save and restore: a Group's whole state is one byte string.
//
// - `group.save()` captures every Script's variables, mailboxes and waits.
// - `core.restore()` rebuilds the Group, for example in a new process.
//   Grants aren't saved: the Host hands them back by Script and Grant name.
// - This example pumps by hand with `group.pump(nowMicros())` instead of
//   using the driver, which suits a Host that owns its own event loop.
import {
  consoleCapability,
  createCore,
  nowMicros,
  talk,
  text,
  type Group,
} from '@northtalk/ts';

const source = talk`
  script variable seen = []

  on visit name
    put name after seen
    say "seen " & the length of seen & " so far"
  end visit
`;

export const run = () => {
  const core = createCore();
  const lines: string[] = [];
  const consoleDef = consoleCapability(
    {
      write: (_call, value) => lines.push(value.asText() ?? ''),
      read: () => {},
    },
    { write: { fuel: 0 }, read: { fuel: 0 } },
  );
  const grant = consoleDef.grant(['write'], undefined);

  const visit = (group: Group, name: string) => {
    group.script('guestbook')!.deliver({ name: 'visit', args: [text(name)] });
    group.pump(nowMicros());
  };

  const first = core.newGroup({ name: 'guestbook' });
  first.load({ name: 'guestbook', source, grants: { console: grant } });
  visit(first, 'Ada');
  visit(first, 'Grace');
  const saved = first.save();
  lines.push(`saved ${saved.byteLength} bytes`);

  const { group: second } = core.restore(saved, {
    name: 'guestbook',
    grants: (script, name) =>
      script === 'guestbook' && name === 'console' ? grant : undefined,
    libraries: [],
    onMismatch: 'reject',
    resolve: () => undefined,
  });
  visit(second, 'Edsger');
  return lines;
};

if (import.meta.main) {
  for (const line of run()) console.log(line);
}
