import { RemarkProject } from 'src/entities/remark-project.entity';

export const RemarkProjectResource = (remarkProject: RemarkProject): any => {
  return {
    id: remarkProject.id,
    name: remarkProject.name,
  };
};
