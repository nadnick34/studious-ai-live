import assert from "node:assert/strict";
import { test } from "node:test";
import { emailIsAllowlistedAdmin, parseAdminEmails } from "../src/lib/admin-allowlist.ts";
import { editionForProfileSave, roleForProfileSave } from "../src/lib/profile-role.ts";

test("empty or unset allowlist matches nobody", () => {
  for (const raw of [undefined, null, "", "   ", ",,,"]) {
    const list = parseAdminEmails(raw);
    assert.equal(list.size, 0);
    assert.equal(emailIsAllowlistedAdmin("owner@getstudious.ai", list), false);
  }
});

test("allowlist is comma-separated and case-insensitive", () => {
  const list = parseAdminEmails(" Owner@GetStudious.ai, second@example.com ");
  assert.equal(emailIsAllowlistedAdmin("owner@getstudious.ai", list), true);
  assert.equal(emailIsAllowlistedAdmin("  SECOND@example.com ", list), true);
  assert.equal(emailIsAllowlistedAdmin("other@example.com", list), false);
  assert.equal(emailIsAllowlistedAdmin(null, list), false);
});

test("profile save cannot choose admin", () => {
  assert.equal(roleForProfileSave("admin", "student"), "student");
  assert.equal(roleForProfileSave("admin", "teacher"), "teacher");
  assert.equal(roleForProfileSave("admin", null), "student");
  assert.equal(roleForProfileSave("superuser", "professional"), "professional");
  assert.equal(roleForProfileSave("admin", "admin"), "admin");
});

test("self-service roles and editions still save", () => {
  for (const role of ["student", "teacher", "professional", "theologian", "both"]) {
    assert.equal(roleForProfileSave(role, "student"), role);
  }
  assert.equal(editionForProfileSave("teacher", "student"), "teacher");
  assert.equal(editionForProfileSave("professional", "student"), "professional");
  assert.equal(editionForProfileSave("theologian", "teacher"), "student");
  assert.equal(editionForProfileSave("student", "professional"), "student");
  assert.equal(editionForProfileSave("both", "teacher"), "student");
  assert.equal(editionForProfileSave("admin", "teacher"), "teacher");
  assert.equal(editionForProfileSave("admin", "student"), "student");
});
