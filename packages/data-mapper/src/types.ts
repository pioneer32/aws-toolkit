export type Format = "DB" | "DTO";

export interface Context {
  /**
   * @description Starts with 0 - that means this is the root entity requested to be mapped
   */
  readonly level: number;
  out(): void;

  // TODO: Add more as needed
}

export interface ContextTo extends Context {
  target: Format;
  in(step: string | number): ContextTo;
  // TODO: Add more as needed
}

export interface ContextFrom extends Context {
  source: Format;
  in(step: string | number): ContextFrom;
  // TODO: Add more as needed
}

export type MapperFunction<F, T, C> = (src: F, context: C) => T;
export interface Mapper<INT, EXT> {
  to: MapperFunction<INT, EXT, ContextTo>;
  from: MapperFunction<EXT, INT, ContextFrom>;
}

export interface PublicMapper<INT, DB, DTO> extends Mapper<INT, DB | DTO> {
  toDb: (value: INT) => DB;
  toDto: (value: INT) => DTO;
  fromDb: (dbValue: DB) => INT;
  fromDto: (dtoValue: DTO) => INT;
}

export type ChainableMapperFunction<F, T, C> = (src: F, prevMapperResult: T, context: C) => T;
export type ChainableMapper<INT, EXT> = {
  to: ChainableMapperFunction<INT, EXT, ContextTo>;
  from: ChainableMapperFunction<EXT, INT, ContextFrom>;
};

export type EntityMapperConfig = ChainableMapper<any, any>;
export type ValueMapperConfig = ChainableMapper<any, any>;

export interface EntityInternalConfig extends EntityMapperConfig {
  class: new (...args: any[]) => any;
  version: 1; // TODO: Implement versioning values coming from DB
}

export interface ValueInternalConfig extends ValueMapperConfig {
  class: new (...args: any[]) => any;
}

export type Class<E = any> = (new (...args: any[]) => E) | Function; // Stupid TS doesn't let me pass a class, when its constructor is private....

export type DbString = { S: string };
export type DbNull = { NULL: true };
export type NullableDbString = DbString | DbNull;
export type DbNumber = { N: string };
export type NullableDbNumber = DbNumber | DbNull;
export type DbBool = { BOOL: boolean };
export type NullableDbBool = DbBool | DbNull;
export type DbMap = { M: any };
export type NullableDbMap = DbMap | DbNull;

export interface ScalarMapper<INT, EXT> {
  to: MapperFunction<INT, EXT, Pick<ContextTo, "target">>;
  from: MapperFunction<EXT, INT, Pick<ContextFrom, "source">>;
}

export interface PublicScalarMapper<INT, DB, DTO> extends ScalarMapper<INT, DB | DTO> {
  toDb: (value: INT) => DB;
  toDto: (value: INT) => DTO;
  fromDb: (dbValue: DB) => INT;
  fromDto: (dtoValue: DTO) => INT;
}
