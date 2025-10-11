-- Переименовать таблицы
ALTER TABLE t_p48049793_mobile_digital_compu.crews RENAME TO units;
ALTER TABLE t_p48049793_mobile_digital_compu.crew_members RENAME TO unit_members;

-- Переименовать колонки в unit_members
ALTER TABLE t_p48049793_mobile_digital_compu.unit_members 
  RENAME COLUMN crew_id TO unit_id;