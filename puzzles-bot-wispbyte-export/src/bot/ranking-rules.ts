export const placementPoints = {
  participant: 2,
  mvp: 10,
  second: 5,
  third: 3,
  last: 2,
} as const;

export type SalaPlacement = keyof typeof placementPoints;

export const placementLabels: Record<SalaPlacement, string> = {
  participant: "Participación",
  mvp: "MVP",
  second: "Segundo lugar",
  third: "Tercer lugar",
  last: "Último lugar",
};