/* eslint-disable prettier/prettier */

import { Topic } from "src/entities/topic.entity";

export const TopicResource = (topic: Topic): any => {
  return {
    id: topic.id,
    name: topic.name,
  };
};
