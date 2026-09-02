export const STRUCTURE_GUIDE_EVENT = "snapod:structure-guide-targets";

export type StructureGuideId =
  | "roof"
  | "base"
  | "columns"
  | "sidePanel"
  | "frontDoor"
  | "fixedGlass"
  | "acousticPanel"
  | "desk"
  | "carpet"
  | "lighting";

export interface StructureGuideScreenBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface StructureGuideTarget {
  id: StructureGuideId;
  x: number;
  y: number;
  visible: boolean;
  bounds?: StructureGuideScreenBounds;
}
