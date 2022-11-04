import { PKASNProgram } from 'src/entities/pkasn-program.entity';

export const PKASNProgramResource = (pkasn_program: PKASNProgram): any => {
  if (pkasn_program) {
    return {
      id: pkasn_program.id,
      name: pkasn_program.name,
    };
  }

  return null;
};
