import ChainedError from 'typescript-chained-error';

import { findEntityConfigurationEntry, findValueMapper } from './configs';
import { Context, ContextFrom, ContextTo, Format } from './types';
import { stringValueMapper } from './scalarMappers';

/**
 * Some rules of thumb:
 * 1. We support inheritance based on the class inheritance, as it's determined in the design-time, not run-time prototype chain.
 * 2. For Values, no inheritance is supported, but merging the mapper configuration
 * 3. DB - maps into and from DynamoDB format, DTO - into and from JSON-serializable format
 * 4. When entities are mapped into JSON-serializable or DynamoDB format, the mapping instructions and order are determined by the mapper configuration, which is selected based on the entity type
 *    the information of the used mapper configuration is stored as $type property
 * 5. When entities are mapped from JSON-serializable or DynamoDB format, the previously persisted $type tells the mapper, what configuration should be used
 * 6. A set of annotations belonging Entity or Value or any scalar value determine the mapper configuration
 * 7. All scalar values, maps and lists are nullable
 * 8. TODO: Implement @AutoAttribute and @AutoAttributeFromParam
 * 9. TODO: Implement Strict Mode, when the types are checked in both ways: when mapping TO, whether the configuration matches the real value received by the mapper, when mapping FROM, whether
 * *  the configuration (selected based on $type value) matches the value received by the mapper
 */

export let t = 0;

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
    return `${this.prefix}.${this._path.join('.')}`;
  }

  getTime(): number {
    return +new Date() - this._start;
  }
}

class ConcreteContextFrom extends BaseContext implements ContextFrom {
  constructor(prefix: string, public readonly source: Format) {
    super(prefix);
  }
}

class ConcreteContextTo extends BaseContext implements ContextTo {
  constructor(prefix: string, public readonly target: Format) {
    super(prefix);
  }
}

function to(format: Format, entity: any): any {
  const $type = entity.constructor.name;
  const config = findEntityConfigurationEntry($type);
  if (!config) {
    throw new Error(`Mapper is not configured for "${entity.constructor.name}"`);
  }
  const { to } = findValueMapper(config.class)!;
  const ctx = new ConcreteContextTo($type, format);
  try {
    const value = to(entity, ctx);
    t += ctx.getTime();
    return value;
  } catch (e) {
    if (e instanceof Error) {
      throw new ChainedError(`Cannot map ${ctx.getPath()} to ${format}, reason: ${e.message}`, e);
    }
    throw new ChainedError(`Cannot map ${ctx.getPath()} to ${format}, reason: ${e}`);
  }
}

function from(format: Format, value: any): any {
  if (!value?.$type) {
    throw new Error('No type information property is on the value from the database. Cannot rehydrate');
  }
  const ctx = new ConcreteContextFrom('', format);
  const $type = stringValueMapper.from(value.$type, ctx)!;
  (ctx as any).prefix = $type;
  const config = findEntityConfigurationEntry($type.split('@')[0]);
  if (!config) {
    throw new Error(`Mapper is not configured for "${$type}"`);
  }
  const { from } = findValueMapper(config.class)!;
  try {
    const entity = from(value, ctx);
    t += +ctx.getTime();
    return entity;
  } catch (e) {
    if (e instanceof Error) {
      throw new ChainedError(`Cannot map ${ctx.getPath()} from ${format}, reason: ${e.message}`, e);
    }
    throw new ChainedError(`Cannot map ${ctx.getPath()} from ${format}, reason: ${e}`);
  }
}

const DataMapper = {
  toDb: to.bind(null, 'DB'),
  fromDb<T>(dbValue: any): T {
    return from('DB', dbValue);
  },
  toDto: to.bind(null, 'DTO'),
  fromDto<T>(value: any): T {
    return from('DTO', value);
  },
};

export default DataMapper;
