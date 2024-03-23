import { findEntityConfigurationEntry } from "./configs";

const Utils = {
  /**
   * @desc Returns the value that is assigned to the mapped entity as $type, which is then used to determine what mapper to use to rehydrate it
   */
  getTypeMark(entityType: any) {
    if (!entityType) {
      throw new Error("DM016: No type-mark can be created for an empty entity or entity class.");
    }
    const $type =
      typeof entityType !== "function"
        ? // cool, assuming, an entity instance was passed in
          entityType.constructor.name
        : // assuming, this is an entity class
          entityType.name;

    if (!$type) {
      throw new Error("DM017: Cannot create a type-mark for an entity with empty constructor name.");
    }
    const config = findEntityConfigurationEntry($type);
    if (!config) {
      throw new Error(
        `DM018: No entity configuration was found for classname "${$type}". Please make sure the entity class is property annotated. If the classname looks obfuscated, please refer to the documentation`
      );
    }
    return `${config.class.name}@${config.version || 1}`;
  },
};

export default Utils;
