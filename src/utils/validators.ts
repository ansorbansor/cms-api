import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { FindOperator, getRepository, ILike } from 'typeorm';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';

type ValidationNotExistsEntity =
  | {
      id?: number | string;
      name?: string;
    }
  | undefined;

@ValidatorConstraint({ name: 'IsExist', async: true })
export class IsExist implements ValidatorConstraintInterface {
  async validate(value: string, validationArguments: ValidationArguments) {
    const repository = validationArguments.constraints[0];
    const pathToProperty = validationArguments.constraints[1];
    const entity = await getRepository(repository).findOne({
      [pathToProperty ? pathToProperty : validationArguments.property]: value?.[
        pathToProperty
      ]
        ? value?.[pathToProperty]
        : value,
    });

    return Boolean(entity);
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

    if (currentValue.name) {
      where = {
        [validationArguments.property]: ILike(`%${value}%`),
      };
    }
    const entity = (await getRepository(repository).findOne(
      where,
    )) as ValidationNotExistsEntity;

    if (
      (currentValue.name &&
        currentValue.id &&
        entity?.id == currentValue?.id &&
        entity?.name.toLowerCase() === currentValue?.name.toLowerCase()) ||
      !entity
    ) {
      return true;
    } else if (entity?.id === currentValue?.id) {
      return true;
    }

    return false;
  }
}
