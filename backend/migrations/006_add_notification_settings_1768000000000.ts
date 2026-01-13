import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationSettings1768000000000 implements MigrationInterface {
  name = 'AddNotificationSettings1768000000000';

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
    // user_account.ci_notify_enabled
    if (!(await this.hasColumn(queryRunner, 'user_account', 'ci_notify_enabled'))) {
      await queryRunner.query(`
        ALTER TABLE user_account
        ADD COLUMN ci_notify_enabled TINYINT NOT NULL DEFAULT 1
      `);
    }

    // project notification settings
    if (!(await this.hasColumn(queryRunner, 'project', 'notify_task_complete'))) {
      await queryRunner.query(`
        ALTER TABLE project
        ADD COLUMN notify_task_complete TINYINT NOT NULL DEFAULT 0
      `);
    }
    if (!(await this.hasColumn(queryRunner, 'project', 'notify_task_complete_scope'))) {
      await queryRunner.query(`
        ALTER TABLE project
        ADD COLUMN notify_task_complete_scope VARCHAR(16) NOT NULL DEFAULT 'admins'
      `);
    }
    if (!(await this.hasColumn(queryRunner, 'project', 'notify_milestone_complete'))) {
      await queryRunner.query(`
        ALTER TABLE project
        ADD COLUMN notify_milestone_complete TINYINT NOT NULL DEFAULT 0
      `);
    }
    if (!(await this.hasColumn(queryRunner, 'project', 'notify_milestone_complete_scope'))) {
      await queryRunner.query(`
        ALTER TABLE project
        ADD COLUMN notify_milestone_complete_scope VARCHAR(16) NOT NULL DEFAULT 'admins'
      `);
    }

    // wbs_item.completed_at (去重里程碑通知)
    if (!(await this.hasColumn(queryRunner, 'wbs_item', 'completed_at'))) {
      await queryRunner.query(`
        ALTER TABLE wbs_item
        ADD COLUMN completed_at DATETIME NULL
      `);
    }
  }

  public async down(): Promise<void> {
    // MVP：不做回滚（避免误删数据）
  }
}

