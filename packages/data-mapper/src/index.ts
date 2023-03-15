import DataMapper from "./DataMapper";
import { anyValueMapper, booleanValueMapper, numberValueMapper, stringValueMapper } from "./scalarMappers";
import { findEntityConfigurationEntry, getDictionaryMapperInstance } from "./configs";

export const ScalarMappers = {
  string: stringValueMapper,
  boolean: booleanValueMapper,
  number: numberValueMapper,
  any: anyValueMapper,
};

export const Config = {
  findEntityConfigurationEntry,
  getDictionaryMapperInstance,
};

export { type ChainableMapper } from "./types";
export * from "./decorators";

export default DataMapper;
export type DataMapper = typeof DataMapper;
