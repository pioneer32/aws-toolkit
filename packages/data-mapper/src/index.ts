import DataMapper from "./DataMapper";
import { anyValueMapper, booleanValueMapper, numberValueMapper, stringValueMapper } from "./scalarMappers";
import { findEntityConfigurationEntry, getOrComposeDictionaryMapperInstance } from "./configs";
import { Class, NullableDbBool, NullableDbMap, NullableDbNumber, NullableDbString, PublicMapper, PublicScalarMapper } from "./types";
import { ConcreteContextFrom, ConcreteContextTo } from "./context";

export const ScalarMappers = {
  string: {
    ...stringValueMapper,
    toDb: (v) => stringValueMapper.to(v, { target: "DB" }) as NullableDbString,
    fromDb: (v) => stringValueMapper.from(v, { source: "DB" }) as string | null,
    toDto: (v) => stringValueMapper.to(v, { target: "DTO" }) as string | null,
    fromDto: (v) => stringValueMapper.from(v, { source: "DTO" }) as string | null,
  } as PublicScalarMapper<string | null, NullableDbString, string | null>,
  boolean: {
    ...booleanValueMapper,
    toDb: (v) => booleanValueMapper.to(v, { target: "DB" }) as NullableDbBool,
    fromDb: (v) => booleanValueMapper.from(v, { source: "DB" }) as boolean | null,
    toDto: (v) => booleanValueMapper.to(v, { target: "DTO" }) as boolean | null,
    fromDto: (v) => booleanValueMapper.from(v, { source: "DTO" }) as boolean | null,
  } as PublicScalarMapper<boolean | null, NullableDbBool, boolean | null>,
  number: {
    ...numberValueMapper,
    toDb: (v) => numberValueMapper.to(v, { target: "DB" }) as NullableDbNumber,
    fromDb: (v) => numberValueMapper.from(v, { source: "DB" }) as number | null,
    toDto: (v) => numberValueMapper.to(v, { target: "DTO" }) as number | null,
    fromDto: (v) => numberValueMapper.from(v, { source: "DTO" }) as number | null,
  } as PublicScalarMapper<number | null, NullableDbNumber, number | null>,
  any: {
    ...anyValueMapper,
    toDb: (v) => anyValueMapper.to(v, { target: "DB" }) as NullableDbString | NullableDbNumber | NullableDbBool,
    fromDb: (v) => anyValueMapper.from(v, { source: "DB" }) as string | number | boolean | null,
    toDto: (v) => anyValueMapper.to(v, { target: "DTO" }) as string | number | boolean | null,
    fromDto: (v) => anyValueMapper.from(v, { source: "DTO" }) as string | number | boolean | null,
  } as PublicScalarMapper<string | number | boolean | null, NullableDbString | NullableDbNumber | NullableDbBool, string | number | boolean | null>,
};

const publicDictionaryMappers = new WeakMap<any, PublicMapper<Map<string, any> | null, NullableDbMap, any>>();

export const Config = {
  findEntityConfigurationEntry,
  getDictionaryMapperInstance<E>(valueType: Class<E>): PublicMapper<Map<string, E> | null, NullableDbMap, any> {
    if (publicDictionaryMappers.has(valueType)) {
      return publicDictionaryMappers.get(valueType)!;
    }
    const mapper = getOrComposeDictionaryMapperInstance<E>(valueType);
    const publicMapper = {
      ...mapper,
      toDb: (v: Map<string, E>) => mapper.to(v, new ConcreteContextTo("", "DB")),
      fromDb: (v: any): Map<string, E> | null => mapper.from(v, new ConcreteContextFrom("", "DB")),
      toDto: (v: Map<string, E>) => mapper.to(v, new ConcreteContextTo("", "DTO")),
      fromDto: (v: any): Map<string, E> | null => mapper.from(v, new ConcreteContextFrom("", "DTO")),
    } as PublicMapper<Map<string, E> | null, NullableDbMap, any>;
    publicDictionaryMappers.set(valueType, publicMapper);
    return publicMapper;
  },
};

export type { ChainableMapper } from "./types";
export * from "./decorators";

export default DataMapper;
export type DataMapper = typeof DataMapper;

export { default as Utils } from "./utils";
