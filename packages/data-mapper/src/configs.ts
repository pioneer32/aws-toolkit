import {
  chainMapper,
  composeListMapper,
  composeEntityAttributeMapper,
  composeMapMapper,
  composeValueMapperForEntity,
  composeValueMapperForValue,
} from "./mapperComposers";
import { booleanValueMapper, numberValueMapper, stringValueMapper } from "./scalarMappers";
import { Class, EntityInternalConfig, EntityMapperConfig, Mapper, ValueInternalConfig, ValueMapperConfig } from "./types";

const entityConfigsByClassName = new Map<string, EntityInternalConfig>();
const valueConfigsByClassName = new Map<string, ValueInternalConfig>();
const collectionMappers = new WeakMap<any, Mapper<any, any>>();
const dictionaryMappers = new WeakMap<any, Mapper<any, any>>();
const valueMappers = new WeakMap<any, Mapper<any, any>>([
  [String, stringValueMapper],
  [Number, numberValueMapper],
  [Boolean, booleanValueMapper],
]);

export function findEntityConfigurationEntry(className: string): EntityInternalConfig | undefined {
  return entityConfigsByClassName.get(className);
}

function getOrComposeEntityConfigurationEntry(entityType: Class): EntityInternalConfig {
  const className = entityType.name;
  // TODO Validate className?
  let entry = findEntityConfigurationEntry(className);
  if (entry) {
    if (entry.class !== entityType) {
      throw new Error(`DD001: Two classes with the same name are found: ${entityType.name}`);
    }
    return entry;
  }
  const parent = Object.getPrototypeOf(entityType);
  entry = {
    ...(parent && parent.name && parent.name !== "Object" ? getOrComposeEntityConfigurationEntry(parent) : {}),
    class: entityType,
  } as EntityInternalConfig;
  entityConfigsByClassName.set(className, entry);
  valueMappers.set(entityType, composeValueMapperForEntity(entry));
  return entry;
}

function findValueConfigurationEntry(className: string): ValueInternalConfig | undefined {
  return valueConfigsByClassName.get(className)!;
}

function getValueConfigurationEntry(valueType: Class): ValueInternalConfig {
  const className = valueType.name;
  // TODO Validate className?
  let entry = findValueConfigurationEntry(className);
  if (entry) {
    if (entry.class !== valueType) {
      throw new Error(`DD002: Two classes with the same name are found: ${valueType.name}`);
    }
    return entry;
  }
  const parent = Object.getPrototypeOf(valueType);
  entry = { ...(parent && parent.name && parent.name !== "Object" ? getValueConfigurationEntry(parent) : {}), class: valueType } as ValueInternalConfig;
  valueConfigsByClassName.set(className, entry);
  valueMappers.set(valueType, composeValueMapperForValue(entry));
  return entry;
}

export function findValueMapper(valueType: Class): Mapper<any, any> | undefined {
  return valueMappers.get(valueType);
}

export function configureValue(entityType: Class, configEntry: Partial<ValueMapperConfig>) {
  const existingConfigEntry = getValueConfigurationEntry(entityType);
  if (configEntry.to || configEntry.from) {
    chainMapper(existingConfigEntry, configEntry);
  }
}

function getOrComposeListMapperInstance(elementType: Class): Mapper<any, any> {
  if (collectionMappers.has(elementType)) {
    return collectionMappers.get(elementType)!;
  }
  const valueMapper = findValueMapper(elementType);
  if (!valueMapper) {
    throw new Error(
      `DD003: No mapper is found for ${elementType.name ? elementType.name : elementType}. If it is an Entity or Value, please annotate it first`
    );
  }

  const mapper = composeListMapper(valueMapper);
  collectionMappers.set(elementType, mapper);
  return mapper;
}

export function getOrComposeDictionaryMapperInstance<E>(valueType: Class<E>): Mapper<Map<string, E> | null, any> {
  if (dictionaryMappers.has(valueType)) {
    return dictionaryMappers.get(valueType)!;
  }
  const mapper = composeMapMapper<E>(findValueMapper(valueType)!);
  dictionaryMappers.set(valueType, mapper);
  return mapper;
}

function assertInvariantsForEntityMet(_entityType: Class, _configEntry: EntityMapperConfig, _exitingConfigEntry: EntityInternalConfig) {
  // TODO: Ensure both to and from are provided
}

export function configureEntity(entityType: Class, configEntry: EntityMapperConfig) {
  const existingConfigEntry = getOrComposeEntityConfigurationEntry(entityType);
  assertInvariantsForEntityMet(entityType, configEntry, existingConfigEntry);
  if ((configEntry as any).to || (configEntry as any).from) {
    chainMapper(existingConfigEntry, configEntry);
  }
}

export function configureAttributeWithCustomMapper(entityType: Class, mapper: ValueMapperConfig) {
  const configEntry = getOrComposeEntityConfigurationEntry(entityType);
  chainMapper(configEntry, mapper);
}

export function configureAttributeWithValueMapper(entityType: Class, propertyName: string | Symbol, dbName: string, valueMapper: Mapper<any, any>) {
  const mapper = composeEntityAttributeMapper("" + propertyName, dbName, valueMapper);
  return configureAttributeWithCustomMapper(entityType, mapper);
}

export function configureAttribute(entityType: Class, propertyName: string | Symbol, dbName: string, type: Class) {
  const valueMapper = findValueMapper(type);
  if (!valueMapper) {
    throw new Error(`DD004: No mapper is found for ${type.name ? type.name : type}. If it is an Entity or Value, please annotate it first`);
  }
  return configureAttributeWithValueMapper(entityType, propertyName, dbName, valueMapper);
}

export function configureDictionaryAttribute(entityType: Class, propertyName: string | Symbol, dbName: string, valueType: Class) {
  let valueMapper = getOrComposeDictionaryMapperInstance(valueType);
  return configureAttributeWithValueMapper(entityType, propertyName, dbName, valueMapper);
}

export function configureAttrList(entityType: Class, propertyName: string | Symbol, dbName: string, elementType: Class) {
  let valueMapper = getOrComposeListMapperInstance(elementType);
  return configureAttributeWithValueMapper(entityType, propertyName, dbName, valueMapper);
}
