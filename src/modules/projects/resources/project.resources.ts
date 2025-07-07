import { Project } from 'src/entities/project.entity';

export const ProjectResource = (project: Project): any => {
  return {
    id: project.id,
    name: project.name,
    code: project.code,
  };
};
