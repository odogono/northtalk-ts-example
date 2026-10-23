// The smallest embedding: load a Script, send it a Request, pump, read the answer.
import { createCore, nowMicros, talk, text } from '@northtalk/ts';

const group = createCore().newGroup({ name: 'minimal' });
const script = group.load({
  name: 'hello',
  source: talk`
    on greet name
      return "Hello, " & name & "!"
    end greet
  `,
});

const { result } = script.request({ name: 'greet', args: [text('world')] });
group.pump(nowMicros());
console.log((await result).asText());
