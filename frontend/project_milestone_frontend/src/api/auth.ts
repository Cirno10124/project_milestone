import http from '../utils/http';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  code: string;
}

export function login(dto: LoginDto) {
  return http.post('/auth/login', {
    username: dto.username,
    password: dto.password,
  });
}

export function register(dto: RegisterDto) {
  return http.post('/auth/register', {
    username: dto.username,
    email: dto.email,
    password: dto.password,
    code: dto.code,
  });
}

export function getProfile() {
  return http.get('/auth/me');
}

export function sendEmailCode(dto: { email: string; purpose: 'register' | 'reset_password' }) {
  return http.post('/auth/email/send-code', dto);
}
