import type { MigrationInterface, QueryRunner } from 'typeorm';

// TypeORM 要求 migration 类名以 13 位 JS 时间戳结尾
export class AddGitIntegration1767200000000 implements MigrationInterface {
  name = 'AddGitIntegration1767200000000';

  private async hasColumn(qr: QueryRunner, tableName: string, columnName: string) {
    const rows = (await qr.query(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      `,
      [tableName, columnName],
    )) as unknown;
    if (Array.isArray(rows) && rows[0] && typeof rows[0] === 'object') {
      const rec = rows[0] as Record<string, unknown>;
      return Number(rec.cnt ?? 0) > 0;
    }
    return false;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // project: repo binding fields
    if (!(await this.hasColumn(queryRunner, 'project', 'repo_url'))) {
      await queryRunner.query(`ALTER TABLE project ADD COLUMN repo_url VARCHAR(512) NULL`);
    }
    if (!(await this.hasColumn(queryRunner, 'project', 'repo_provider'))) {
      await queryRunner.query(`ALTER TABLE project ADD COLUMN repo_provider VARCHAR(32) NULL`);
    }
    if (!(await this.hasColumn(queryRunner, 'project', 'repo_default_branch'))) {
      await queryRunner.query(`ALTER TABLE project ADD COLUMN repo_default_branch VARCHAR(255) NULL`);
    }
    if (!(await this.hasColumn(queryRunner, 'project', 'repo_webhook_secret'))) {
      await queryRunner.query(`ALTER TABLE project ADD COLUMN repo_webhook_secret VARCHAR(128) NULL`);
    }
    if (!(await this.hasColumn(queryRunner, 'project', 'git_sync_enabled'))) {
      await queryRunner.query(`ALTER TABLE project ADD COLUMN git_sync_enabled TINYINT NOT NULL DEFAULT 0`);
    }
    if (!(await this.hasColumn(queryRunner, 'project', 'last_git_event_at'))) {
      await queryRunner.query(`ALTER TABLE project ADD COLUMN last_git_event_at DATETIME NULL`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 兼容：回滚时如果列不存在则跳过
    if (await this.hasColumn(queryRunner, 'project', 'last_git_event_at')) {
      await queryRunner.query(`ALTER TABLE project DROP COLUMN last_git_event_at`);
    }
    if (await this.hasColumn(queryRunner, 'project', 'git_sync_enabled')) {
      await queryRunner.query(`ALTER TABLE project DROP COLUMN git_sync_enabled`);
    }
    if (await this.hasColumn(queryRunner, 'project', 'repo_webhook_secret')) {
      await queryRunner.query(`ALTER TABLE project DROP COLUMN repo_webhook_secret`);
    }
    if (await this.hasColumn(queryRunner, 'project', 'repo_default_branch')) {
      await queryRunner.query(`ALTER TABLE project DROP COLUMN repo_default_branch`);
    }
    if (await this.hasColumn(queryRunner, 'project', 'repo_provider')) {
      await queryRunner.query(`ALTER TABLE project DROP COLUMN repo_provider`);
    }
    if (await this.hasColumn(queryRunner, 'project', 'repo_url')) {
      await queryRunner.query(`ALTER TABLE project DROP COLUMN repo_url`);
    }
  }
}


