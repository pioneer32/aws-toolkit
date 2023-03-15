import { Context, ContextFrom, ContextTo, Format } from "./types";

class BaseContext implements Context {
  private _path: (string | number)[] = [];
  private _start: number = +new Date();

  constructor(private prefix: string) {}

  get level(): number {
    return this._path.length;
  }

  in(step: string | number) {
    this._path.push(step);
    return this;
  }

  out() {
    this._path.pop();
  }

  getPath(): string {
    return `${this.prefix}.${this._path.join(".")}`;
  }

  getTime(): number {
    return +new Date() - this._start;
  }
}

export class ConcreteContextFrom extends BaseContext implements ContextFrom {
  constructor(prefix: string, public readonly source: Format) {
    super(prefix);
  }
}

export class ConcreteContextTo extends BaseContext implements ContextTo {
  constructor(prefix: string, public readonly target: Format) {
    super(prefix);
  }
}
