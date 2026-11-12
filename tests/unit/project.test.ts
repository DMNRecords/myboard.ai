import { describe, expect, it } from "vitest";

import {
  archiveProject,
  createDraftProject,
  isProjectLanguage,
  normalizeProjectTitle
} from "../../src/modules/projects/domain/project";

describe("project domain", () => {
  const createdAt = new Date("2026-11-12T10:00:00.000Z");

  it("creates a version-one private draft with a normalized title", () => {
    expect(
      createDraftProject({
        id: "project-1",
        ownerId: "user-1",
        title: "  Темиртау: история города  ",
        language: "ru",
        createdAt
      })
    ).toMatchObject({
      title: "Темиртау: история города",
      status: "draft",
      version: 1,
      archivedAt: null
    });
  });

  it("does not allow a blank project title", () => {
    expect(() =>
      createDraftProject({
        id: "project-1",
        ownerId: "user-1",
        title: "   ",
        language: "kk",
        createdAt
      })
    ).toThrow("Project title must not be empty.");
  });

  it("rejects titles longer than the database constraint", () => {
    expect(() => normalizeProjectTitle("a".repeat(121))).toThrow(
      "Project title must not exceed 120 characters."
    );
  });

  it("accepts only supported project languages", () => {
    expect(isProjectLanguage("ru")).toBe(true);
    expect(isProjectLanguage("de")).toBe(false);
  });

  it("archives a draft without changing its version", () => {
    const project = createDraftProject({
      id: "project-1",
      ownerId: "user-1",
      title: "Temirtau",
      language: "en",
      createdAt
    });
    const archivedAt = new Date("2026-11-12T11:00:00.000Z");

    expect(archiveProject(project, archivedAt)).toMatchObject({
      status: "archived",
      archivedAt,
      updatedAt: archivedAt,
      version: 1
    });
  });
});
