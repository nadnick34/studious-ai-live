import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "migrations");
const migrationName = "0010_archived_columns.sql";

const studentClassQuery = `
  select * from study_sets
  where user_id = $1 and class_id = $2 and archived = false
  order by created_at desc
`;
const teacherClassQuery = `
  select * from teacher_assessments
  where user_id = $1 and class_id = $2 and archived = false
  order by created_at desc
`;

async function migrationFiles() {
  return (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
}

/** Same bookkeeping as scripts/migrate.mjs: one transaction, then a _migrations row. */
async function applyPending(db, { except = [] } = {}) {
  await db.exec(
    "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set((await db.query("select name from _migrations")).rows.map((row) => row.name));
  const appliedNow = [];
  for (const name of await migrationFiles()) {
    if (applied.has(name) || except.includes(name)) continue;
    const text = await readFile(join(migrationsDir, name), "utf8");
    await db.transaction(async (tx) => {
      await tx.exec(text);
      await tx.query("insert into _migrations (name) values ($1)", [name]);
    });
    appliedNow.push(name);
  }
  return appliedNow;
}

async function plantSharedObjects(db) {
  await db.exec(`
    create schema if not exists tcc;
    create table if not exists tcc.beds (id int primary key, label text);
    insert into tcc.beds (id, label) values (1, 'untouched') on conflict (id) do nothing;
    create table if not exists public.rr_locations (id int primary key, name text);
    insert into public.rr_locations (id, name) values (1, 'keep') on conflict (id) do nothing;
  `);
}

async function assertSharedObjectsUntouched(db) {
  const beds = await db.query("select id, label from tcc.beds order by id");
  const rooms = await db.query("select id, name from public.rr_locations order by id");
  assert.deepEqual(beds.rows, [{ id: 1, label: "untouched" }]);
  assert.deepEqual(rooms.rows, [{ id: 1, name: "keep" }]);
  const bedColumns = (await db.query(
    "select column_name from information_schema.columns where table_schema = 'tcc' and table_name = 'beds' order by ordinal_position",
  )).rows.map((row) => row.column_name);
  assert.deepEqual(bedColumns, ["id", "label"]);
}

function archived(rows) {
  return rows.map((row) => Boolean(row.archived));
}

test("migration file is additive and does not name shared objects", async () => {
  const sql = await readFile(join(migrationsDir, migrationName), "utf8");
  assert.match(sql, /alter table study_sets add column if not exists archived boolean not null default false/i);
  assert.match(sql, /alter table teacher_assessments add column if not exists archived boolean not null default false/i);
  assert.doesNotMatch(sql, /\b(drop|truncate|delete|update)\b/i);
  assert.doesNotMatch(sql, /\btcc\b/i);
  assert.doesNotMatch(sql, /\brr_/i);
  const runner = await readFile(join(root, "scripts/migrate.mjs"), "utf8");
  assert.match(runner, /INSERT INTO _migrations \(name\) VALUES \(\$1\)/);
  assert.match(runner, /if \(applied\.has\(name\)\) continue/);
});

test("empty embedded database applies 0010 once and serves class queries", async () => {
  const db = new PGlite();
  await db.waitReady;
  await plantSharedObjects(db);
  const first = await applyPending(db);
  assert.ok(first.includes(migrationName));
  const recorded = await db.query("select name, applied_at from _migrations where name = $1", [migrationName]);
  assert.equal(recorded.rows.length, 1);
  const appliedAt = String(recorded.rows[0].applied_at);

  const second = await applyPending(db);
  assert.deepEqual(second, []);
  const again = await db.query("select name, applied_at from _migrations where name = $1", [migrationName]);
  assert.equal(again.rows.length, 1);
  assert.equal(String(again.rows[0].applied_at), appliedAt);

  await db.exec(`
    insert into study_sets (id, user_id, class_id, name, notes)
    values ('s1', 'student', 'class-1', 'Chapter 1', '{}'::jsonb);
    insert into teacher_assessments (id, user_id, class_id, name)
    values ('ta1', 'teacher', 'tclass-1', 'Quiz 1');
  `);
  const sets = await db.query(studentClassQuery, ["student", "class-1"]);
  const assessments = await db.query(teacherClassQuery, ["teacher", "tclass-1"]);
  assert.equal(sets.rows.length, 1);
  assert.equal(sets.rows[0].name, "Chapter 1");
  assert.deepEqual(archived(sets.rows), [false]);
  assert.equal(assessments.rows.length, 1);
  assert.equal(assessments.rows[0].name, "Quiz 1");
  assert.deepEqual(archived(assessments.rows), [false]);

  const questions = await db.query(
    "select column_name from information_schema.columns where table_name = 'teacher_assessments' and column_name = 'questions'",
  );
  assert.equal(questions.rows.length, 1);
  const profileCols = await db.query(
    "select column_name from information_schema.columns where table_name = 'profiles' and column_name in ('education_approach','state','education_level','college_class','student_grade') order by column_name",
  );
  assert.deepEqual(
    profileCols.rows.map((row) => row.column_name),
    ["college_class", "education_approach", "education_level", "state", "student_grade"],
  );
  const tool = await db.query("select to_regclass('public.teacher_tool_state') as name");
  const log = await db.query("select to_regclass('public.activity_log') as name");
  assert.equal(tool.rows[0].name, "teacher_tool_state");
  assert.equal(log.rows[0].name, "activity_log");
  await assertSharedObjectsUntouched(db);
  await db.close();
});

test("database missing archived columns keeps existing rows and records the migration once", async () => {
  const db = new PGlite();
  await db.waitReady;
  await plantSharedObjects(db);
  const first = await applyPending(db, { except: [migrationName] });
  assert.equal(first.includes(migrationName), false);

  await db.exec(`
    insert into study_sets (id, user_id, class_id, name, notes)
    values ('s1', 'student', 'class-1', 'Chapter 1', '{"title":"Chapter 1"}'::jsonb);
    insert into teacher_assessments (id, user_id, class_id, name, results)
    values ('ta1', 'teacher', 'tclass-1', 'Quiz 1', '[{"studentName":"Ada"}]'::jsonb);
  `);

  await assert.rejects(db.query(studentClassQuery, ["student", "class-1"]), (err) => {
    assert.equal(err.code, "42703");
    assert.match(err.message, /archived/);
    return true;
  });
  await assert.rejects(db.query(teacherClassQuery, ["teacher", "tclass-1"]), (err) => {
    assert.equal(err.code, "42703");
    assert.match(err.message, /archived/);
    return true;
  });

  const applied = await applyPending(db);
  assert.deepEqual(applied, [migrationName]);
  const recorded = await db.query("select count(*)::int as n from _migrations where name = $1", [migrationName]);
  assert.equal(Number(recorded.rows[0].n), 1);

  const sets = await db.query(studentClassQuery, ["student", "class-1"]);
  const assessments = await db.query(teacherClassQuery, ["teacher", "tclass-1"]);
  assert.equal(sets.rows.length, 1);
  assert.equal(sets.rows[0].name, "Chapter 1");
  assert.equal(sets.rows[0].notes.title, "Chapter 1");
  assert.equal(Boolean(sets.rows[0].archived), false);
  assert.equal(assessments.rows.length, 1);
  assert.equal(assessments.rows[0].name, "Quiz 1");
  assert.equal(assessments.rows[0].results[0].studentName, "Ada");
  assert.equal(Boolean(assessments.rows[0].archived), false);

  const text = await readFile(join(migrationsDir, migrationName), "utf8");
  await db.exec(text);
  const stillOne = await db.query("select count(*)::int as n from _migrations where name = $1", [migrationName]);
  assert.equal(Number(stillOne.rows[0].n), 1);
  const skipped = await applyPending(db);
  assert.deepEqual(skipped, []);
  const afterSkip = await db.query("select count(*)::int as n from _migrations where name = $1", [migrationName]);
  assert.equal(Number(afterSkip.rows[0].n), 1);

  await db.query("update study_sets set archived = true where id = 's1'");
  const hidden = await db.query(studentClassQuery, ["student", "class-1"]);
  assert.equal(hidden.rows.length, 0);
  await assertSharedObjectsUntouched(db);
  await db.close();
});
