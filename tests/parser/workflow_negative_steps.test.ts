import { parseLocus } from '../../src/parser';

function shouldFail(src: string, re: RegExp) {
  let err: any;
  try { parseLocus(src, 'neg.locus'); } catch (e:any) { err = e; }
  if (!err) throw new Error('Expected failure');
  expect(String(err.message)).toMatch(re);
}

describe('workflow negative step grammar', () => {
  test('missing run action identifier', () => {
    shouldFail(`workflow W { trigger { t } steps { run () } }`, /Identifier/);
  });
  test('malformed forEach missing in keyword', () => {
    shouldFail(`workflow W { trigger { t } steps { forEach item list { run x() } } }`, /in/);
  });
  test('branch missing closing brace', () => {
    shouldFail(`workflow W { trigger { t } steps { branch { condition: x == 1 steps { run a() }  }`, /RCurly|}/);
  });
  test('send_email missing block braces', () => {
    shouldFail(`workflow W { trigger { t } steps { send_email to: x } }`, /LCurly|\{/);
  });
  test('http_request missing braces', () => {
    shouldFail(`workflow W { trigger { t } steps { http_request } }`, /LCurly|\{/);
  });
  test('delay missing braces', () => {
    shouldFail(`workflow W { trigger { t } steps { delay } }`, /LCurly|\{/);
  });
  test('nested steps block inside run not allowed', () => {
    shouldFail(`workflow W { trigger { t } steps { run doThing() { run other() } } }`, /RCurly|}/);
  });
});
