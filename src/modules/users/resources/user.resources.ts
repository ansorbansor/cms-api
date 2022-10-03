/* eslint-disable prettier/prettier */

import minioConfig from "src/config/minio.config";
import { User } from "src/entities/user.entity";

export const UserResource = (user: User): any => {
  const mapRole = [];
  const mapUserTopic = [];

  user.userRoles != null ? user.userRoles.map((role) => {
    if (role.roleData) {
      mapRole.push({
        id: role.roleData ? role.roleData.id : null,
        name: role.roleData ? role.roleData.name: null
      });
    }
  }) : [];

  user.userTopic != null ? user.userTopic.map((category) => {
    if (!mapUserTopic.some((e) => e.category_id == category.category_id)) {
      const mapTopic = user.userTopic.filter(
        (topic) => topic.category_id == category.category_id,
      );

      if(category.category){
        mapUserTopic.push({
          category_id: category.category.id ? category.category.id : null,
          category_name: category.category.name ? category.category.name : null,
          topics: mapTopic.map((topic) => {
            return {
              topic_id: topic.topic && topic.topic.id ? topic.topic.id : null,
              topic_name: topic.topic && topic.topic.name ? topic.topic.name : null,
            };
          }),
        });
      }
    }
  }) : [];

  return {
    id: user.id,
    nip: user.nip,
    name: user.name,
    email: user.email,
    provider: user.provider,
    status: user.status,
    notification_token: user.notification_token,
    photo: user.photoFile ? minioConfig().fullUrl + user.photoFile.path : null,
    roles: mapRole,
    course_level: user.course_level,
    blacklist: user.blacklist,
    unit: {
      id: user.employeeUnit ? user.employeeUnit.id : null,
      name: user.employeeUnit ? user.employeeUnit.name : null
    },
    level: {
      id: user.employeeLevel ? user.employeeLevel.id : null,
      name: user.employeeLevel ? user.employeeLevel.name : null
    },
    position: {
      id: user.employeePosition ? user.employeePosition.id : null,
      name: user.employeePosition ? user.employeePosition.name : null
    },
    lesson_hour: user.total_lesson_hours,
    total_lesson: user.total_lesson,
    user_categories: mapUserTopic,
    user_level: user.level ? user.level : 0,
  };
};
