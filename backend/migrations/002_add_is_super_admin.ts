import type { MigrationInterface, QueryRunner } from 'typeorm';

// TypeORM 要求 migration 类名以 13 位 JS 时间戳结尾
export class AddIsSuperAdmin1767052800000 implements MigrationInterface {
  name = 'AddIsSuperAdmin1767052800000';

  private isUnknownArray(v: unknown): v is unknown[] {
    return Array.isArray(v);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // MySQL 兼容：通过 information_schema 判断是否已存在列
    const rowsUnknown = (await queryRunner.query(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'user_account'
        AND COLUMN_NAME = 'is_super_admin'
      `,
    )) as unknown;
    let cnt = 0;
    if (this.isUnknownArray(rowsUnknown) && rowsUnknown.length > 0) {
      const first = rowsUnknown[0];
      if (first && typeof first === 'object') {
        const rec = first as Record<string, unknown>;
        cnt = Number(rec.cnt ?? 0);
      }
    }
    if (cnt === 0) {
      await queryRunner.query(`
        ALTER TABLE user_account
        ADD COLUMN is_super_admin TINYINT NOT NULL DEFAULT 0
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rowsUnknown = (await queryRunner.query(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'user_account'
        AND COLUMN_NAME = 'is_super_admin'
      `,
    )) as unknown;
    let cnt = 0;
    if (this.isUnknownArray(rowsUnknown) && rowsUnknown.length > 0) {
      const first = rowsUnknown[0];
      if (first && typeof first === 'object') {
        const rec = first as Record<string, unknown>;
        cnt = Number(rec.cnt ?? 0);
      }
    }
    if (cnt > 0) {
      await queryRunner.query(`
        ALTER TABLE user_account
        DROP COLUMN is_super_admin
      `);
    }
  }
}
