import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMultitenantOrgSchema1767053000000 implements MigrationInterface {
  name = 'InitMultitenantOrgSchema1767053000000';

  private async getColumnType(qr: QueryRunner, tableName: string, columnName: string): Promise<string | null> {
    const rows = (await qr.query(
      `
      SELECT COLUMN_TYPE AS columnType
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
      `,
      [tableName, columnName],
    )) as unknown;
    if (Array.isArray(rows) && rows[0] && typeof rows[0] === 'object') {
      const rec = rows[0] as Record<string, unknown>;
      const v = rec.columnType;
      if (typeof v === 'string' && v.length > 0) return v;
    }
    return null;
  }

  private async hasTable(qr: QueryRunner, tableName: string) {
    const rows = (await qr.query(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      `,
      [tableName],
    )) as unknown;
    if (Array.isArray(rows) && rows[0] && typeof rows[0] === 'object') {
      const rec = rows[0] as Record<string, unknown>;
      return Number(rec.cnt ?? 0) > 0;
    }
    return false;
  }

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
    // organization
    if (!(await this.hasTable(queryRunner, 'organization'))) {
      await queryRunner.query(`
        CREATE TABLE organization (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }

    // 确保有一个默认组织（方便给历史数据填 org_id=1）
    await queryRunner.query(`
      INSERT INTO organization (id, name)
      SELECT 1, 'Default Org'
      WHERE NOT EXISTS (SELECT 1 FROM organization WHERE id = 1)
    `);

    // org_member
    if (!(await this.hasTable(queryRunner, 'org_member'))) {
      // 关键：外键两侧字段类型必须完全一致（含 unsigned）
      const userIdType = (await this.getColumnType(queryRunner, 'user_account', 'id')) ?? 'bigint';
      const orgIdType = (await this.getColumnType(queryRunner, 'organization', 'id')) ?? 'bigint';
      await queryRunner.query(`
        CREATE TABLE org_member (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          org_id ${orgIdType} NOT NULL,
          user_id ${userIdType} NOT NULL,
          role_in_org ENUM('org_admin','org_member') NOT NULL DEFAULT 'org_member',
          group_id BIGINT NULL,
          role_in_group ENUM('admin','member') NOT NULL DEFAULT 'member',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_org_user (org_id, user_id),
          FOREIGN KEY (org_id) REFERENCES organization(id),
          FOREIGN KEY (user_id) REFERENCES user_account(id)
        )
      `);
    }

    // project.org_id（老库可能没有）
    if (!(await this.hasColumn(queryRunner, 'project', 'org_id'))) {
      await queryRunner.query(`ALTER TABLE project ADD COLUMN org_id BIGINT NOT NULL DEFAULT 1`);
    }

    // group.org_id（老库可能没有）
    if (await this.hasTable(queryRunner, 'group')) {
      if (!(await this.hasColumn(queryRunner, 'group', 'org_id'))) {
        await queryRunner.query('ALTER TABLE `group` ADD COLUMN org_id BIGINT NOT NULL DEFAULT 1');
      }
      // 兼容：如果旧库 group.name 是 UNIQUE，则不在这里尝试删除旧索引（避免不同环境索引名不一致）
      // 新索引（org_id, name）如果已存在则跳过
      const hasIdx = (await queryRunner.query(
        `
        SELECT COUNT(*) AS cnt
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'group'
          AND INDEX_NAME = 'uq_group_org_name'
        `,
      )) as unknown;
      let idxCnt = 0;
      if (Array.isArray(hasIdx) && hasIdx[0] && typeof hasIdx[0] === 'object') {
        idxCnt = Number((hasIdx[0] as Record<string, unknown>).cnt ?? 0);
      }
      if (idxCnt === 0) {
        await queryRunner.query('CREATE UNIQUE INDEX uq_group_org_name ON `group`(org_id, name)');
      }
    }

    // project_member
    if (!(await this.hasTable(queryRunner, 'project_member'))) {
      const projectIdType = (await this.getColumnType(queryRunner, 'project', 'id')) ?? 'bigint';
      const userIdType = (await this.getColumnType(queryRunner, 'user_account', 'id')) ?? 'bigint';
      await queryRunner.query(`
        CREATE TABLE project_member (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          project_id ${projectIdType} NOT NULL,
          user_id ${userIdType} NOT NULL,
          role ENUM('admin','member') NOT NULL DEFAULT 'member',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_project_user (project_id, user_id),
          FOREIGN KEY (project_id) REFERENCES project(id),
          FOREIGN KEY (user_id) REFERENCES user_account(id)
        )
      `);
    }

    // task_assignee
    if (!(await this.hasTable(queryRunner, 'task_assignee'))) {
      const taskIdType = (await this.getColumnType(queryRunner, 'task', 'id')) ?? 'bigint';
      const userIdType = (await this.getColumnType(queryRunner, 'user_account', 'id')) ?? 'bigint';
      await queryRunner.query(`
        CREATE TABLE task_assignee (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          task_id ${taskIdType} NOT NULL,
          user_id ${userIdType} NOT NULL,
          assigned_by BIGINT NULL,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_task_user (task_id, user_id),
          FOREIGN KEY (task_id) REFERENCES task(id),
          FOREIGN KEY (user_id) REFERENCES user_account(id)
        )
      `);
    }
  }

  public async down(): Promise<void> {
    // MVP：不做回滚（避免误删数据）
  }
}


