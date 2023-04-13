export class RenderError extends Error {
  position?: number;

  constructor(message: string, position?: number) {
    super(message);
    this.position = position;
  }
}
