export class BuildError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'BuildError';
  }
}

export class GeneratorError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'GeneratorError';
  }
}
