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
 * 8. TODO: Implement @AutoAttr and @AutoAttrFromParam
 * 9. TODO: Implement Strict Mode, when the types are checked in both ways: when mapping TO, whether the configuration matches the real value received by the mapper, when mapping FROM, whether
 * *  the configuration (selected based on $type value) matches the value received by the mapper
 */

export let t = 0;

function to(format: Format, entity: any): any {
  if (!entity) {
    throw new Error("DM013: Cannot map an empty entity.");
  }
  if (!entity.constructor) {
    throw new Error("DM014: Cannot map an entity with empty constructor.");
  }
  const $type = entity.constructor.name;
  if (!$type) {
    throw new Error("DM015: Cannot map an entity with empty constructor name.");
  }
  const config = findEntityConfigurationEntry($type);
  // TODO Add checks and throw an error (with a meaningful message) if entity is a value object (Value)
  // It's fine and we can map a Value Object into a DB/DTO value, but it's not possible to reverse it - a scalar value (in which mapping a value object results) doesn't contain any information about what constructor to use to rehydrate it
  if (!config) {
    throw new Error(
      `DM010: No entity configuration was found for classname "${$type}". Please make sure the entity class is property annotated. If the classname looks obfuscated, please refer to the documentation`
    );
  }
  const mapper = findValueMapper(config.class);
  if (!mapper) {
    throw new Error(
      `DM011: No mapper was found for "${$type}", though the entity configuration was found. Please make sure the entity class is property annotated.`
    );
  }
  const { to } = mapper;
  const ctx = new ConcreteContextTo($type, format);
  try {
    const value = to(entity, ctx);
    t += ctx.getTime();
    return value;
  } catch (e) {
    if (e instanceof Error) {
      throw new ChainedError(`DM012: Mapper has thrown an error. Cannot map ${ctx.getPath()} to ${format}, reason: ${e.message}`, e);
    }
    throw new ChainedError(`DM012: Mapper has thrown an error. Cannot map ${ctx.getPath()} to ${format}, reason: ${e}`);
  }
}

function from(format: Format, value: any): any {
  if (!value) {
    throw new Error("DM005: Cannot rehydrate an empty value.");
  }
  if (!value.$type) {
    throw new Error("DM006: No type-mark ($type) property was found on the value. Please make sure $type property exists on the value.");
  }
  const ctx = new ConcreteContextFrom("", format);
  const $type = stringValueMapper.from(value.$type, ctx)!;
  (ctx as any).prefix = $type;
  const [className, version] = $type.split("@");
  const config = findEntityConfigurationEntry(className);
  if (!config) {
    throw new Error(`DM007: No entity configuration was found for "${$type}". Please make sure the entity class is property annotated.`);
  }
  if ((config.version || 1) !== +version) {
    throw new Error(`DM009: Versioning of entities is not implemented yet. Please refer to the documentation`);
  }
  const mapper = findValueMapper(config.class);
  if (!mapper) {
    throw new Error(
      `DM008: No mapper was found for "${$type}", though the entity configuration was found. Please make sure the entity class is property annotated.`
    );
  }
  const { from } = mapper;
  try {
    const entity = from(value, ctx);
    t += +ctx.getTime();
    return entity;
  } catch (e) {
    if (e instanceof Error) {
      throw new ChainedError(`DM008: Mapper has thrown an error. Cannot map ${ctx.getPath()} from ${format}, reason: ${e.message}`, e);
    }
    throw new ChainedError(`DM008: Mapper has thrown an error. Cannot map ${ctx.getPath()} from ${format}, reason: ${e}`);
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
