import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from '../src/modules/project/project.module';
import { Project } from '../src/modules/project/entities/project.entity';

describe('Project E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Project],
          synchronize: true,
        }),
        ProjectModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/projects (POST) 创建项目', () => {
    return request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'TestProj' })
      .expect(201)
      .then(res => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('TestProj');
      });
  });

  it('/projects (GET) 获取项目列表', () => {
    return request(app.getHttpServer())
      .get('/projects')
      .expect(200)
      .then(res => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });
});

