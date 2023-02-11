import {ContextFrom, ContextTo, MapperFunction, NullableDbBool, NullableDbNumber, NullableDbString} from './types';

type ScalarMapper<V, DB, DTO> = {
  to: MapperFunction<V, DB | DTO, Pick<ContextTo, 'target'>>;
  toDb: (value: V) => DB;
  toDto: (value: V) => DTO;
  fromDb: (dbValue: DB) => V;
  fromDto: (dtoValue: DTO) => V;
  from: MapperFunction<DB | DTO, V, Pick<ContextFrom, 'source'>>;
};

export const stringValueMapper: ScalarMapper<string | null, NullableDbString, string | null> = {
  to(v, ctx) {
    return ctx.target === 'DB' ? (v === null ? { NULL: true } : { S: `${v}` }) : v === null ? null : `${v}`;
  },
  from(v, ctx) {
    if (ctx.source === 'DB') {
      let v0 = v as NullableDbString;
      return 'NULL' in v0 ? null : v0.S;
    }
    return v === null ? null : `${v}`;
  },
  toDb: (v) => stringValueMapper.to(v, { target: 'DB' }) as NullableDbString,
  fromDb: (v) => stringValueMapper.from(v, { source: 'DB' }) as string | null,
  toDto: (v) => stringValueMapper.to(v, { target: 'DTO' }) as string | null,
  fromDto: (v) => stringValueMapper.from(v, { source: 'DTO' }) as string | null,
};

export const numberValueMapper: ScalarMapper<number | null, NullableDbNumber, number | null> = {
  to(v, ctx) {
    return ctx.target === 'DB' ? (v === null ? { NULL: true } : { N: `${v}` }) : v === null ? null : +v;
  },
  from(v, ctx) {
    if (ctx.source === 'DB') {
      let v0 = v as NullableDbNumber;
      return 'NULL' in v0 ? null : +v0.N;
    }
    return v === null ? null : +v;
  },
  toDb: (v) => numberValueMapper.to(v, { target: 'DB' }) as NullableDbNumber,
  fromDb: (v) => numberValueMapper.from(v, { source: 'DB' }) as number | null,
  toDto: (v) => numberValueMapper.to(v, { target: 'DTO' }) as number | null,
  fromDto: (v) => numberValueMapper.from(v, { source: 'DTO' }) as number | null,
};

export const booleanValueMapper: ScalarMapper<boolean | null, NullableDbBool, boolean | null> = {
  to(v, ctx) {
    return ctx.target === 'DB' ? (v === null ? { NULL: true } : { BOOL: !!v }) : v === null ? null : !!v;
  },
  from(v, ctx) {
    if (ctx.source === 'DB') {
      let v0 = v as NullableDbBool;
      return 'NULL' in v0 ? null : !!v0.BOOL;
    }
    return v === null ? null : !!v;
  },
  toDb: (v) => booleanValueMapper.to(v, { target: 'DB' }) as NullableDbBool,
  fromDb: (v) => booleanValueMapper.from(v, { source: 'DB' }) as boolean | null,
  toDto: (v) => booleanValueMapper.to(v, { target: 'DTO' }) as boolean | null,
  fromDto: (v) => booleanValueMapper.from(v, { source: 'DTO' }) as boolean | null,
};

export const anyValueMapper: ScalarMapper<string | number | boolean | null, NullableDbString | NullableDbNumber | NullableDbBool, string | number | boolean | null> = {
  to(v, ctx) {
    if (v === null || typeof v === 'number') {
      return numberValueMapper.to(v, ctx);
    }
    if (typeof v === 'boolean') {
      return booleanValueMapper.to(v, ctx);
    }
    return stringValueMapper.to(v, ctx);
  },
  from(v, ctx) {
    if (ctx.source === 'DB') {
      let v0 = v as NullableDbString | NullableDbNumber | NullableDbBool;
      if ('N' in v0) {
        return numberValueMapper.from(v0, ctx);
      }
      if ('BOOL' in v0) {
        return booleanValueMapper.from(v0, ctx);
      }
      return stringValueMapper.from(v0, ctx);
    }
    if (v === null || typeof v === 'number') {
      return numberValueMapper.from(v, ctx);
    }
    if (typeof v === 'boolean') {
      return booleanValueMapper.from(v, ctx);
    }
    return stringValueMapper.from(v as string | null, ctx);
  },
  toDb: (v) => anyValueMapper.to(v, { target: 'DB' }) as NullableDbString | NullableDbNumber | NullableDbBool,
  fromDb: (v) => anyValueMapper.from(v, { source: 'DB' }) as string | number | boolean | null,
  toDto: (v) => anyValueMapper.to(v, { target: 'DTO' }) as string | number | boolean | null,
  fromDto: (v) => anyValueMapper.from(v, { source: 'DTO' }) as string | number | boolean | null,
};
