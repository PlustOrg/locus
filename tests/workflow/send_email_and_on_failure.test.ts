import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';
import { executeWorkflow } from '../../src/workflow/runtime';

const good = `workflow Mailer {\n  trigger { on:webhook(secret: MAIL_SECRET) }\n  steps {\n    send_email { to: user, subject: Welcome }\n  }\n}`;

const missingTo = `workflow BadMail { trigger { t } steps { send_email { subject: Hi } } }`;
const missingSubjectTemplate = `workflow BadMail2 { trigger { t } steps { send_email { to: someone } } }`; // lacks subject/template

const withFailure = `workflow FailPath { trigger { t } steps { run boom() } on_failure { compensate } }`;

describe('send_email + on_failure', () => {
  test('parses & validates send_email and captures triggerMeta webhook', () => {
    const ast: any = parseLocus(good, 'mail.locus');
    const unified: any = mergeAsts([ast]);
    validateUnifiedAst(unified); // should not throw
    const wf = unified.workflows[0];
    expect(wf.steps[0].kind).toBe('send_email');
  expect(wf.steps[0].to).toBe('user');
    expect(wf.triggerMeta?.type).toBe('webhook');
    expect(wf.triggerMeta?.secretRef).toBe('MAIL_SECRET');
  });
  test('validation errors for missing to', () => {
    const ast: any = parseLocus(missingTo, 'bad1.locus');
    const unified = mergeAsts([ast]);
    expect(()=>validateUnifiedAst(unified)).toThrow(/missing 'to'/);
  });
  test('validation errors for missing subject/template', () => {
    const ast: any = parseLocus(missingSubjectTemplate, 'bad2.locus');
    const unified = mergeAsts([ast]);
    expect(()=>validateUnifiedAst(unified)).toThrow(/requires 'subject' or 'template'/);
  });
  test('on_failure executes when no on_error block', () => {
    const ast: any = parseLocus(withFailure, 'fail.locus');
    const unified = mergeAsts([ast]);
    // runtime: boom action throws
    const log = executeWorkflow(unified.workflows[0], { actions: { boom: () => { throw new Error('x'); }, compensate: () => 'ok' } });
    const compensate = log.find(e=>e.detail?.action==='compensate' && e.detail?.onFailure);
    expect(compensate).toBeTruthy();
  });
});
