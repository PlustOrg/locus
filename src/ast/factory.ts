import { Entity, Field, FieldAttribute, FieldType, PrimitiveTypeCode, primitiveCodeOf } from './index';

export function createPrimitiveFieldType(name: FieldType['name'], optional?: boolean, nullable?: boolean): FieldType {
  return { kind: 'primitive', name, optional, nullable, code: primitiveCodeOf(name) as PrimitiveTypeCode };
}

export function createField(name: string, type: FieldType, attributes: FieldAttribute[] = []): Field {
  return { name, type, attributes };
}

export function createEntity(name: string, fields: Field[] = [], relations: any[] = []): Entity {
  return { name, fields, relations } as Entity;
}
