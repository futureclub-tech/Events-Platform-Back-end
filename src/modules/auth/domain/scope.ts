export const SCOPE = {
  SYSTEM: "SYSTEM",
  ORGANIZATION: "ORGANIZATION",
  PUBLIC: "PUBLIC",
};

export type IScope = (typeof SCOPE)[keyof typeof SCOPE];
