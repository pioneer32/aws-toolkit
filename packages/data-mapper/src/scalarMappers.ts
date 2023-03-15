import { NullableDbBool, NullableDbNumber, NullableDbString, ScalarMapper } from "./types";

export const stringValueMapper: ScalarMapper<string | null, NullableDbString | string | null> = {
  to(v, ctx) {
    return ctx.target === "DB" ? (v === null ? { NULL: true } : { S: `${v}` }) : v === null ? null : `${v}`;
  },
  from(v, ctx) {
    if (ctx.source === "DB") {
      let v0 = v as NullableDbString;
      return "NULL" in v0 ? null : v0.S;
    }
    return v === null ? null : `${v}`;
  },
};

export const numberValueMapper: ScalarMapper<number | null, NullableDbNumber | number | null> = {
  to(v, ctx) {
    return ctx.target === "DB" ? (v === null ? { NULL: true } : { N: `${v}` }) : v === null ? null : +v;
  },
  from(v, ctx) {
    if (ctx.source === "DB") {
      let v0 = v as NullableDbNumber;
      return "NULL" in v0 ? null : +v0.N;
    }
    return v === null ? null : +v;
  },
};

export const booleanValueMapper: ScalarMapper<boolean | null, NullableDbBool | boolean | null> = {
  to(v, ctx) {
    return ctx.target === "DB" ? (v === null ? { NULL: true } : { BOOL: !!v }) : v === null ? null : !!v;
  },
  from(v, ctx) {
    if (ctx.source === "DB") {
      let v0 = v as NullableDbBool;
      return "NULL" in v0 ? null : !!v0.BOOL;
    }
    return v === null ? null : !!v;
  },
};

export const anyValueMapper: ScalarMapper<
  string | number | boolean | null,
  NullableDbString | NullableDbNumber | NullableDbBool | string | number | boolean | null
> = {
  to(v, ctx) {
    if (v === null || typeof v === "number") {
      return numberValueMapper.to(v, ctx);
    }
    if (typeof v === "boolean") {
      return booleanValueMapper.to(v, ctx);
    }
    return stringValueMapper.to(v, ctx);
  },
  from(v, ctx) {
    if (ctx.source === "DB") {
      let v0 = v as NullableDbString | NullableDbNumber | NullableDbBool;
      if ("N" in v0) {
        return numberValueMapper.from(v0, ctx);
      }
      if ("BOOL" in v0) {
        return booleanValueMapper.from(v0, ctx);
      }
      return stringValueMapper.from(v0, ctx);
    }
    if (v === null || typeof v === "number") {
      return numberValueMapper.from(v, ctx);
    }
    if (typeof v === "boolean") {
      return booleanValueMapper.from(v, ctx);
    }
    return stringValueMapper.from(v as string | null, ctx);
  },
};
