export enum AuthProvidersEnum {
  email = 'email',
  facebook = 'facebook',
  google = 'google',
  twitter = 'twitter',
  apple = 'apple',
  ldap = 'ldap',
}

export enum RoleEnum {
  SUPERADMIN = 'superadmin',
  USER = 'user',
  PM = 'pm',
  QC = 'qc',
  ENGINEER = 'engineer',
  TL = 'tl',
  MEMBER = 'member',
  DC = 'dc',
  SS = 'ss',
  RPM = 'rpm',
  ADMINPAYMENT = 'adminpayment',
  VERIFICATOR = 'verificator',
}

export enum FileTypeEnum {
  image = 0,
  document = 1,
  video = 2,
  audio = 3,
}

export enum MaxFileSize {
  IMAGE = 2000,
  AUDIO = 3000,
  VIDEO = 200000,
  DOCUMENT = 1500,
  JSON = 200,
}

export enum MenuPermission {
  SPK_CREATE = 'spk_create',
  SPK_KM_RANGE = 'spk_km_range',
  SPK_CI_CO = 'spk_ci_co',
  SPK_KASBON_SETTLEMENT = 'spk_kasbon_settlement',
  SPK_KASBON_SETTLEMENT_CLOSE = 'spk_kasbon_settlement_close',
  SPK_COST_EVIDENCE = 'spk_cost_evidence',
  SPK_OVER_BUDGET = 'spk_over_budget',
  USER_CREATE = 'user_create',
  PO_CREATE = 'po_create',
}

export enum FilePath {
  USER = 'users',
  SPK_SITE_DISTANCE = 'spk/site-distance',
  SPK_KM_RANGE_START = 'spk/km-range-start',
  SPK_KM_RANGE_END = 'spk/km-range-end',
  SPK_CHECK_IN = 'spk/check-in',
  SPK_CHECK_OUT = 'spk/check-out',
  SPK_COST_EVIDENCE = 'spk/cost-evidence',
  SPK_TRANSFER_PROOF = 'spk/transfer-proof',
  OTHER = 'others',
}

export enum ErrorMessage {
  EMAIL_NOT_EXISTS = 'User tidak ditemukan. Silahkan coba pilih kembali Akun yang telah tervalidasi.',
  PASSWORD_WRONG = 'Maaf, password yang anda masukkan tidak sesuai. Silahkan coba masukkan kembali password anda.',
  USER_NOT_FOUND = 'User tidak ditemukan. Silahkan coba kembali menggunakan email dan password yang telah terdaftar.',
  FORBIDDEN = 'User tidak memiliki hak untuk mengakses halaman ini.',
  UNAUTHORIZED = 'Session anda telah habis, silahkan login kembali.',
  GENERAL = 'Terjadi kesalahan pada server, silahkan coba beberapa saat kembali atau hubungi admin',
  TWO_FACTOR_AUTH_FAILED = 'Kode 2FA salah, silahkan coba kembali',
  PARTNER_NOT_EXISTS = 'Client ID atau Client Secret tidak sesuai.',
  DATA_NOT_FOUND = 'Data tidak ditemukan.',
  DATA_TYPE_NOT_EXPECTED = 'Parameter tidak sesuai!',
}

export enum SPKStatus {
  CREATED = 0,
  CREATED_OVER_BUDGET = 1,
  APPROVED = 2,
  APPROVED_OVER_BUDGET = 3,
  PAID = 4,
  CLOSED = 5,
}
