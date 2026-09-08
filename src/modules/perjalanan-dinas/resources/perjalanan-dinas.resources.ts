import { PerjalananDinas } from 'src/entities/perjalanan-dinas.entity';
import { User } from 'src/entities/user.entity';

export const PerjalananDinasResource = (pd: PerjalananDinas): any => {
  return {
    id: pd.id,
    destination_city: pd.destination_city,
    start_date: pd.start_date,
    end_date: pd.end_date,
    purpose: pd.purpose,
    status: pd.status,
    user_id: pd.user_id,
    user: pd.user ? {
      id: pd.user.id,
      name: pd.user.name,
      nik: pd.user.nik,
    } : null,
    project_name: pd.project_name,
    attachment_id: pd.attachment_id,
    attachment: pd.attachment ? {
      id: pd.attachment.id,
      path: pd.attachment.path,
    } : null,
    created_at: pd.created_at,
    updated_at: pd.updated_at,
  };
};
