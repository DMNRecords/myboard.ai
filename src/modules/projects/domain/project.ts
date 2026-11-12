export const projectLanguages = ["ru", "kk", "en"] as const;

export type ProjectLanguage = (typeof projectLanguages)[number];
export type ProjectStatus = "draft" | "archived";

export function isProjectLanguage(value: string): value is ProjectLanguage {
  return projectLanguages.some((language) => language === value);
}

export function normalizeProjectTitle(title: string): string {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new Error("Project title must not be empty.");
  }

  if (normalizedTitle.length > 120) {
    throw new Error("Project title must not exceed 120 characters.");
  }

  return normalizedTitle;
}

export type GameProject = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  language: ProjectLanguage;
  style: string | null;
  status: ProjectStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

type CreateDraftProjectInput = {
  id: string;
  ownerId: string;
  title: string;
  language: ProjectLanguage;
  createdAt: Date;
};

export function createDraftProject({
  id,
  ownerId,
  title,
  language,
  createdAt
}: CreateDraftProjectInput): GameProject {
  const normalizedTitle = normalizeProjectTitle(title);

  return {
    id,
    ownerId,
    title: normalizedTitle,
    description: null,
    language,
    style: null,
    status: "draft",
    version: 1,
    createdAt,
    updatedAt: createdAt,
    archivedAt: null
  };
}

export function archiveProject(project: GameProject, archivedAt: Date): GameProject {
  if (project.status === "archived") {
    return project;
  }

  return {
    ...project,
    status: "archived",
    archivedAt,
    updatedAt: archivedAt
  };
}
