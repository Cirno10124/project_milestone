import http from '../utils/http';
import md5 from '../utils/md5';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
}

export function login(dto: LoginDto) {
  return http.post('/auth/login', {
    username: dto.username,
    password: md5(dto.password),
  });
}

export function register(dto: RegisterDto) {
  return http.post('/auth/register', {
    username: dto.username,
    password: md5(dto.password),
  });
}

export function getProfile() {
  return http.get('/auth/me');
}
