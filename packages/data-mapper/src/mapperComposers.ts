import { ChainableMapper, EntityInternalConfig, Mapper, NullableDbBool, NullableDbNumber, NullableDbString, ValueInternalConfig } from './types';
import { anyValueMapper, stringValueMapper } from './scalarMappers';

// TODO: Implement checking for recursive references - we don't support them and not going to support
// TODO: Implement versioning: entities from DB should be upscalable to the current version

export function composeMapMapper<V>(mapper: Mapper<V, any>): Mapper<Map<string, V> | null, any> {
  const { from, to } = mapper;
  return {
    from: (src, ctx) => {
      if (ctx.source === 'DB') {
        if (src.NULL) {
          return null;
        }
        return new Map(
          Object.entries(src.M).map(([key, value]) => {
            ctx.in(key);
            const v = from(value, ctx);
            ctx.out();
            return [key, v];
          })
        );
      }
      return src === null
        ? null
        : new Map(
            Object.entries(src).map(([key, value]) => {
              ctx.in(key);
              const v = from(value, ctx);
              ctx.out();
              return [key, v];
            })
          );
    },
    to: (from, ctx) => {
      if (from === null) {
        return ctx.target === 'DB' ? { NULL: true } : null;
      }
      const entries = [];
      for (const [key, value] of from.entries()) {
        ctx.in(key);
        entries.push([`${key}`, to(value, ctx)]);
        ctx.out();
      }
      const map = Object.fromEntries(entries);
      return ctx.target === 'DB' ? { M: map } : map;
    },
  };
}

export function composeEntityAttributeMapper(propertyName: string, dbName: string, valueMapper: Mapper<any, any>): ChainableMapper<any, any> {
  const { from: valueFrom, to: valueTo } = valueMapper;
  return {
    to(entity, prev, ctx) {
      ctx.in(propertyName);
      const srcValue = entity[propertyName];
      if (srcValue !== undefined) {
        prev[dbName] = valueTo(srcValue, ctx);
      }
      ctx.out();
      return prev;
    },
    from(value, prev, ctx) {
      ctx.in(propertyName);
      const srcValue = value[dbName];
      if (srcValue !== undefined) {
        prev[propertyName] = valueFrom(srcValue, ctx);
      }
      ctx.out();
      return prev;
    },
  };
}

export function chainMapper(mapper: ChainableMapper<any, any>, nextMapper: Partial<ChainableMapper<any, any>>) {
  const { to: prevTo, from: prevFrom } = mapper;
  const { to: nextTo, from: nextFrom } = nextMapper;
  if (nextTo) {
    mapper.to = prevTo ? (entity, prevMapperResult, ctx) => nextTo(entity, prevTo(entity, prevMapperResult, ctx), ctx) : nextTo;
  }
  if (nextFrom) {
    mapper.from = prevFrom ? (entity, prevMapperResult, ctx) => nextFrom(entity, prevFrom(entity, prevMapperResult, ctx), ctx) : nextFrom;
  }
}

export function composeCollectionMapper<V>(elementMapper: Mapper<V, any>): Mapper<V[], any> {
  const { to, from } = elementMapper;
  return {
    to: (src, ctx) => {
      if (src === null) {
        return ctx.target === 'DB' ? { NULL: true } : null;
      }
      const items = src.map((val, idx) => {
        ctx.in(idx);
        const v = to(val, ctx);
        ctx.out();
        return v;
      });
      return ctx.target === 'DB' ? { L: items } : items;
    },
    from: (src, ctx) => {
      if (ctx.source === 'DB') {
        if (src.NULL) {
          return null;
        }
        return src.L.map((val: any, idx: number) => {
          ctx.in(idx);
          const v = from(val, ctx);
          ctx.out();
          return v;
        });
      }
      return src === null
        ? null
        : src.map((val: any, idx: number) => {
            ctx.in(idx);
            const v = from(val, ctx);
            ctx.out();
            return v;
          });
    },
  };
}

export const composeValueMapperForEntity = (entityConfig: EntityInternalConfig): Mapper<any, any> => ({
  from: (value, ctx) => {
    const instance = Object.create((entityConfig.class as any).prototype);
    return entityConfig.from!(ctx.level > 0 && ctx.source === 'DB' ? value.M : value, instance, ctx);
  },
  to: (entity, ctx) => {
    const dbValue = {
      ...entityConfig.to!(entity, {}, ctx),
      $type: stringValueMapper.to(`${entityConfig.class.name}@${entityConfig.version || 1}`, ctx), // The version will be used for versioning (upscaling entities)
    };
    return ctx.level > 0 && ctx.target === 'DB' ? { M: dbValue } : dbValue;
  },
});

export const composeValueMapperForValue = (valueConfig: ValueInternalConfig): Mapper<any, NullableDbString | NullableDbNumber | NullableDbBool | string | number | boolean | null> => ({
  from: (value, ctx) => {
    const instance = Object.create((valueConfig.class as any).prototype);
    return valueConfig.from!(anyValueMapper.from(value, ctx), instance, ctx);
  },
  to: (id, ctx) => anyValueMapper.to(valueConfig.to(id, undefined, ctx), ctx),
});
