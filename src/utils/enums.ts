export enum AuthProvidersEnum {
  email = 'email',
  facebook = 'facebook',
  google = 'google',
  twitter = 'twitter',
  apple = 'apple',
}

export enum RoleEnum {
  'superadmin' = 1,
  'user' = 2,
}

export enum FileTypeEnum {
  image = 0,
  document = 1,
  video = 2,
  audio = 3,
}

export enum RedisKeyEnum {
  user = 'User',
  category = 'Category',
  provider = 'Provider',
  topic = 'Topic',
  language = 'CourseLanguage',
  course = 'Course',
  level = 'CourseLevel',
  price = 'CoursePrice',
  banner = 'Banner',
  duration = 'Duration',
}

export enum MaxFileSize {
  IMAGE = 2000,
  AUDIO = 3000,
  VIDEO = 200000,
  DOCUMENT = 1500,
  JSON = 200,
}

export enum BannerType {
  COURSE = '0',
  ANNOUNCEMENT = '1',
  EXTERNAL_URL = '2',
}

export enum Rating {
  A = '1',
  B = '2',
  C = '3',
  D = '4',
  E = '5',
}

export enum MenuPermission {
  CREATE = 0,
  READ = 1,
  UPDATE = 2,
  DELETE = 3,
}

export enum CouponType {
  GENERAL = 0,
  SPECIFIC = 1,
}

export enum CouponStatus {
  AVAILABLE = 0,
  USED = 1,
  NOT_AVAILABLE = 2,
}

export enum CouponSubmissionStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export enum CourseUserStatus {
  REDIRECT = 1,
  PENDING_VOUCHER = 0,
  REJECTED_VOUCHER = 2,
}

export enum MailSubject {
  FORGOT_PASSWORD = 'Setneg Playbook - Lupa Password',
  APPROVED_COUPON_SUBMISSION = 'Setneg Playbook - Pengajuan Kupon Disetujui',
  REJECTED_COUPON_SUBMISSION = 'Setneg Playbook - Pengajuan Kupon Ditolak',
  WELCOME = 'Setneg Playbook - Selamat Datang di Playbook',
  REGISTER_PROVIDER = 'Setneg Playbook - Register',
}

export enum CoursePriceType {
  FREE = 1,
  PAID = 2,
  FREEMIUM = 3,
}

export enum SocialMediaUrl {
  FACEBOOK = 'https://www.facebook.com/ppkasn.setneg',
  TWITTER = 'https://twitter.com/ppkasn_setneg',
  INSTAGRAM = 'https://www.instagram.com/ppkasn.kemensetneg',
  WHATSAPP = 'https://wa.me/082110002114',
}

export enum CourseScheduleType {
  TERJADWAL = 2,
  MANDIRI = 1,
}
