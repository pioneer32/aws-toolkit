import DataMapper, { ScalarMappers } from "../src/index";

import { Attr, AttrFromParam, Entity, Value } from "../src";

// TODO: Cover decorators with tests Especially how they enforce invariants
// TODO: Cover exported ScalarMapper

class I {
  @Attr()
  name: string = "I am an inlined entity";
}

@Value({
  to: (val: V) => `value=${val.name}`,
  from: (dbVal: string) => new V(dbVal.split("=")[1]),
})
class V {
  constructor(public name: string) {}
}

describe("DataMapper", () => {
  describe("Simple Attribute Mappers", () => {
    class SA11 {
      @Attr()
      num: number = 1;
      @Attr()
      bool: boolean = true;
      @Attr("private")
      private _private: string = "foo";

      @Attr()
      public optional1?: string = "bar";
      @Attr({ type: String })
      protected optional2: string | undefined = undefined;
      @Attr({ type: Number, name: "optional3" })
      private _optional3: number | null = null;
      @Attr()
      public optional4?: string;

      @Attr()
      public entity: I = new I();

      @Attr()
      public value: V = new V("I am a value");

      get private(): string {
        return this._private;
      }

      set private(value: string) {
        this._private = value;
      }

      constructor(@AttrFromParam() public id: number, @AttrFromParam() private _secret: string = "nope") {}
    }

    it("should map simple attributes", () => {
      const entity = new SA11(2);
      expect(entity).toBeInstanceOf(SA11);
      expect(entity.private).toBe("foo");

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("[1] dbValue");
      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("[1] dtoValue");

      const rehydratedEntityFromDb = DataMapper.fromDb<SA11>(dbValue);
      expect(rehydratedEntityFromDb).toBeInstanceOf(SA11);
      expect(rehydratedEntityFromDb.entity).toBeInstanceOf(I);
      expect(rehydratedEntityFromDb.value).toBeInstanceOf(V);
      expect(rehydratedEntityFromDb).toMatchSnapshot("[2] rehydratedEntityFromDb");
      expect(rehydratedEntityFromDb.private).toBe("foo");

      const rehydratedEntityFromDto = DataMapper.fromDto<SA11>(dtoValue);
      expect(rehydratedEntityFromDto).toBeInstanceOf(SA11);
      expect(rehydratedEntityFromDto.entity).toBeInstanceOf(I);
      expect(rehydratedEntityFromDto.value).toBeInstanceOf(V);
      expect(rehydratedEntityFromDto).toMatchSnapshot("[2] rehydratedEntityFromDto");
      expect(rehydratedEntityFromDto.private).toBe("foo");
    });
  });

  describe("Dictionary Attribute Mappers", () => {
    class DA11 {
      @Attr.Dictionary(Number)
      numbers: Map<string, number> = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      @Attr.Dictionary("bools", Boolean)
      private _bools: Map<string, boolean> = new Map([
        ["z", true],
        ["x", false],
      ]);
      @Attr.Dictionary(Boolean)
      private _optional: Map<string, number> | null = null;

      @Attr.Dictionary(I)
      children: Map<string, I> = new Map([["x", new I()]]);

      constructor(
        @AttrFromParam.Map(String) public ids: Map<string, string>,
        @AttrFromParam.Map("nums", Number)
        private _secretNums: Map<string, number> = new Map([
          ["q", 3],
          ["w", 4],
        ])
      ) {}
    }

    it("should map dictionary attributes", () => {
      const entity = new DA11(
        new Map([
          ["id1", "1"],
          ["id2", "2"],
        ])
      );
      expect(entity).toBeInstanceOf(DA11);

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("[1] dbValue");

      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("[1] dtoValue");

      const rehydratedEntityFromDb = DataMapper.fromDb<DA11>(dbValue);
      expect(rehydratedEntityFromDb).toBeInstanceOf(DA11);
      expect(rehydratedEntityFromDb).toMatchSnapshot("[2] rehydratedEntityFromDb");
      expect(rehydratedEntityFromDb.children.get("x")).toBeInstanceOf(I);

      const rehydratedEntityFromDto = DataMapper.fromDto<DA11>(dtoValue);
      expect(rehydratedEntityFromDto).toBeInstanceOf(DA11);
      expect(rehydratedEntityFromDto).toMatchSnapshot("[2] rehydratedEntityFromDto");
      expect(rehydratedEntityFromDto.children.get("x")).toBeInstanceOf(I);
    });
  });

  describe("Collection Attribute Mappers", () => {
    class CA11 {
      @Attr.List(Number)
      numbers: number[] = [1, 2];

      @Attr.List("bools", Boolean)
      private _bools: boolean[] = [true, false];

      @Attr.List(Boolean)
      private _optional: number[] | null = null;

      @Attr.List(I)
      children: I[] = [new I()];

      @Attr.Set(Number)
      numbers2 = new Set<number>([1, 2]);

      @Attr.Set("bools2", Boolean)
      private _bools2 = new Set([true, false]);

      @Attr.Set(Boolean)
      private _optional2: Set<number> | null = null;

      @Attr.Set(I)
      children2 = new Set([new I()]);

      constructor(
        @AttrFromParam.List(String) public ids: string[],
        @AttrFromParam.Set(String) public ids2: Set<string>,
        @AttrFromParam.List("nums", Number) private _secretNums: number[] = [3, 4],
        @AttrFromParam.Set("nums2", Number) private _secretNums2 = new Set([3, 4])
      ) {}
    }

    it("should map collection attributes", () => {
      const entity = new CA11(["1", "2"], new Set(["1", "2"]));
      expect(entity).toBeInstanceOf(CA11);

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("[1] dbValue");

      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("[1] dtoValue");

      const rehydratedEntityFromDb = DataMapper.fromDb<CA11>(dbValue);
      expect(rehydratedEntityFromDb).toBeInstanceOf(CA11);
      expect(rehydratedEntityFromDb).toMatchSnapshot("[2] rehydratedEntityFromDb");
      expect(rehydratedEntityFromDb.children[0]).toBeInstanceOf(I);

      const rehydratedEntityFromDto = DataMapper.fromDto<CA11>(dtoValue);
      expect(rehydratedEntityFromDto).toBeInstanceOf(CA11);
      expect(rehydratedEntityFromDto).toMatchSnapshot("[2] rehydratedEntityFromDto");
      expect(rehydratedEntityFromDto.children[0]).toBeInstanceOf(I);
    });
  });

  describe("Annotated with @Entity", () => {
    @Entity({
      to: ({ id, name }, _prev, ctx) => {
        return { id: ScalarMappers.string.to(`id#${id}`, ctx), name: ScalarMappers.string.to(name, ctx) };
      },
      from: ({ id, name }, prevMapperResult, ctx) => {
        prevMapperResult.id = ScalarMappers.string.from(id, ctx)!.split("#")[1];
        prevMapperResult.name = ScalarMappers.string.from(name, ctx);
        return prevMapperResult;
      },
    })
    class EA11 {
      constructor(public id: string, public name: string) {}
    }

    it("should map collection attributes", () => {
      const entity = new EA11("foo", "bar");
      expect(entity).toBeInstanceOf(EA11);

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("[1] dbValue");

      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("[1] dtoValue");

      const rehydratedEntityFromDb = DataMapper.fromDb<EA11>(dbValue);
      expect(rehydratedEntityFromDb).toBeInstanceOf(EA11);
      expect(rehydratedEntityFromDb).toMatchSnapshot("[2] rehydratedEntityFromDb");

      const rehydratedEntityFromDto = DataMapper.fromDto<EA11>(dtoValue);
      expect(rehydratedEntityFromDto).toBeInstanceOf(EA11);
      expect(rehydratedEntityFromDto).toMatchSnapshot("[2] rehydratedEntityFromDto");
    });
  });

  describe("Inheritance", () => {
    class IA11 {
      @Attr()
      a: number = 1;
      @Attr()
      b: number = 1;

      constructor(@AttrFromParam() public q: number, @AttrFromParam() private w: number = 1) {}
    }

    abstract class IA12 extends IA11 {
      @Attr()
      a: number = 2;
      @Attr()
      c: number = 2;

      constructor(@AttrFromParam() private e: number = 2) {
        super(2, 2);
      }
    }

    class IA13 extends IA12 {
      @Attr()
      c: number = 3;
      @Attr("q")
      _q: number = 3;
    }

    @Entity()
    class IA14 extends IA12 {
      constructor() {
        super(4);
      }
    }

    it("should map simple attributes annotated with @Attribute and @AttrFromParam under inheritance", () => {
      const entity = new IA13();
      expect(entity).toBeInstanceOf(IA11);
      expect(entity).toBeInstanceOf(IA12);
      expect(entity).toBeInstanceOf(IA13);

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("[1] dbValue");

      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("[1] dtoValue");

      const rehydratedEntityFromDb = DataMapper.fromDb<IA13>(dbValue);
      expect(rehydratedEntityFromDb).toBeInstanceOf(IA11);
      expect(rehydratedEntityFromDb).toBeInstanceOf(IA12);
      expect(rehydratedEntityFromDb).toBeInstanceOf(IA13);
      expect(rehydratedEntityFromDb).toMatchSnapshot("[2] rehydratedEntityFromDb");

      const rehydratedEntityFromDto = DataMapper.fromDto<IA13>(dtoValue);
      expect(rehydratedEntityFromDto).toBeInstanceOf(IA11);
      expect(rehydratedEntityFromDto).toBeInstanceOf(IA12);
      expect(rehydratedEntityFromDto).toBeInstanceOf(IA13);
      expect(rehydratedEntityFromDto).toMatchSnapshot("[2] rehydratedEntityFromDto");
    });

    it("should map simple attributes annotated with @Attribute and @AttrFromParam under inheritance and @Entity()", () => {
      const entity = new IA14();
      expect(entity).toBeInstanceOf(IA11);
      expect(entity).toBeInstanceOf(IA12);
      expect(entity).toBeInstanceOf(IA14);

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("[1] dbValue");

      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("[1] dtoValue");

      const rehydratedEntityFromDb = DataMapper.fromDb<IA14>(dbValue);
      expect(rehydratedEntityFromDb).toBeInstanceOf(IA11);
      expect(rehydratedEntityFromDb).toBeInstanceOf(IA12);
      expect(rehydratedEntityFromDb).toBeInstanceOf(IA14);
      expect(rehydratedEntityFromDb).toMatchSnapshot("[2] rehydratedEntityFromDb");

      const rehydratedEntityFromDto = DataMapper.fromDto<IA14>(dtoValue);
      expect(rehydratedEntityFromDto).toBeInstanceOf(IA11);
      expect(rehydratedEntityFromDto).toBeInstanceOf(IA12);
      expect(rehydratedEntityFromDto).toBeInstanceOf(IA14);
      expect(rehydratedEntityFromDto).toMatchSnapshot("[2] rehydratedEntityFromDto");
    });
  });

  describe("Inheritance with @Entity(toDb and fromDb)", () => {
    @Entity({
      to: ({ id, name }) => {
        return { id: `id#${id}`, name };
      },
      from: ({ id, name }, prevMapperResult) => {
        prevMapperResult.id = id.split("#")[1];
        prevMapperResult.name = name;
        return prevMapperResult;
      },
    })
    class C21 {
      constructor(public id: string, public name: string) {}
    }

    abstract class C22 extends C21 {
      @Attr()
      public code: string;

      constructor(code: string) {
        super(`id_${code}`, `code is ${code}`);
        this.code = code;
      }
    }

    @Entity({
      to: ({ version }, prevMapperResult) => {
        prevMapperResult.Version = version;
        return prevMapperResult;
      },
      from: ({ Version }, prevMapperResult) => {
        prevMapperResult.version = Version;
        return prevMapperResult;
      },
    })
    class C23 extends C22 {
      constructor(public version: string) {
        super("code");
      }
    }

    it("should map an entity annotated with @Entity", () => {
      const entity = new C21("3", "foo");
      expect(entity).toBeInstanceOf(C21);

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("[1] dbValue");

      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("[1] dtoValue");

      const rehydratedEntityFromDb = DataMapper.fromDb<C21>(dbValue);
      expect(rehydratedEntityFromDb).toBeInstanceOf(C21);
      expect(rehydratedEntityFromDb).toMatchSnapshot("[2] rehydratedEntityFromDb");

      const rehydratedEntityFromDto = DataMapper.fromDto<C21>(dtoValue);
      expect(rehydratedEntityFromDto).toBeInstanceOf(C21);
      expect(rehydratedEntityFromDto).toMatchSnapshot("[2] rehydratedEntityFromDto");
    });

    it("should map an entity annotated with @Entity under inheritance", () => {
      const entity = new C23("v2");
      expect(entity).toBeInstanceOf(C21);
      expect(entity).toBeInstanceOf(C22);
      expect(entity).toBeInstanceOf(C23);

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("[1] dbValue");

      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("[1] dtoValue");

      const rehydratedEntityFromDb = DataMapper.fromDb<C23>(dbValue);
      expect(rehydratedEntityFromDb).toBeInstanceOf(C21);
      expect(rehydratedEntityFromDb).toBeInstanceOf(C22);
      expect(rehydratedEntityFromDb).toBeInstanceOf(C23);
      expect(rehydratedEntityFromDb).toMatchSnapshot("[2] rehydratedEntityFromDb");

      const rehydratedEntityFromDto = DataMapper.fromDto<C23>(dtoValue);
      expect(rehydratedEntityFromDto).toBeInstanceOf(C21);
      expect(rehydratedEntityFromDto).toBeInstanceOf(C22);
      expect(rehydratedEntityFromDto).toBeInstanceOf(C23);
      expect(rehydratedEntityFromDto).toMatchSnapshot("[2] rehydratedEntityFromDto");
    });
  });

  describe("@Values, special cases: Inheritance", () => {
    @Value({
      to: (instance: ID2) => `Foo#${instance.scope}#Id#${instance.id}`,
    })
    abstract class ID2 {
      constructor(public scope: string, public id: string) {}
    }

    @Value({
      from: (dbValue) => new ID3(dbValue.split("#")[3]),
    })
    class ID3 extends ID2 {
      constructor(id: string) {
        super("Bar", id);
      }
    }

    @Value({
      from: (dbValue, prevMapperResult) => {
        const instance = new ID4(dbValue.split("#")[3]);
        Object.setPrototypeOf(instance, prevMapperResult);
        prevMapperResult;
        return instance;
      },
    })
    class ID4 extends ID2 {
      constructor(id: string) {
        super("Baz", id);
      }
    }

    @Value()
    class ID5 extends ID4 {
      constructor() {
        super("Yoy");
      }
    }

    @Entity()
    class II12 {
      @Attr({ type: ID5 })
      private id = new ID5();

      @Attr("ownerId")
      private _ownerId: ID3;

      @Attr()
      private _childId: ID4;

      constructor(id1: string, id2: string) {
        this._ownerId = new ID3(id1);
        this._childId = new ID4(id2);
      }

      get ownerId(): ID3 {
        return this._ownerId;
      }

      get childId(): ID4 {
        return this._childId;
      }
    }

    it("should map entity Id properties to DB attributes", () => {
      const entity = new II12("a", "b");

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("[1] dbValue");

      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("[1] dtoValue");

      const rehydratedEntityFromDb = DataMapper.fromDb<II12>(dbValue);
      expect(rehydratedEntityFromDb).toBeInstanceOf(II12);
      expect(rehydratedEntityFromDb).toMatchSnapshot("[2] rehydratedEntityFromDb");
      expect((rehydratedEntityFromDb as any)._ownerId).toBe(rehydratedEntityFromDb.ownerId);
      expect(rehydratedEntityFromDb.ownerId).toBeInstanceOf(ID2);
      expect(rehydratedEntityFromDb.ownerId).toBeInstanceOf(ID3);
      expect((rehydratedEntityFromDb as any)._childId).toBe(rehydratedEntityFromDb.childId);
      expect(rehydratedEntityFromDb.childId).toBeInstanceOf(ID2);
      expect(rehydratedEntityFromDb.childId).toBeInstanceOf(ID4);
      expect((rehydratedEntityFromDb as any).id).toBeInstanceOf(ID2);
      expect((rehydratedEntityFromDb as any).id).toBeInstanceOf(ID4);
      expect((rehydratedEntityFromDb as any).id).toBeInstanceOf(ID5);

      const rehydratedEntityFromDto = DataMapper.fromDto<II12>(dtoValue);
      expect(rehydratedEntityFromDto).toBeInstanceOf(II12);
      expect(rehydratedEntityFromDto).toMatchSnapshot("[2] rehydratedEntityFromDto");
      expect((rehydratedEntityFromDto as any)._ownerId).toBe(rehydratedEntityFromDto.ownerId);
      expect(rehydratedEntityFromDto.ownerId).toBeInstanceOf(ID2);
      expect(rehydratedEntityFromDto.ownerId).toBeInstanceOf(ID3);
      expect((rehydratedEntityFromDto as any)._childId).toBe(rehydratedEntityFromDto.childId);
      expect(rehydratedEntityFromDto.childId).toBeInstanceOf(ID2);
      expect(rehydratedEntityFromDto.childId).toBeInstanceOf(ID4);
      expect((rehydratedEntityFromDto as any).id).toBeInstanceOf(ID2);
      expect((rehydratedEntityFromDto as any).id).toBeInstanceOf(ID4);
      expect((rehydratedEntityFromDto as any).id).toBeInstanceOf(ID5);
    });
  });

  describe("Context & Custom mappers", () => {
    const calls: any[] = [];
    const recordCall = (fn: string, src: any, tgt: any, ctx: any) => {
      calls.push([
        fn,
        JSON.parse(JSON.stringify(src)),
        JSON.parse(JSON.stringify(tgt)),
        { level: ctx.level, path: ctx.getPath(), target: ctx.target, source: ctx.source },
      ]);
    };

    @Entity({
      to: (src, tgt, ctx) => {
        recordCall("C1 (to)", src, tgt, ctx);
        tgt.Id = src.id;
        return tgt;
      },
      from: (src, tgt, ctx) => {
        recordCall("C1 (from)", src, tgt, ctx);
        tgt.id = src.Id;
        return tgt;
      },
    })
    class C1 {
      id: string = "1";
      @Attr({
        to: (src, tgt, ctx) => {
          recordCall("C1.name (to)", src, tgt, ctx);
          if (ctx.level === 0 && ctx.target === "DB") {
            tgt.name_$type = "String";
            tgt.name = { S: src.name };
          } else {
            tgt.name = src.name;
          }
          return tgt;
        },
        from: (src, tgt, ctx) => {
          recordCall("C1.name (from)", src, tgt, ctx);
          if (ctx.level === 0 && ctx.source === "DB") {
            tgt.name = src.name.S + `(${src.name_$type})`;
          } else {
            tgt.name = src.name;
          }
          return tgt;
        },
      })
      name: string = "foo";
    }

    @Entity({
      to: (src, tgt, ctx) => {
        recordCall("C2 (to)", src, tgt, ctx);
        return tgt;
      },
      from: (src, tgt, ctx) => {
        recordCall("C2 (from)", src, tgt, ctx);
        return tgt;
      },
    })
    class C2 {
      @Attr({ type: C1 })
      child: C1 = new C1();

      constructor(
        @AttrFromParam<C2>({
          to: (src, tgt, ctx) => {
            recordCall("C2.id (to)", src, tgt, ctx);
            if (ctx.level === 1 && ctx.target === "DB") {
              tgt.id = { S: src.id };
            } else {
              tgt.id = src.id;
            }
            return tgt;
          },
          from: (src, tgt, ctx) => {
            recordCall("C2.id (from)", src, tgt, ctx);
            if (ctx.level === 1 && ctx.source === "DB") {
              tgt.id = src.id.S;
            } else {
              tgt.id = src.id;
            }
            return tgt;
          },
        })
        public id: string = "2"
      ) {}
    }

    @Entity({
      to: (src, tgt, ctx) => {
        recordCall("C3 (to)", src, tgt, ctx);
        return tgt;
      },
      from: (src, tgt, ctx) => {
        recordCall("C3 (from)", src, tgt, ctx);
        return tgt;
      },
    })
    class C3 {
      @Attr()
      id: string = "3";

      @Attr({ type: C2 })
      child1: C2 = new C2();

      @Attr()
      child2: C1 = new C1();
    }

    it("should map C3, calling mappers in the right order and providing the right level in the context", () => {
      const entity = new C3();

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("toDb called: dbValue");
      expect(calls).toMatchSnapshot("toDb called: calls");
      calls.splice(0);

      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("toDto called: dtoValue");
      expect(calls).toMatchSnapshot("toDto called: calls");
      calls.splice(0);

      const rehydratedEntityFromDb = DataMapper.fromDb<C3>(dbValue);
      expect(rehydratedEntityFromDb).toMatchSnapshot("fromDb called: rehydratedEntityFromDb");
      expect(rehydratedEntityFromDb).toBeInstanceOf(C3);
      expect(rehydratedEntityFromDb.child1).toBeInstanceOf(C2);
      expect(rehydratedEntityFromDb.child1.child).toBeInstanceOf(C1);
      expect(rehydratedEntityFromDb.child2).toBeInstanceOf(C1);
      expect(calls).toMatchSnapshot("fromDb called: calls");
      calls.splice(0);

      const rehydratedEntityFromDto = DataMapper.fromDto<C3>(dtoValue);
      expect(rehydratedEntityFromDto).toMatchSnapshot("fromDto called: rehydratedEntityFromDto");
      expect(rehydratedEntityFromDto).toBeInstanceOf(C3);
      expect(rehydratedEntityFromDto.child1).toBeInstanceOf(C2);
      expect(rehydratedEntityFromDto.child1.child).toBeInstanceOf(C1);
      expect(rehydratedEntityFromDto.child2).toBeInstanceOf(C1);
      expect(calls).toMatchSnapshot("fromDto called: calls");
      calls.splice(0);
    });

    it("should map C2, calling mappers in the right order and providing the right level in the context", () => {
      const entity = new C2();

      const dbValue = DataMapper.toDb(entity);
      expect(dbValue).toMatchSnapshot("toDb called: dbValue");
      expect(calls).toMatchSnapshot("toDb called: calls");
      calls.splice(0);

      const dtoValue = DataMapper.toDto(entity);
      expect(dtoValue).toMatchSnapshot("toDto called: dtoValue");
      expect(calls).toMatchSnapshot("toDto called: calls");
      calls.splice(0);

      const rehydratedEntityFromDb = DataMapper.fromDb<C2>(dbValue);
      expect(rehydratedEntityFromDb).toMatchSnapshot("fromDb called: rehydratedEntityFromDb");
      expect(rehydratedEntityFromDb).toBeInstanceOf(C2);
      expect(rehydratedEntityFromDb.child).toBeInstanceOf(C1);
      expect(calls).toMatchSnapshot("fromDb called: calls");
      calls.splice(0);

      const rehydratedEntityFromDto = DataMapper.fromDto<C2>(dtoValue);
      expect(rehydratedEntityFromDto).toMatchSnapshot("fromDto called: rehydratedEntityFromDto");
      expect(rehydratedEntityFromDto).toBeInstanceOf(C2);
      expect(rehydratedEntityFromDto.child).toBeInstanceOf(C1);
      expect(calls).toMatchSnapshot("fromDto called: calls");
      calls.splice(0);
    });
  });
});
