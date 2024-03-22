import ChainedError from "typescript-chained-error";

import { findEntityConfigurationEntry, findValueMapper } from "./configs";
import { Format } from "./types";
import { stringValueMapper } from "./scalarMappers";
import { ConcreteContextFrom, ConcreteContextTo } from "./context";

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
 * 8. TODO: Implement @AutoAttribute and @AutoAttrFromParam
 * 9. TODO: Implement Strict Mode, when the types are checked in both ways: when mapping TO, whether the configuration matches the real value received by the mapper, when mapping FROM, whether
 * *  the configuration (selected based on $type value) matches the value received by the mapper
 */

export let t = 0;

function to(format: Format, entity: any): any {
  const $type = entity.constructor.name;
  const config = findEntityConfigurationEntry($type);
  // TODO Add checks and throw an error (with a meaningful message) if entity is a value object (Value)
  // It's fine and we can map a Value Object into a DB/DTO value, but it's not possible to reverse it - a scalar value (in which mapping a value object results) doesn't contain any information about what constructor to use to rehydrate it
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
    throw new Error("No type information property is on the value from the database. Cannot rehydrate");
  }
  const ctx = new ConcreteContextFrom("", format);
  const $type = stringValueMapper.from(value.$type, ctx)!;
  (ctx as any).prefix = $type;
  const config = findEntityConfigurationEntry($type.split("@")[0]);
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
  toDb: to.bind(null, "DB"),
  fromDb<T>(dbValue: any): T {
    return from("DB", dbValue);
  },
  toDto: to.bind(null, "DTO"),
  fromDto<T>(value: any): T {
    return from("DTO", value);
  },
};

export default DataMapper;
