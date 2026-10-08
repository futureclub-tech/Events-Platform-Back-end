export const TYPES = {
  // Repositories
  UserRepository: Symbol.for('UserRepository'),

  // Services
  AuthService: Symbol.for('AuthService'),
  AuthTokenService: Symbol.for('AuthTokenService'),
  OtpService: Symbol.for('OtpService'),
  UnitOfWork: Symbol.for('UnitOfWork'),

  // Controllers
  AuthController: Symbol.for('AuthController'),
} as const;
