import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from '../src/modules/project/project.module';
import { ScoreModule } from '../src/modules/score/score.module';
import { Project } from '../src/modules/project/entities/project.entity';
import { Score } from '../src/modules/score/entities/score.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('Score Module (e2e)', () => {
  let app: INestApplication;
  let projectRepo: Repository<Project>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Project, Score],
          synchronize: true,
        }),
        ProjectModule,
        ScoreModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    projectRepo = app.get<Repository<Project>>(getRepositoryToken(Project));
  });

  afterAll(async () => {
    await app.close();
  });

  it('/scores/compute (POST) should compute score', async () => {
    const proj = await projectRepo.save({ name: 'TestProj', description: '', startDate: '2025-10-01', endDate: '2025-10-10' } as any);
    const payload = {
      projectId: proj.id,
      moduleCompleteness: 20,
      e2eAvailability: 20,
      milestonePercent: 50,
      difficulty: 'N',
      actualDeliveryDays: 10,
      baselineDays: 10,
      earlyDeliveryDays: 0,
      algorithmQuality: 3,
      architectureQuality: 8,
      codeStyle: 4,
      securityScanScore: 100,
      e2eSecurityTestScore: 100,
      authSessionScore: 100,
      configHardeningScore: 100,
    };
    return request(app.getHttpServer())
      .post('/scores/compute')
      .send(payload)
      .expect(201)
      .then(res => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.totalScore).toBeDefined();
      });
  });
});

