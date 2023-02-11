import { configureAttribute, configureAttributeWithCustomMapper, configureCollectionAttribute, configureDictionaryAttribute, configureEntity, configureValue } from './configs';
import { EntityMapperConfig, ValueMapperConfig } from './types';

// TODO: Support Sets and Objects
// TODO: Add a way to map "inlined" entities when the parent entity is annotated with @Mapping (to and from)

function toValidPropertyName(propertyName: any, fullPropertyName: string, suggestion: string): string {
  if (typeof propertyName === 'symbol' || !propertyName) {
    throw new Error(`Could not determine property name for ${fullPropertyName}.\nPlease set it explicitly via ${suggestion}`);
  }
  return propertyName as string;
}

function toValidDbName(dbName: any, fullPropertyName: string, suggestion: string): string {
  if (typeof dbName === 'symbol' || !dbName) {
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
  if (typeof type === 'object' && type !== null) {
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

export function Dictionary(valueType: any): PropertyDecorator;
export function Dictionary(dbName: string, valueType: any): PropertyDecorator;
export function Dictionary(valueTypeOrDbName: any, valueType?: any): PropertyDecorator {
  return function (target, propertyKey) {
    const type = Reflect.getMetadata('design:type', target, propertyKey);
    const propertyName = toValidPropertyName(propertyKey, target.constructor.name, '@Dictionary({propertyName:"propertyName"}) [TODO]');
    const dbName = toValidDbName(valueTypeOrDbName && valueType ? valueTypeOrDbName : propertyName, `${target.constructor.name}.${propertyName}`, 'either @Dictionary("name") or @Dictionary({name:"name"}) [TODO]');

    // Yep. The type may not have been determined properly... but we don't care about that here, it will definitely fail
    if (type === String || type === Number || type === Boolean || type === Array || type == Set) {
      throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\n@Dictionary should only be used with Map`);
    }

    configureDictionaryAttribute(target.constructor, propertyName, dbName, valueType || valueTypeOrDbName);
  };
}

export function DictionaryFromParam(valueType: any): ParameterDecorator;
export function DictionaryFromParam(valueTypeOrDbName: string, valueType: any): ParameterDecorator;
export function DictionaryFromParam(valueTypeOrDbName: string, valueType?: any): ParameterDecorator {
  return (target: any, propertyKey, parameterIndex) => {
    const paramName = target
      .toString()
      .match(/constructor\s*\(\s*([^)]+)\s*\)/)?.[1]
      .split(/\s*,\s*/)
      [parameterIndex].split(/\s*=/)[0];

    const type = Reflect.getMetadata('design:paramtypes', target, propertyKey)[parameterIndex];
    const propertyName = toValidPropertyName(paramName, target.name, '@DictionaryFromParam("dbAttributeName", "propertyName")');
    const dbName = toValidDbName(valueType && valueTypeOrDbName ? valueTypeOrDbName : propertyName, `${target.name}.${propertyName}`, '@DictionaryFromParam("name")');

    // Yep. The type may not have been determined properly... but we don't care about that here, it will definitely fail
    if (type === String || type === Number || type === Boolean || type === Array || type == Set) {
      throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\n@DictionaryFromParam should only be used with Map`);
    }

    configureDictionaryAttribute(target, propertyName, dbName, valueType || valueTypeOrDbName);
  };
}

export function Collection(elementType: any): PropertyDecorator;
export function Collection(dbName: string, elementType: any): PropertyDecorator;
export function Collection(elementTypeOrDbName: any, elementType?: any): PropertyDecorator {
  return function (target, propertyKey) {
    const type = Reflect.getMetadata('design:type', target, propertyKey);
    const propertyName = toValidPropertyName(propertyKey, target.constructor.name, '@Collection({propertyName:"propertyName"})');
    const dbName = toValidDbName(elementTypeOrDbName && elementType ? elementTypeOrDbName : propertyName, `${target.constructor.name}.${propertyName}`, '@Collection({propertyName:"propertyName"}) [TODO]');

    // Yep. The type may not have been determined properly... but we don't care about that here, it will definitely fail
    if (type === String || type === Number || type === Boolean || type === Map) {
      throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\n@Collection should only be used with Array only`);
    }

    configureCollectionAttribute(target.constructor, propertyName, dbName, elementType || elementTypeOrDbName);
  };
}

export function CollectionFromParam(elementType: any): ParameterDecorator;
export function CollectionFromParam(dbName: string, elementType: any): ParameterDecorator;
export function CollectionFromParam(elementTypeOrDbName: string, elementType?: any): ParameterDecorator {
  return (target: any, propertyKey, parameterIndex) => {
    const paramName = target
      .toString()
      .match(/constructor\s*\(\s*([^)]+)\s*\)/)?.[1]
      .split(/\s*,\s*/)
      [parameterIndex].split(/\s*=/)[0];

    const propertyName = toValidPropertyName(paramName, target.name, '@AttributeFromParam("dbAttributeName", "propertyName")');
    const type = Reflect.getMetadata('design:paramtypes', target, propertyKey)[parameterIndex];
    const dbName = toValidDbName(elementType && elementTypeOrDbName ? elementTypeOrDbName : propertyName, `${target.name}.${propertyName}`, '@AttributeFromParam("name")');

    // Yep. The type may not have been determined properly... but we don't care about that here, it will definitely fail
    if (type === String || type === Number || type === Boolean || type === Map) {
      throw new Error(`Unsupported property type for ${target.name}.${propertyName}.\n@CollectionFromParam should only be used with Array only`);
    }

    configureCollectionAttribute(target, propertyName!, dbName, elementType || elementTypeOrDbName);
  };
}

type AttributeConfig = {
  name?: string;
  type?: any;
};

const isCustomMapper = (val: any): val is ValueMapperConfig => !!((val as ValueMapperConfig | undefined)?.to && (val as ValueMapperConfig | undefined)?.from);

export function Attribute(): PropertyDecorator;
export function Attribute(name: string): PropertyDecorator;
export function Attribute(config: AttributeConfig): PropertyDecorator;
export function Attribute(mapper: ValueMapperConfig): PropertyDecorator;
export function Attribute(nameOrMapperOrConfig?: string | AttributeConfig | ValueMapperConfig): PropertyDecorator {
  return function (target, propertyKey) {
    if (isCustomMapper(nameOrMapperOrConfig)) {
      configureAttributeWithCustomMapper(target.constructor, nameOrMapperOrConfig as ValueMapperConfig);
      return;
    }
    const type = (typeof nameOrMapperOrConfig !== 'string' ? nameOrMapperOrConfig?.type : undefined) || Reflect.getMetadata('design:type', target, propertyKey);
    const propertyName = toValidPropertyName(propertyKey, target.constructor.name, '@Attribute({propertyName:"propertyName"})');
    const dbName = toValidDbName(
      typeof nameOrMapperOrConfig === 'string' ? nameOrMapperOrConfig : nameOrMapperOrConfig?.name || propertyName,
      `${target.constructor.name}.${propertyName}`,
      'either @Attribute("name") or @Attribute({name:"name"})'
    );

    assertTypeIsSupported(type, `${target.constructor.name}.${propertyName}`, `@Attribute`, `@Attribute({type:Type})`);

    if (type === Array || type === Set) {
      throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\nPlease consider using @Collection for Array and Set instead`);
    }

    if (type === Map) {
      throw new Error(`Unsupported property type for ${target.constructor.name}.${propertyName}.\nPlease consider using @Dictionary for Map`);
    }

    configureAttribute(target.constructor, propertyName, dbName, type);
  };
}

export function AttributeFromParam(): ParameterDecorator;
export function AttributeFromParam(name: string): ParameterDecorator;
export function AttributeFromParam(config: AttributeConfig): ParameterDecorator;
export function AttributeFromParam(mapper: ValueMapperConfig): ParameterDecorator;
export function AttributeFromParam(nameOrMapperOrConfig?: string | AttributeConfig | ValueMapperConfig): ParameterDecorator {
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

    const propertyName = toValidPropertyName(paramName, target.name, '@AttributeFromParam({propertyName:"propertyName"})');
    const type = (typeof nameOrMapperOrConfig !== 'string' ? nameOrMapperOrConfig?.type : undefined) || Reflect.getMetadata('design:paramtypes', target, propertyKey)[parameterIndex];
    const dbName = toValidDbName(
      typeof nameOrMapperOrConfig === 'string' ? nameOrMapperOrConfig : nameOrMapperOrConfig?.name || propertyName,
      `${target.constructor.name}.${propertyName}`,
      'either @AttributeFromParam("name") or @AttributeFromParam({name:"name"})'
    );

    assertTypeIsSupported(type, `${target.name}.${propertyName}`, `@AttributeFromParam`, `@AttributeFromParam({type:Type})`);

    if (type === Array || type === Set) {
      throw new Error(`Unsupported property type for ${target.name}.${propertyName}.\nPlease consider using @CollectionFromParam for Array and Set instead`);
    }

    if (type === Map) {
      throw new Error(`Unsupported property type for ${target.name}.${propertyName}.\nPlease consider using @DictionaryFromParam for Map`);
    }

    configureAttribute(target, propertyName, dbName, type);
  };
}

export function Entity(): ClassDecorator;
export function Entity(mapper: EntityMapperConfig): ClassDecorator;
export function Entity(mapper?: EntityMapperConfig): ClassDecorator {
  return function (target) {
    configureEntity(target, (mapper || {}) as EntityMapperConfig);
  };
}

export function Value(): ClassDecorator;
export function Value(config: Partial<ValueMapperConfig>): ClassDecorator;
export function Value(config?: Partial<ValueMapperConfig>): ClassDecorator {
  return function (target) {
    configureValue(target, (config || {}) as Partial<ValueMapperConfig>);
  };
}
