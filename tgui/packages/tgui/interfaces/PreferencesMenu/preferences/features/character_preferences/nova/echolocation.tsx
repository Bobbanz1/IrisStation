// THIS IS A NOVA SECTOR UI FILE
import {
  CheckboxInput,
  Feature,
  FeatureChoiced,
  FeatureColorInput,
  FeatureToggle,
} from '../../base';
import { FeatureDropdownInput } from '../../dropdowns';

export const echolocation_outline: Feature<string> = {
  name: 'Echo outline color',
  component: FeatureColorInput,
};

export const echolocation_key: FeatureChoiced = {
  name: 'Echolocation type',
  component: FeatureDropdownInput,
};

export const echolocation_use_echo: FeatureToggle = {
  name: 'Display echo overlay',
  component: CheckboxInput,
};

// IRIS EDIT ADDITION BEGIN - SLOWER_ECHOLOCATION_PREFS
export const echolocation_speed: FeatureChoiced = {
  name: 'Echolocation speed',
  component: FeatureDropdownInput,
};
// IRIS EDIT ADDITION END
