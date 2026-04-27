import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { FindOperator, getRepository, In } from 'typeorm';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';

type ValidationNotExistsEntity =
  | {
    id?: number | string;
    name?: string;
    code?: string;
    cc?: string;
  }
  | undefined;

@ValidatorConstraint({ name: 'IsExist', async: true })
export class IsExist implements ValidatorConstraintInterface {
  async validate(value: any, validationArguments: ValidationArguments) {
    const repository = validationArguments.constraints[0];
    const pathToProperty = validationArguments.constraints[1];

    if (Array.isArray(value)) {
      const entity = await getRepository(repository).find({
        [pathToProperty ? pathToProperty : validationArguments.property]: In(
          value?.[pathToProperty] ? value?.[pathToProperty] : value,
        ),
      });
      return Boolean(entity.length == value.length);
    } else {
      if (value != null && value != undefined && value != 'null') {
        const entity = await getRepository(repository).findOne({
          [pathToProperty ? pathToProperty : validationArguments.property]:
            value?.[pathToProperty] ? value?.[pathToProperty] : value,
        });
        return Boolean(entity);
      }

      return true;
    }
  }
}

@ValidatorConstraint({ name: 'IsNotExist', async: true })
export class IsNotExist implements ValidatorConstraintInterface {
  async validate(value: string, validationArguments: ValidationArguments) {
    const repository = validationArguments.constraints[0] as string;
    const currentValue =
      validationArguments.object as ValidationNotExistsEntity;
    let where: { [x: string]: string | FindOperator<string> } = {
      [validationArguments.property]: value,
    };

    if (currentValue.name || currentValue.code || currentValue.cc) {
      where = {
        [validationArguments.property]: value,
      };
    }
    const entity = (await getRepository(repository).findOne(
      where,
    )) as ValidationNotExistsEntity;

    console.log('[DEBUG IsNotExist]', {
      property: validationArguments.property,
      value,
      entityId: entity?.id,
      currentValueId: currentValue?.id,
      currentValueName: currentValue?.name,
      currentValueCode: currentValue?.code,
      currentValueCc: currentValue?.cc,
    });

    if (
      ((currentValue.name || currentValue.code || currentValue.cc) &&
        currentValue.id &&
        entity?.id == currentValue?.id &&
        ((entity?.name &&
          entity?.name.toLowerCase() === currentValue?.name.toLowerCase()) ||
          (entity?.code &&
            entity?.code.toLowerCase() === currentValue?.code.toLowerCase()) ||
          (entity?.cc &&
            entity?.cc.toLowerCase() === currentValue?.cc.toLowerCase()))) ||
      !entity
    ) {
      console.log('[DEBUG IsNotExist] Returns true from first block');
      return true;
    } else if (entity?.id === currentValue?.id) {
      console.log('[DEBUG IsNotExist] Returns true from else if');
      return true;
    }

    console.log('[DEBUG IsNotExist] Returns false!');
    return false;
  }
}

@ValidatorConstraint({ name: 'IsArrayValid', async: true })
export class IsArrayValid implements ValidatorConstraintInterface {
  async validate(value: any[], validationArguments: ValidationArguments) {
    const validArray = validationArguments.constraints;
    return value.every((r) => validArray.includes(r));
  }
}
