import {
  configureAttribute,
  configureAttributeWithCustomMapper,
  configureAttrList,
  configureAttrSet,
  configureAttrMap,
  configureEntity,
  configureValue,
} from "./configs";
import { ChainableMapper, EntityMapperConfig, ValueMapperConfig } from "./types";

// TODO: Support Objects
// TODO: Add a way to map "inlined" entities when the parent entity is annotated with @Mapping (to and from)

function toValidPropertyName(propertyName: any, fullPropertyName: string, suggestion: string): string {
  if (typeof propertyName === "symbol" || !propertyName) {
    throw new Error(`Could not determine property name for ${fullPropertyName}.\nPlease set it explicitly via ${suggestion}`);
  }
  return propertyName as string;
}

function toValidDbName(dbName: any, fullPropertyName: string, suggestion: string): string {
  if (typeof dbName === "symbol" || !dbName) {
    throw new Error(`Could not determine database attribute name for ${fullPropertyName}.\nPlease set it explicitly via ${suggestion}`);
  }
  return dbName as string;
}

function assertTypeIsSupported(type: any, fullPropertyName: string, decoratorName: string, suggestion: string): void {
  if (!type || type === Object) {
    throw new Error(
      `Unsupported property type for ${fullPropertyName}.\n` +
        `You probably used ${decoratorName} with one of types, for which Typescript emits limited metadata: nullable types, optional properties, interfaces, type aliases etc\n` +
        `For more details: https://github.com/microsoft/TypeScript/issues/27519#issuecomment-533767969.\n` +
        `Please set it explicitly via ${suggestion}`
    );
  }
  if (typeof type === "object" && type !== null) {
    const proto = Object.getPrototypeOf(type);
    if (proto === Object.prototype || proto === null) {
      throw new Error(
        `Unsupported property type for ${fullPropertyName}.\n` +
          `You probably used ${decoratorName} with an enum, for which Typescript didn't emit a real underlying type, e.g. Number or String\n` +
          `Please set it explicitly via ${suggestion}`
      );
    }
  }
}

type AttributeConfig = {
  name?: string;
  type?: any;
};

const isCustomMapper = (val: any): val is ValueMapperConfig => !!((val as ValueMapperConfig | undefined)?.to && (val as ValueMapperConfig | undefined)?.from);

export function Attr(): PropertyDecorator;
export function Attr(name: string): PropertyDecorator;
export function Attr(config: AttributeConfig): PropertyDecorator;
export function Attr(mapper: ValueMapperConfig): PropertyDecorator;
export function Attr(nameOrMapperOrConfig?: string | AttributeConfig | ValueMapperConfig): PropertyDecorator {
  return function (target, propertyKey) {
    if (isCustomMapper(nameOrMapperOrConfig)) {
      configureAttributeWithCustomMapper(target.constructor, nameOrMapperOrConfig as ValueMapperConfig);
      return;
    }
    const type = (typeof nameOrMapperOrConfig !== "string" ? nameOrMapperOrConfig?.type : undefined) || Reflect.getMetadata("design:type", target, propertyKey);
    const propertyName = toValidPropertyName(propertyKey, target.constructor.name, '@Attr({propertyName:"propertyName"})');
    const dbName = toValidDbName(
      typeof nameOrMapperOrConfig === "string" ? nameOrMapperOrConfig : nameOrMapperOrConfig?.name || propertyName,
      `${target.constructor.name}.${propertyName}`,
      'either @Attr("name") or @Attr({name:"name"})'
    );

    assertTypeIsSupported(type, `${target.constructor.name}.${propertyName}`, `@Attr`, `@Attr({type:Type})`);

    if (type === Array || type === Set) {
      throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\nPlease consider using @Collection for Array and Set instead`);
    }

    if (type === Map) {
      throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\nPlease consider using @Dictionary for Map`);
    }

    configureAttribute(target.constructor, propertyName, dbName, type);
  };
}

export namespace Attr {
  export function List(elementType: any): PropertyDecorator;
  export function List(dbName: string, elementType: any): PropertyDecorator;
  export function List(elementTypeOrDbName: any, elementType?: any): PropertyDecorator {
    return function (target, propertyKey) {
      const type = Reflect.getMetadata("design:type", target, propertyKey);
      const propertyName = toValidPropertyName(propertyKey, target.constructor.name, '@Attr.List({propertyName:"propertyName"})');
      const dbName = toValidDbName(
        elementTypeOrDbName && elementType ? elementTypeOrDbName : propertyName,
        `${target.constructor.name}.${propertyName}`,
        '@Attr.List({propertyName:"propertyName"}) [TODO]'
      );

      // Yep. The type may not have been determined properly... but we don't care about that here, it will definitely fail
      if (type === String || type === Number || type === Boolean || type === Map) {
        throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\n@Attr.List should only be used with Array only`);
      }

      configureAttrList(target.constructor, propertyName, dbName, elementType || elementTypeOrDbName);
    };
  }

  export function Set(elementType: any): PropertyDecorator;
  export function Set(dbName: string, elementType: any): PropertyDecorator;
  export function Set(elementTypeOrDbName: any, elementType?: any): PropertyDecorator {
    return function (target, propertyKey) {
      const type = Reflect.getMetadata("design:type", target, propertyKey);
      const propertyName = toValidPropertyName(propertyKey, target.constructor.name, '@Attr.Set({propertyName:"propertyName"})');
      const dbName = toValidDbName(
        elementTypeOrDbName && elementType ? elementTypeOrDbName : propertyName,
        `${target.constructor.name}.${propertyName}`,
        '@Attr.Set({propertyName:"propertyName"}) [TODO]'
      );

      // Yep. The type may not have been determined properly... but we don't care about that here, it will definitely fail
      if (type === String || type === Number || type === Boolean || type === Map) {
        throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\n@Attr.Set should only be used with Array only`);
      }

      configureAttrSet(target.constructor, propertyName, dbName, elementType || elementTypeOrDbName);
    };
  }

  export function Dictionary(valueType: any): PropertyDecorator;
  export function Dictionary(dbName: string, valueType: any): PropertyDecorator;
  export function Dictionary(valueTypeOrDbName: any, valueType?: any): PropertyDecorator {
    return function (target, propertyKey) {
      const type = Reflect.getMetadata("design:type", target, propertyKey);
      const propertyName = toValidPropertyName(propertyKey, target.constructor.name, '@Dictionary({propertyName:"propertyName"}) [TODO]');
      const dbName = toValidDbName(
        valueTypeOrDbName && valueType ? valueTypeOrDbName : propertyName,
        `${target.constructor.name}.${propertyName}`,
        'either @Dictionary("name") or @Dictionary({name:"name"}) [TODO]'
      );

      // Yep. The type may not have been determined properly... but we don't care about that here, it will definitely fail
      if (type === String || type === Number || type === Boolean || type === Array || type == Set) {
        throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\n@Dictionary should only be used with Map`);
      }

      configureAttrMap(target.constructor, propertyName, dbName, valueType || valueTypeOrDbName);
    };
  }
}

export function AttrFromParam(): ParameterDecorator;
export function AttrFromParam(name: string): ParameterDecorator;
export function AttrFromParam(config: AttributeConfig): ParameterDecorator;
export function AttrFromParam<INT = any, EXT = any>(mapper: ChainableMapper<INT, EXT>): ParameterDecorator;
export function AttrFromParam<INT = any, EXT = any>(nameOrMapperOrConfig?: string | AttributeConfig | ChainableMapper<INT, EXT>): ParameterDecorator {
  return (target: any, propertyKey, parameterIndex) => {
    if (isCustomMapper(nameOrMapperOrConfig)) {
      configureAttributeWithCustomMapper(target, nameOrMapperOrConfig as ValueMapperConfig);
      return;
    }
    const paramName = target
      .toString()
      .match(/constructor\s*\(\s*([^)]+)\s*\)/)?.[1]
      .split(/\s*,\s*/)
      [parameterIndex].split(/\s*=/)[0];

    const propertyName = toValidPropertyName(paramName, target.name, '@AttrFromParam({propertyName:"propertyName"})');
    const type =
      (typeof nameOrMapperOrConfig !== "string" ? (nameOrMapperOrConfig as AttributeConfig)?.type : undefined) ||
      Reflect.getMetadata("design:paramtypes", target, propertyKey)[parameterIndex];
    const dbName = toValidDbName(
      typeof nameOrMapperOrConfig === "string" ? nameOrMapperOrConfig : (nameOrMapperOrConfig as AttributeConfig)?.name || propertyName,
      `${target.constructor.name}.${propertyName}`,
      'either @AttrFromParam("name") or @AttrFromParam({name:"name"})'
    );

    assertTypeIsSupported(type, `${target.name}.${propertyName}`, `@AttrFromParam`, `@AttrFromParam({type:Type})`);

    if (type === Array) {
      throw new Error(`Unsupported property type for ${target.name}.${propertyName}.\nPlease consider using @AttrFromParam.List for Array and Set instead`);
    }

    if (type === Set) {
      throw new Error(`Unsupported property type for ${target.name}.${propertyName}.\nPlease consider using @AttrFromParam.Set for Array and Set instead`);
    }

    if (type === Map) {
      throw new Error(`Unsupported property type for ${target.name}.${propertyName}.\nPlease consider using @AttrFromParam.Map for Map`);
    }

    configureAttribute(target, propertyName, dbName, type);
  };
}

export namespace AttrFromParam {
  export function List(elementType: any): ParameterDecorator;
  export function List(dbName: string, elementType: any): ParameterDecorator;
  export function List(elementTypeOrDbName: string, elementType?: any): ParameterDecorator {
    return (target: any, propertyKey, parameterIndex) => {
      const paramName = target
        .toString()
        .match(/constructor\s*\(\s*([^)]+)\s*\)/)?.[1]
        .split(/\s*,\s*/)
        [parameterIndex].split(/\s*=/)[0];

      const propertyName = toValidPropertyName(paramName, target.name, '@AttrFromParam.List("dbAttributeName", "propertyName")');
      const type = Reflect.getMetadata("design:paramtypes", target, propertyKey)[parameterIndex];
      const dbName = toValidDbName(
        elementType && elementTypeOrDbName ? elementTypeOrDbName : propertyName,
        `${target.name}.${propertyName}`,
        '@AttrFromParam.List("name")'
      );

      // Yep. The type may not have been determined properly... but we don't care about that here, it will definitely fail
      if (type === String || type === Number || type === Boolean || type === Map) {
        throw new Error(`Unsupported property type for ${target.name}.${propertyName}.\n@AttrFromParam.List should only be used with Array only`);
      }

      configureAttrList(target, propertyName!, dbName, elementType || elementTypeOrDbName);
    };
  }

  export function Set(elementType: any): ParameterDecorator;
  export function Set(dbName: string, elementType: any): ParameterDecorator;
  export function Set(elementTypeOrDbName: string, elementType?: any): ParameterDecorator {
    return (target: any, propertyKey, parameterIndex) => {
      const paramName = target
        .toString()
        .match(/constructor\s*\(\s*([^)]+)\s*\)/)?.[1]
        .split(/\s*,\s*/)
        [parameterIndex].split(/\s*=/)[0];

      const propertyName = toValidPropertyName(paramName, target.name, '@AttrFromParam.Set("dbAttributeName", "propertyName")');
      const type = Reflect.getMetadata("design:paramtypes", target, propertyKey)[parameterIndex];
      const dbName = toValidDbName(
        elementType && elementTypeOrDbName ? elementTypeOrDbName : propertyName,
        `${target.name}.${propertyName}`,
        '@AttrFromParam.Set("name")'
      );

      // Yep. The type may not have been determined properly... but we don't care about that here, it will definitely fail
      if (type === String || type === Number || type === Boolean || type === Map) {
        throw new Error(`Unsupported property type for ${target.name}.${propertyName}.\n@AttrFromParam.Set should only be used with Set only`);
      }

      configureAttrSet(target, propertyName!, dbName, elementType || elementTypeOrDbName);
    };
  }

  export function Map(valueType: any): ParameterDecorator;
  export function Map(valueTypeOrDbName: string, valueType: any): ParameterDecorator;
  export function Map(valueTypeOrDbName: string, valueType?: any): ParameterDecorator {
    return (target: any, propertyKey, parameterIndex) => {
      const paramName = target
        .toString()
        .match(/constructor\s*\(\s*([^)]+)\s*\)/)?.[1]
        .split(/\s*,\s*/)
        [parameterIndex].split(/\s*=/)[0];

      const type = Reflect.getMetadata("design:paramtypes", target, propertyKey)[parameterIndex];
      const propertyName = toValidPropertyName(paramName, target.name, '@AttrFromParam.Map("dbAttributeName", "propertyName")');
      const dbName = toValidDbName(
        valueType && valueTypeOrDbName ? valueTypeOrDbName : propertyName,
        `${target.name}.${propertyName}`,
        '@AttrFromParam.Map("name")'
      );

      // Yep. The type may not have been determined properly... but we don't care about that here, it will definitely fail
      if (type === String || type === Number || type === Boolean || type === Array || type == Set) {
        throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\n@AttrFromParam.Map should only be used with Map`);
      }

      configureAttrMap(target, propertyName, dbName, valueType || valueTypeOrDbName);
    };
  }
}

export function Entity(): ClassDecorator;
export function Entity(mapper: EntityMapperConfig): ClassDecorator;
export function Entity(mapper?: EntityMapperConfig): ClassDecorator {
  return function (target) {
    configureEntity(target, (mapper || {}) as EntityMapperConfig);
  };
}

/**
 * @desc Used to decorate Value Objects. Mapping a value object into a db/dto value always results in a scalar value (and vice-versa)
 */
export function Value(): ClassDecorator;
export function Value(config: Partial<ValueMapperConfig>): ClassDecorator;
export function Value(config?: Partial<ValueMapperConfig>): ClassDecorator {
  return function (target) {
    configureValue(target, (config || {}) as Partial<ValueMapperConfig>);
  };
}
