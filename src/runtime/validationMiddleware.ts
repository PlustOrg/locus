import { validationErrorEnvelope, ValidationResult } from './validateRuntime';

export type BodyValidator = (body: any) => ValidationResult;

export function makeValidator(validator: BodyValidator) {
  return function locusValidationMiddleware(req: any, res: any, next: any) {
    const result = validator(req.body);
    if (!result.ok) return res.status(400).json(validationErrorEnvelope(result.errors!));
    next();
  };
}

export function requiredHeadersMiddleware(headers: string[]) {
  const wanted = headers.map(h => h.toLowerCase());
  return function locusRequiredHeaders(req: any, res: any, next: any) {
    const missing: string[] = [];
    for (const h of wanted) {
      if (!req.headers[h] || (Array.isArray(req.headers[h]) ? (req.headers[h] as string[])[0] === '' : req.headers[h] === '')) missing.push(h);
    }
    if (missing.length) {
      return res.status(400).json({ code: 'missing_header', errors: missing.map(m => ({ path: `header.${m}`, message: 'Missing required header', code: 'missing_header' })) });
    }
    next();
  };
}
