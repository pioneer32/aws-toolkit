import { Attr, Entity, Utils } from "../src";

class Foo {
  @Attr()
  name: string = "I am an inlined entity";
}

@Entity()
class Bar {}

@Entity()
class Baz extends Foo {}

class FooBar {}

describe("Utils", () => {
  test("getTypeMark returns correct values for classes", () => {
    expect(Utils.getTypeMark(Foo)).toBe("Foo@1");
    expect(Utils.getTypeMark(Bar)).toBe("Bar@1");
    expect(Utils.getTypeMark(Baz)).toBe("Baz@1");
  });

  test("getTypeMark returns correct values for class instances", () => {
    expect(Utils.getTypeMark(new Foo())).toBe("Foo@1");
    expect(Utils.getTypeMark(new Bar())).toBe("Bar@1");
    expect(Utils.getTypeMark(new Baz())).toBe("Baz@1");
  });

  test("getTypeMark throws", () => {
    expect(() => Utils.getTypeMark(null)).toThrowError("DM016: No type-mark can be created for an empty entity or entity class.");

    expect(() => Utils.getTypeMark({ foo: 1 })).toThrowError(
      'DM018: No entity configuration was found for classname "Object". Please make sure the entity class is property annotated. If the classname looks obfuscated, please refer to the documentation'
    );

    expect(() => Utils.getTypeMark("foo")).toThrowError(
      'DM018: No entity configuration was found for classname "String". Please make sure the entity class is property annotated. If the classname looks obfuscated, please refer to the documentation'
    );

    expect(() => Utils.getTypeMark(FooBar)).toThrowError(
      'DM018: No entity configuration was found for classname "FooBar". Please make sure the entity class is property annotated. If the classname looks obfuscated, please refer to the documentation'
    );

    expect(() => Utils.getTypeMark(new FooBar())).toThrowError(
      'DM018: No entity configuration was found for classname "FooBar". Please make sure the entity class is property annotated. If the classname looks obfuscated, please refer to the documentation'
    );

    expect(() => Utils.getTypeMark(function Func() {})).toThrowError(
      'DM018: No entity configuration was found for classname "Func". Please make sure the entity class is property annotated. If the classname looks obfuscated, please refer to the documentation'
    );
  });
});
