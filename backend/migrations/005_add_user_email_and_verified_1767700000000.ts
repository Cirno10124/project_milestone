import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEmailAndVerified1767700000000 implements MigrationInterface {
  name = 'AddUserEmailAndVerified1767700000000';

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

  private async hasIndex(qr: QueryRunner, tableName: string, indexName: string) {
    const rows = (await qr.query(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      `,
      [tableName, indexName],
    )) as unknown;
    if (Array.isArray(rows) && rows[0] && typeof rows[0] === 'object') {
      const rec = rows[0] as Record<string, unknown>;
      return Number(rec.cnt ?? 0) > 0;
    }
    return false;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // email
    if (!(await this.hasColumn(queryRunner, 'user_account', 'email'))) {
      await queryRunner.query(`
        ALTER TABLE user_account
        ADD COLUMN email VARCHAR(255) NULL
      `);
    }

    // email_verified
    if (!(await this.hasColumn(queryRunner, 'user_account', 'email_verified'))) {
      await queryRunner.query(`
        ALTER TABLE user_account
        ADD COLUMN email_verified TINYINT NOT NULL DEFAULT 0
      `);
    }

    // 兼容：历史库 username 曾经是邮箱/手机 —— 尝试把邮箱回填（仅当 email 为空且 username 看起来像邮箱）
    await queryRunner.query(`
      UPDATE user_account
      SET email = username
      WHERE email IS NULL
        AND username LIKE '%@%'
    `);

    // unique index: email（允许多个 NULL）
    if (!(await this.hasIndex(queryRunner, 'user_account', 'uq_user_email'))) {
      await queryRunner.query(`CREATE UNIQUE INDEX uq_user_email ON user_account(email)`);
    }
  }

  public async down(): Promise<void> {
    // MVP：不做回滚（避免误删数据/索引）
  }
}


