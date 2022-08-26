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
  image = 1,
  document = 2,
  video = 3,
  audio = 4,
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
}

export enum MaxFileSize {
  IMAGE = 200,
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
  REDIRECT = 0,
  PENDING_VOUCHER = 1,
  REJECTED_VOUCHER = 2,
}
