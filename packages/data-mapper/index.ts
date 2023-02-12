import DataMapper from "./src/DataMapper";
import { anyValueMapper, booleanValueMapper, numberValueMapper, stringValueMapper } from "./src/scalarMappers";
import { findEntityConfigurationEntry } from "./src/configs";

export const ScalarMappers = {
  string: stringValueMapper,
  boolean: booleanValueMapper,
  number: numberValueMapper,
  any: anyValueMapper,
};

export const Config = {
  findEntityConfigurationEntry,
};

export { type ChainableMapper } from "./src/types";

export default DataMapper;
