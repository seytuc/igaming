import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { User } from '../src/users/models/user.model';
import { execFileSync } from 'node:child_process';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AuditGrpcClient } from '../src/audit-client/audit-grpc.client';
import { getModelToken } from '@nestjs/sequelize';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { OutboxEvent } from '../src/outbox/outbox.model';
import { OutboxWorker } from '../src/outbox/outbox.worker';
import { AuditLogAction } from '@app/contracts';
import { OutboxRepository } from '../src/outbox/outbox.repository';

jest.setTimeout(120_000);

describe('Users API', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;
  let userModel: typeof User;
  let outboxModel: typeof OutboxEvent;
  let outboxRepository: OutboxRepository;

  const originalEnv = { ...process.env };

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();

    process.env.USER_DB_HOST = container.getHost();
    process.env.USER_DB_PORT = String(container.getPort());
    process.env.USER_DB_NAME = container.getDatabase();
    process.env.USER_DB_USER = container.getUsername();
    process.env.USER_DB_PASSWORD = container.getPassword();

    process.env['X-API-KEY'] = 'test-key';

    execFileSync('npm', ['run', 'push-migrate-users'], {
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: 'inherit',
      timeout: 30000,
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuditGrpcClient)
      .useValue({
        recordEvent: jest.fn().mockResolvedValue(undefined),
        ping: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(OutboxWorker)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    userModel = app.get<typeof User>(getModelToken(User));
    outboxModel = app.get<typeof OutboxEvent>(getModelToken(OutboxEvent));
    outboxRepository = app.get(OutboxRepository);
  });

  afterAll(async () => {
    try {
      if (app) await app.close();
    } finally {
      try {
        if (container) await container.stop();
      } finally {
        process.env = originalEnv;
      }
    }
  });

  it('POST /users. Сохроняет пользователя и события outbox', async () => {
    const email = `${randomUUID()}@example.com`;
    const requestId = randomUUID();

    await request(app.getHttpServer())
      .post('/users')
      .set('X-API-KEY', 'test-key')
      .set('X-Request-Id', requestId)
      .send({ name: 'Sergey', email })
      .expect(201);

    const savedUser = await userModel.findOne({
      where: { email },
    });
    expect(savedUser).not.toBeNull();
    expect(savedUser?.name).toBe('Sergey');
    expect(savedUser?.email).toBe(email);

    const savedEvent = await outboxModel.findOne({
      where: { requestId },
    });
    expect(savedEvent).not.toBeNull();
    expect(savedEvent?.event).toMatchObject({
      id: savedEvent?.id,
      entityId: savedUser?.id,
      action: AuditLogAction.AUDIT_LOG_ACTION_USER_CREATED,
    });
    expect(await outboxModel.count({ where: { requestId } })).toBe(1);
  });

  describe('Валидация POST', () => {
    it('Пустое тело', async () => {
      await request(app?.getHttpServer())
        .post('/users')
        .set('X-API-KEY', 'test-key')
        .send({})
        .expect(400);
    });
    it('Только почта', async () => {
      await request(app?.getHttpServer())
        .post('/users')
        .set('X-API-KEY', 'test-key')
        .send({ email: 'sergey@gmail.com' })
        .expect(400);
    });
    it('Только имя', async () => {
      await request(app?.getHttpServer())
        .post('/users')
        .set('X-API-KEY', 'test-key')
        .send({ name: 'Anna' })
        .expect(400);
    });
    it('Непраивльная почта', async () => {
      await request(app?.getHttpServer())
        .post('/users')
        .set('X-API-KEY', 'test-key')
        .send({ name: 'Anna', email: 'anna!gm.ru' })
        .expect(400);
    });
    it('Null', async () => {
      await request(app?.getHttpServer())
        .post('/users')
        .set('X-API-KEY', 'test-key')
        .send({ name: null, email: null })
        .expect(400);
    });
  });

  it('откатываем создание пользователя при ошибке outbox', async () => {
    const email = `${randomUUID()}@example.com`;
    const requestId = randomUUID();

    const enqueueSpy = jest
      .spyOn(outboxRepository, 'enqueue')
      .mockRejectedValueOnce(new Error('Outbox write failed'));

    try {
      await request(app.getHttpServer())
        .post('/users')
        .set('X-API-Key', 'test-key')
        .set('X-Request-Id', requestId)
        .send({
          name: 'Sergey',
          email,
        })
        .expect(500);
      expect(enqueueSpy).toHaveBeenCalledTimes(1);

      const savedUser = await userModel.findOne({ where: { email } });
      expect(savedUser).toBeNull();

      const event = await outboxModel.findOne({ where: { requestId } });
      expect(event).toBeNull();
    } finally {
      enqueueSpy.mockRestore();
    }
  });

  it('GET /users/:id возвращает 404 для отсутствующего пользователя', async () => {
    await request(app.getHttpServer())
      .get(`/users/${randomUUID()}`)
      .set('X-API-Key', 'test-key')
      .expect(404);
  });

  it('PATCH /users/:id', async () => {
    if (!app) throw new Error('Test application is not init');
    const requestId = randomUUID();
    const email = `${randomUUID()}@gmail.com`;
    await request(app.getHttpServer())
      .post('/users')
      .set('X-API-Key', 'test-key')
      .set('X-Request-Id', requestId)
      .send({ email, name: 'Oleg' });

    const savedUser = await userModel.findOne({
      where: { email },
    });
    expect(savedUser).not.toBeNull();
    expect(savedUser?.name).toBe('Oleg');
    expect(savedUser?.email).toBe(email);

    await request(app.getHttpServer())
      .patch(`/users/${savedUser?.id}`)
      .set('X-Request-Id', requestId)
      .set('X-API-Key', 'test-key')
      .send({ email: 'new@mail.ru', name: 'Ivan' });

    const patchUser = await userModel.findOne({
      where: { id: savedUser?.id },
    });
    expect(patchUser).not.toBeNull();
    expect(patchUser?.name).toBe('Ivan');
    expect(patchUser?.email).toBe('new@mail.ru');

    const countEvents = await outboxModel.count();
    expect(countEvents).toBe(3);
  });
});
