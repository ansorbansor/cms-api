export interface MailData<T = never> {
  to: string;
  data: T;
}
export interface SocialInterface {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}
export interface FacebookInterface {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}
