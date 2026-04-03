import {
  COMPATIBILITY_ENTRIES_PART_A,
} from './compatibility-layers';
import { COMPATIBILITY_ENTRIES_PART_B } from './compatibility-entries';

export { DEFAULT_COMPATIBILITY_LAYERS } from './compatibility-layers';

export const DEFAULT_COMPATIBILITY = [
  ...COMPATIBILITY_ENTRIES_PART_A,
  ...COMPATIBILITY_ENTRIES_PART_B,
];
