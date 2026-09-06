export type ActiveScreen = 'register' | 'login' | 'mfa';

export type RegisterScenario = 'valid' | 'conflict' | 'bad_request' | 'mismatch';

export type LoginScenario = 'default' | 'credentials' | 'expired' | 'locked';

export type RegisterApiTab = 'req' | 'res' | 'matrix';

export type LoginSpecTab = 'schema' | 'res-401' | 'res-token';

export interface PasswordEntropy {
  hasLength: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  score: number; // 0-4
  label: string;
}
