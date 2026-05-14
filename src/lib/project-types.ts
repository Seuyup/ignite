export interface ProjectMeta {
  label: string;
  value: string;
}

export const DEFAULT_META_LABELS = [
  "위치/지역",
  "용도",
  "규모",
  "대지면적",
  "건축면적",
  "연면적",
  "건폐율",
  "용적률",
] as const;
