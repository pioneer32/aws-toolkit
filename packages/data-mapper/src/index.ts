import DataMapper from "./DataMapper";
import { anyValueMapper, booleanValueMapper, numberValueMapper, stringValueMapper } from "./scalarMappers";
import { findEntityConfigurationEntry } from "./configs";

export const ScalarMappers = {
  string: stringValueMapper,
  boolean: booleanValueMapper,
  number: numberValueMapper,
  any: anyValueMapper,
};

export const Config = {
  findEntityConfigurationEntry,
};

export { type ChainableMapper } from "./types";

export default DataMapper;
