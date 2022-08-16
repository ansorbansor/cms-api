export enum AuthProvidersEnum {
  email = 'email',
  facebook = 'facebook',
  google = 'google',
  twitter = 'twitter',
  apple = 'apple',
}

export enum RoleEnum {
  'admin' = 1,
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
  language = 'Language',
  course = 'Course',
  level = 'Level',
  price = 'Price',
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
