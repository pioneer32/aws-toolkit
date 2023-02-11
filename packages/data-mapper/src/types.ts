export type Format = 'DB' | 'DTO';

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
export type Mapper<V, DB> = {
  to: MapperFunction<V, DB, ContextTo>;
  from: MapperFunction<DB, V, ContextFrom>;
};
export type ChainableMapperFunction<F, T, C> = (src: F, prevMapperResult: T, context: C) => T;
export type ChainableMapper<V, DB> = {
  to: ChainableMapperFunction<V, DB, ContextTo>;
  from: ChainableMapperFunction<DB, V, ContextFrom>;
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

export type NullableDbString = { S: string } | { NULL: true };
export type NullableDbNumber = { N: string } | { NULL: true };
export type NullableDbBool = { BOOL: boolean } | { NULL: true };
