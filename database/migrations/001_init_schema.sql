-- 数据库初始化脚本：创建表与审计触发器

-- 创建项目表
CREATE TABLE project (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建 WBS 节点表
CREATE TABLE wbs_item (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  parent_id BIGINT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INT NOT NULL COMMENT '持续时间（天）',
  seq INT DEFAULT 0 COMMENT '同层级顺序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES project(id),
  FOREIGN KEY (parent_id) REFERENCES wbs_item(id)
);

-- 创建任务表
CREATE TABLE task (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  wbs_item_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  duration INT COMMENT '持续时间（天）',
  status ENUM('not_started','in_progress','completed','on_hold') DEFAULT 'not_started',
  percent_complete DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (wbs_item_id) REFERENCES wbs_item(id)
);

-- 创建任务依赖表
CREATE TABLE dependency (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  task_id BIGINT NOT NULL,
  predecessor_id BIGINT NOT NULL,
  type ENUM('FS','SS','FF','SF') DEFAULT 'FS' COMMENT '依赖类型',
  lag INT DEFAULT 0 COMMENT '滞后天数',
  FOREIGN KEY (task_id) REFERENCES task(id),
  FOREIGN KEY (predecessor_id) REFERENCES task(id)
);

-- 创建调度运行表
CREATE TABLE schedule_run (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  run_type ENUM('initial','rolling') DEFAULT 'initial',
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES project(id)
);

-- 创建调度明细表
CREATE TABLE schedule_item (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  schedule_run_id BIGINT NOT NULL,
  task_id BIGINT NOT NULL,
  early_start DATE,
  early_finish DATE,
  late_start DATE,
  late_finish DATE,
  slack INT COMMENT '总时差',
  FOREIGN KEY (schedule_run_id) REFERENCES schedule_run(id),
  FOREIGN KEY (task_id) REFERENCES task(id)
);

-- 创建审计日志表
CREATE TABLE audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  operation ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  row_id BIGINT NOT NULL,
  change_data JSON,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(100)
);

-- 创建用户表
CREATE TABLE user_account (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建用户组表
CREATE TABLE `group` (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建组成员关联表
CREATE TABLE group_member (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role ENUM('admin','member') NOT NULL DEFAULT 'member',
  FOREIGN KEY (group_id) REFERENCES `group`(id),
  FOREIGN KEY (user_id) REFERENCES user_account(id)
);

-- 创建项目与组分享表
CREATE TABLE project_share (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  group_id BIGINT NOT NULL,
  role ENUM('admin','member') NOT NULL DEFAULT 'member',
  FOREIGN KEY (project_id) REFERENCES project(id),
  FOREIGN KEY (group_id) REFERENCES `group`(id)
);

-- 审计触发器示例：project 表
DELIMITER $$
CREATE TRIGGER trg_project_insert
AFTER INSERT ON project
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES(
    'project','INSERT',NEW.id,
    JSON_OBJECT(
      'new', JSON_OBJECT(
        'id',NEW.id,'name',NEW.name,'description',NEW.description,
        'start_date',NEW.start_date,'end_date',NEW.end_date
      )
    )
  );
END$$

CREATE TRIGGER trg_project_update
AFTER UPDATE ON project
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES(
    'project','UPDATE',NEW.id,
    JSON_OBJECT(
      'old', JSON_OBJECT('name',OLD.name,'start_date',OLD.start_date,'end_date',OLD.end_date),
      'new', JSON_OBJECT('name',NEW.name,'start_date',NEW.start_date,'end_date',NEW.end_date)
    )
  );
END$$

CREATE TRIGGER trg_project_delete
AFTER DELETE ON project
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('project','DELETE',OLD.id,NULL);
END$$
DELIMITER ;

-- TODO: 按照上述模式，为 wbs_item、task、dependency、schedule_run、schedule_item 等表创建触发器
DELIMITER $$

-- wbs_item 表审计触发器
CREATE TRIGGER trg_wbs_item_insert
AFTER INSERT ON wbs_item
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('wbs_item','INSERT',NEW.id,
    JSON_OBJECT('new', JSON_OBJECT(
      'id',NEW.id,'project_id',NEW.project_id,'parent_id',NEW.parent_id,
      'name',NEW.name,'duration',NEW.duration,'seq',NEW.seq
    ))
  );
END$$

CREATE TRIGGER trg_wbs_item_update
AFTER UPDATE ON wbs_item
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('wbs_item','UPDATE',NEW.id,
    JSON_OBJECT(
      'old', JSON_OBJECT('project_id',OLD.project_id,'parent_id',OLD.parent_id,'name',OLD.name,'duration',OLD.duration,'seq',OLD.seq),
      'new', JSON_OBJECT('project_id',NEW.project_id,'parent_id',NEW.parent_id,'name',NEW.name,'duration',NEW.duration,'seq',NEW.seq)
    )
  );
END$$

CREATE TRIGGER trg_wbs_item_delete
AFTER DELETE ON wbs_item
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('wbs_item','DELETE',OLD.id,NULL);
END$$

-- task 表审计触发器
CREATE TRIGGER trg_task_insert
AFTER INSERT ON task
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('task','INSERT',NEW.id,
    JSON_OBJECT('new', JSON_OBJECT(
      'id',NEW.id,'wbs_item_id',NEW.wbs_item_id,'name',NEW.name,
      'start_date',NEW.start_date,'end_date',NEW.end_date,'duration',NEW.duration,
      'status',NEW.status,'percent_complete',NEW.percent_complete
    ))
  );
END$$

CREATE TRIGGER trg_task_update
AFTER UPDATE ON task
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('task','UPDATE',NEW.id,
    JSON_OBJECT(
      'old', JSON_OBJECT('wbs_item_id',OLD.wbs_item_id,'name',OLD.name,'start_date',OLD.start_date,'end_date',OLD.end_date,'duration',OLD.duration,'status',OLD.status,'percent_complete',OLD.percent_complete),
      'new', JSON_OBJECT('wbs_item_id',NEW.wbs_item_id,'name',NEW.name,'start_date',NEW.start_date,'end_date',NEW.end_date,'duration',NEW.duration,'status',NEW.status,'percent_complete',NEW.percent_complete)
    )
  );
END$$

CREATE TRIGGER trg_task_delete
AFTER DELETE ON task
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('task','DELETE',OLD.id,NULL);
END$$

-- dependency 表审计触发器
CREATE TRIGGER trg_dependency_insert
AFTER INSERT ON dependency
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('dependency','INSERT',NEW.id,
    JSON_OBJECT('new', JSON_OBJECT(
      'id',NEW.id,'task_id',NEW.task_id,'predecessor_id',NEW.predecessor_id,
      'type',NEW.type,'lag',NEW.lag
    ))
  );
END$$

CREATE TRIGGER trg_dependency_update
AFTER UPDATE ON dependency
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('dependency','UPDATE',NEW.id,
    JSON_OBJECT(
      'old', JSON_OBJECT('task_id',OLD.task_id,'predecessor_id',OLD.predecessor_id,'type',OLD.type,'lag',OLD.lag),
      'new', JSON_OBJECT('task_id',NEW.task_id,'predecessor_id',NEW.predecessor_id,'type',NEW.type,'lag',NEW.lag)
    )
  );
END$$

CREATE TRIGGER trg_dependency_delete
AFTER DELETE ON dependency
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('dependency','DELETE',OLD.id,NULL);
END$$

-- schedule_run 表审计触发器
CREATE TRIGGER trg_schedule_run_insert
AFTER INSERT ON schedule_run
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('schedule_run','INSERT',NEW.id,
    JSON_OBJECT('new', JSON_OBJECT(
      'id',NEW.id,'project_id',NEW.project_id,'run_type',NEW.run_type
    ))
  );
END$$

CREATE TRIGGER trg_schedule_run_update
AFTER UPDATE ON schedule_run
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('schedule_run','UPDATE',NEW.id,
    JSON_OBJECT(
      'old', JSON_OBJECT('project_id',OLD.project_id,'run_type',OLD.run_type),
      'new', JSON_OBJECT('project_id',NEW.project_id,'run_type',NEW.run_type)
    )
  );
END$$

CREATE TRIGGER trg_schedule_run_delete
AFTER DELETE ON schedule_run
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('schedule_run','DELETE',OLD.id,NULL);
END$$

-- schedule_item 表审计触发器
CREATE TRIGGER trg_schedule_item_insert
AFTER INSERT ON schedule_item
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('schedule_item','INSERT',NEW.id,
    JSON_OBJECT('new', JSON_OBJECT(
      'id',NEW.id,'schedule_run_id',NEW.schedule_run_id,'task_id',NEW.task_id,
      'early_start',NEW.early_start,'early_finish',NEW.early_finish,'late_start',NEW.late_start,'late_finish',NEW.late_finish,'slack',NEW.slack
    ))
  );
END$$

CREATE TRIGGER trg_schedule_item_update
AFTER UPDATE ON schedule_item
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('schedule_item','UPDATE',NEW.id,
    JSON_OBJECT(
      'old', JSON_OBJECT('schedule_run_id',OLD.schedule_run_id,'task_id',OLD.task_id,'early_start',OLD.early_start,'early_finish',OLD.early_finish,'late_start',OLD.late_start,'late_finish',OLD.late_finish,'slack',OLD.slack),
      'new', JSON_OBJECT('schedule_run_id',NEW.schedule_run_id,'task_id',NEW.task_id,'early_start',NEW.early_start,'early_finish',NEW.early_finish,'late_start',NEW.late_start,'late_finish',NEW.late_finish,'slack',NEW.slack)
    )
  );
END$$

CREATE TRIGGER trg_schedule_item_delete
AFTER DELETE ON schedule_item
FOR EACH ROW
BEGIN
  INSERT INTO audit_log(table_name,operation,row_id,change_data)
  VALUES('schedule_item','DELETE',OLD.id,NULL);
END$$

DELIMITER ;
