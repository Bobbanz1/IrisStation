import { filter, map, sortBy } from 'common/collections';
import { ReactNode, useState } from 'react';
import { sendAct, useBackend } from 'tgui/backend';
import {
  Autofocus,
  Box,
  Button, // NOVA EDIT ADDITION
  Flex,
  Input,
  LabeledList,
  Popper,
  Stack,
} from 'tgui-core/components';
import { exhaustiveCheck } from 'tgui-core/exhaustive';
import { classes } from 'tgui-core/react';
import { createSearch } from 'tgui-core/string';

import { SideDropdown } from '../../../iris_components/SideDropdown'; // IRIS EDIT ADDITION from https://github.com/Bubberstation/Bubberstation/pull/3157
import { CharacterPreview } from '../../common/CharacterPreview';
import { PageButton } from '../components/PageButton'; // IRIS EDIT
import { RandomizationButton } from '../components/RandomizationButton';
import { features } from '../preferences/features';
import {
  FeatureChoicedServerData,
  FeatureValueInput,
} from '../preferences/features/base';
import { Gender, GENDERS } from '../preferences/gender';
import {
  createSetPreference,
  PreferencesMenuData,
  RandomSetting,
  ServerData,
} from '../types';
import { useRandomToggleState } from '../useRandomToggleState';
import { useServerPrefs } from '../useServerPrefs';
import { DeleteCharacterPopup } from './DeleteCharacterPopup';
import { MultiNameInput, NameInput } from './names';

const CLOTHING_CELL_SIZE = 48;
const CLOTHING_SIDEBAR_ROWS = 12.4; // NOVA EDIT CHANGE - ORIGINAL:  9 // IRIS EDIT CHANGE - 12.4 from Nova's 13.4

const CLOTHING_SELECTION_CELL_SIZE = 48;
const CLOTHING_SELECTION_WIDTH = 5.4;
const CLOTHING_SELECTION_MULTIPLIER = 5.2;

type CharacterControlsProps = {
  handleRotate: () => void;
  handleRotateReverse: () => void; // IRIS EDIT ADDITION: Counter-Clockwise rotational support
  handleOpenSpecies: () => void;
  handleFood: () => void; // NOVA EDIT ADDITION
  gender: Gender;
  setGender: (gender: Gender) => void;
  showGender: boolean;
};

function CharacterControls(props: CharacterControlsProps) {
  return (
    <Stack>
      <Stack.Item>
        <Button
          onClick={props.handleRotate}
          fontSize="22px"
          // IRIS EDIT ADDITION START: Retooled Rotate + Added Counter-Clockwise rotational icon
          icon="redo"
          tooltip="Rotate Clockwise"
          tooltipPosition="top"
        />
      </Stack.Item>

      <Stack.Item>
        <Button
          onClick={props.handleRotateReverse}
          fontSize="22px"
          icon="undo"
          tooltip="Rotate Counter-Clockwise"
          // IRIS EDIT ADDITION END
          tooltipPosition="top"
        />
      </Stack.Item>

      <Stack.Item>
        <Button
          onClick={props.handleOpenSpecies}
          fontSize="22px"
          icon="paw"
          tooltip="Species"
          tooltipPosition="top"
        />
      </Stack.Item>

      {props.showGender && (
        <Stack.Item>
          <GenderButton
            gender={props.gender}
            handleSetGender={props.setGender}
          />
        </Stack.Item>
      )}
      {/* NOVA EDIT ADDITION START */}
      <Stack.Item>
        <Button
          onClick={props.handleFood}
          fontSize="22px"
          icon="drumstick-bite"
          tooltip="Edit Food Preferences"
          tooltipPosition="top"
        />
        {/* NOVA EDIT ADDITION END */}
      </Stack.Item>
    </Stack>
  );
}

type ChoicedSelectionProps = {
  name: string;
  catalog: FeatureChoicedServerData;
  selected: string;
  supplementalFeature?: string;
  supplementalValue?: unknown;
  onClose: () => void;
  onSelect: (value: string) => void;
};

function ChoicedSelection(props: ChoicedSelectionProps) {
  const { catalog, supplementalFeature, supplementalValue } = props;
  const [getSearchText, searchTextSet] = useState('');

  if (!catalog.icons) {
    return <Box color="red">Provided catalog had no icons!</Box>;
  }

  return (
    <Box
      className="ChoicedSelection"
      style={{
        padding: '5px',

        height: `${
          CLOTHING_SELECTION_CELL_SIZE * CLOTHING_SELECTION_MULTIPLIER
        }px`,
        width: `${CLOTHING_SELECTION_CELL_SIZE * CLOTHING_SELECTION_WIDTH}px`,
      }}
    >
      <Stack vertical fill>
        <Stack.Item>
          <Stack fill>
            {supplementalFeature && (
              <Stack.Item>
                <FeatureValueInput
                  feature={features[supplementalFeature]}
                  featureId={supplementalFeature}
                  shrink
                  value={supplementalValue}
                />
              </Stack.Item>
            )}

            <Stack.Item grow>
              <Box
                style={{
                  borderBottom: '1px solid #888',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textAlign: 'center',
                }}
              >
                Select {props.name.toLowerCase()}
              </Box>
            </Stack.Item>

            <Stack.Item>
              <Button color="red" onClick={props.onClose}>
                X
              </Button>
            </Stack.Item>
          </Stack>
        </Stack.Item>

        <Stack.Item overflowX="hidden" overflowY="scroll">
          <Autofocus>
            <Input
              placeholder="Search..."
              style={{
                margin: '0px 5px',
                width: '95%',
              }}
              onInput={(_, value) => searchTextSet(value)}
            />
            <Flex wrap>
              {searchInCatalog(getSearchText, catalog.icons).map(
                ([name, image], index) => {
                  return (
                    <Flex.Item
                      key={index}
                      basis={`${CLOTHING_SELECTION_CELL_SIZE}px`}
                      style={{
                        padding: '5px',
                      }}
                    >
                      <Button
                        onClick={() => {
                          props.onSelect(name);
                        }}
                        selected={name === props.selected}
                        tooltip={name}
                        tooltipPosition="right"
                        style={{
                          height: `${CLOTHING_SELECTION_CELL_SIZE}px`,
                          width: `${CLOTHING_SELECTION_CELL_SIZE}px`,
                        }}
                      >
                        <Box
                          className={classes([
                            'preferences32x32',
                            image,
                            'centered-image',
                          ])}
                        />
                      </Button>
                    </Flex.Item>
                  );
                },
              )}
            </Flex>
          </Autofocus>
        </Stack.Item>
      </Stack>
    </Box>
  );
}

function searchInCatalog(searchText = '', catalog: Record<string, string>) {
  let items = Object.entries(catalog);
  if (searchText) {
    items = filter(
      items,
      createSearch(searchText, ([name, _icon]) => name),
    );
  }
  return items;
}

type GenderButtonProps = {
  handleSetGender: (gender: Gender) => void;
  gender: Gender;
};

function GenderButton(props: GenderButtonProps) {
  const [genderMenuOpen, setGenderMenuOpen] = useState(false);

  return (
    <Popper
      isOpen={genderMenuOpen}
      onClickOutside={() => setGenderMenuOpen(false)}
      placement="right-end"
      content={
        <Stack backgroundColor="white" ml={0.5} p={0.3}>
          {[Gender.Male, Gender.Female, Gender.Other, Gender.Other2].map(
            (gender) => {
              return (
                <Stack.Item key={gender}>
                  <Button
                    selected={gender === props.gender}
                    onClick={() => {
                      props.handleSetGender(gender);
                      setGenderMenuOpen(false);
                    }}
                    fontSize="22px"
                    icon={GENDERS[gender].icon}
                    tooltip={GENDERS[gender].text}
                    tooltipPosition="top"
                  />
                </Stack.Item>
              );
            },
          )}
        </Stack>
      }
    >
      <Button
        onClick={() => {
          setGenderMenuOpen(!genderMenuOpen);
        }}
        fontSize="22px"
        icon={GENDERS[props.gender].icon}
        tooltip="Gender"
        tooltipPosition="top"
      />
    </Popper>
  );
}

type CatalogItem = {
  name: string;
  supplemental_feature?: string;
};

type MainFeatureProps = {
  catalog: FeatureChoicedServerData & CatalogItem;
  currentValue: string;
  isOpen: boolean;
  handleClose: () => void;
  handleOpen: () => void;
  handleSelect: (newClothing: string) => void;
  randomization?: RandomSetting;
  setRandomization: (newSetting: RandomSetting) => void;
};

function MainFeature(props: MainFeatureProps) {
  const { data } = useBackend<PreferencesMenuData>();

  const {
    catalog,
    currentValue,
    isOpen,
    handleOpen,
    handleClose,
    handleSelect,
    randomization,
    setRandomization,
  } = props;

  const supplementalFeature = catalog.supplemental_feature;

  return (
    <Popper
      placement="bottom-start"
      isOpen={isOpen}
      onClickOutside={handleClose}
      baseZIndex={1} // Below the default popper at z 2
      content={
        <ChoicedSelection
          name={catalog.name}
          catalog={catalog}
          selected={currentValue}
          supplementalFeature={supplementalFeature}
          supplementalValue={
            supplementalFeature &&
            data.character_preferences.supplemental_features[
              supplementalFeature
            ]
          }
          onClose={handleClose}
          onSelect={handleSelect}
        />
      }
    >
      <Button
        onClick={(event) => {
          event.stopPropagation();
          if (isOpen) {
            handleClose();
          } else {
            handleOpen();
          }
        }}
        style={{
          height: `${CLOTHING_CELL_SIZE}px`,
          width: `${CLOTHING_CELL_SIZE}px`,
        }}
        position="relative"
        tooltip={catalog.name}
        tooltipPosition="right"
      >
        <Box
          className={classes([
            'preferences32x32',
            catalog.icons![currentValue],
            'centered-image',
          ])}
          style={{
            transform: randomization
              ? 'translateX(-70%) translateY(-70%) scale(1.1)'
              : 'translateX(-50%) translateY(-50%) scale(1.3)',
          }}
        />

        {randomization && (
          <RandomizationButton
            dropdownProps={{
              dropdownStyle: {
                bottom: 0,
                position: 'absolute',
                right: '1px',
              },

              onOpen: (event) => {
                // We're a button inside a button.
                // Did you know that's against the W3C standard? :)
                event.cancelBubble = true;
                event.stopPropagation();
              },
            }}
            value={randomization}
            setValue={setRandomization}
          />
        )}
      </Button>
    </Popper>
  );
}

const createSetRandomization =
  (act: typeof sendAct, preference: string) => (newSetting: RandomSetting) => {
    act('set_random_preference', {
      preference,
      value: newSetting,
    });
  };

function sortPreferences(array: [string, unknown][]) {
  return sortBy(array, ([featureId, _]) => {
    const feature = features[featureId];
    return feature?.name;
  });
}

type PreferenceListProps = {
  preferences: Record<string, unknown>;
  randomizations: Record<string, RandomSetting>;
  maxHeight: string;
  children?: ReactNode;
};

export function PreferenceList(props: PreferenceListProps) {
  const { act } = useBackend<PreferencesMenuData>();
  const { preferences, randomizations, maxHeight, children } = props;

  return (
    <Stack.Item
      basis="50%"
      grow
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '4px',
      }}
      overflowX="hidden"
      overflowY="auto"
      maxHeight={maxHeight}
    >
      <LabeledList>
        {sortPreferences(Object.entries(preferences)).map(
          ([featureId, value]) => {
            const feature = features[featureId];
            const randomSetting = randomizations[featureId];

            if (feature === undefined) {
              return (
                <Stack.Item key={featureId}>
                  <b>Feature {featureId} is not recognized.</b>
                </Stack.Item>
              );
            }

            return (
              <LabeledList.Item
                key={featureId}
                label={feature.name}
                tooltip={feature.description}
                verticalAlign="middle"
              >
                <Stack fill>
                  {randomSetting && (
                    <Stack.Item>
                      <RandomizationButton
                        setValue={createSetRandomization(act, featureId)}
                        value={randomSetting}
                      />
                    </Stack.Item>
                  )}

                  <Stack.Item grow>
                    <FeatureValueInput
                      feature={feature}
                      featureId={featureId}
                      value={value}
                    />
                  </Stack.Item>
                </Stack>
              </LabeledList.Item>
            );
          },
        )}
      </LabeledList>

      {children}
    </Stack.Item>
  );
}

export function getRandomization(
  preferences: Record<string, unknown>,
  serverData: ServerData | undefined,
  randomBodyEnabled: boolean,
): Record<string, RandomSetting> {
  if (!serverData) {
    return {};
  }

  const { data } = useBackend<PreferencesMenuData>();

  if (!randomBodyEnabled) {
    return {};
  }

  return Object.fromEntries(
    map(
      filter(Object.keys(preferences), (key) =>
        serverData.random.randomizable.includes(key),
      ),
      (key) => [
        key,
        data.character_preferences.randomization[key] || RandomSetting.Disabled,
      ],
    ),
  );
}

type MainPageProps = {
  openSpecies: () => void;
};

export function MainPage(props: MainPageProps) {
  const { act, data } = useBackend<PreferencesMenuData>();
  const [currentClothingMenu, setCurrentClothingMenu] = useState<string | null>(
    null,
  );
  const [deleteCharacterPopupOpen, setDeleteCharacterPopupOpen] =
    useState(false);
  const [multiNameInputOpen, setMultiNameInputOpen] = useState(false);
  const [randomToggleEnabled] = useRandomToggleState();

  // IRIS EDIT BEGIN: SWAPPABLE PREF MENUS - SKYRAT PORT
  enum PrefPage {
    Visual, // The visual parts
    Lore, // Lore, Flavor Text, Age, Records
  }

  const [currentPrefPage, setCurrentPrefPage] = useState(PrefPage.Visual);
  // IRIS EDIT END - SKYRAT PORT

  const serverData = useServerPrefs();

  const currentSpeciesData =
    serverData && serverData.species[data.character_preferences.misc.species];

  const contextualPreferences =
    data.character_preferences.secondary_features || [];

  const mainFeatures = [
    ...Object.entries(data.character_preferences.clothing ?? {}),
    ...Object.entries(data.character_preferences.features ?? {}),
  ];

  const randomBodyEnabled =
    data.character_preferences.non_contextual.random_body !==
      RandomSetting.Disabled || randomToggleEnabled;

  const randomizationOfMainFeatures = getRandomization(
    Object.fromEntries(mainFeatures),
    serverData,
    randomBodyEnabled,
  );

  const nonContextualPreferences = {
    ...data.character_preferences.non_contextual,
  };

  if (randomBodyEnabled) {
    nonContextualPreferences['random_species'] =
      data.character_preferences.randomization['species'];
  } else {
    // We can't use random_name/is_accessible because the
    // server doesn't know whether the random toggle is on.
    delete nonContextualPreferences['random_name'];
  }

  // IRIS EDIT BEGIN: SWAPPABLE PREF MENUS - SKYRAT PORT
  let prefPageContents;
  switch (currentPrefPage) {
    case PrefPage.Visual:
      prefPageContents = (
        <PreferenceList
          randomizations={getRandomization(
            contextualPreferences,
            serverData,
            randomBodyEnabled,
          )}
          preferences={contextualPreferences}
          maxHeight="auto"
        />
      );
      break;
    case PrefPage.Lore:
      prefPageContents = (
        <PreferenceList
          randomizations={getRandomization(
            nonContextualPreferences,
            serverData,
            randomBodyEnabled,
          )}
          preferences={nonContextualPreferences}
          maxHeight="auto"
        />
      );
      break;
    default:
      exhaustiveCheck(currentPrefPage);
  }
  // IRIS EDIT END - SKYRAT PORT

  return (
    <>
      {multiNameInputOpen && (
        <MultiNameInput
          handleClose={() => setMultiNameInputOpen(false)}
          handleRandomizeName={(preference) =>
            act('randomize_name', {
              preference,
            })
          }
          handleUpdateName={(nameType, value) =>
            act('set_preference', {
              preference: nameType,
              value,
            })
          }
          names={data.character_preferences.names}
        />
      )}

      {deleteCharacterPopupOpen && (
        <DeleteCharacterPopup
          close={() => setDeleteCharacterPopupOpen(false)}
        />
      )}

      <Stack height={`${CLOTHING_SIDEBAR_ROWS * CLOTHING_CELL_SIZE}px`}>
        <Stack.Item>
          <Stack vertical fill>
            <Stack.Item>
              <CharacterControls
                gender={data.character_preferences.misc.gender}
                handleOpenSpecies={props.openSpecies}
                handleRotate={() => {
                  // IRIS EDIT ADDITION START: retooled rotation to support counter/clockwise movement
                  act('rotate', { backwards: false });
                }}
                handleRotateReverse={() => {
                  act('rotate', { backwards: true });
                  // IRIS EDIT ADDITION END
                }}
                setGender={createSetPreference(act, 'gender')}
                showGender={
                  currentSpeciesData ? !!currentSpeciesData.sexes : true
                }
                // NOVA EDIT ADDITION START
                handleFood={() => {
                  act('open_food');
                }}
                // NOVA EDIT ADDITION END
              />
            </Stack.Item>

            <Stack.Item grow>
              <CharacterPreview
                height="100%" // NOVA EDIT - ORIGINAL: height="100%" // IRIS EDIT: returned to 100% from Nova's 80%
                id={data.character_preview_view}
              />
            </Stack.Item>

            {/* NOVA EDIT ADDITION START */}
            <Stack.Item position="relative">
              <SideDropdown // IRIS EDIT: Dropdown -> SideDropdown to support https://github.com/Bubberstation/Bubberstation/pull/3015
                width="100%"
                selected={data.preview_selection}
                options={data.preview_options}
                onSelected={(value) =>
                  act('update_preview', {
                    updated_preview: value,
                  })
                }
              />
            </Stack.Item>
            {/* NOVA EDIT ADDITION END */}
            {/* IRIS EDIT ADDITION START: Background Selection from https://github.com/Bubberstation/Bubberstation/pull/3015*/}
            <Stack.Item position="relative">
              <SideDropdown
                width="100%"
                selected={data.character_preferences.misc.background_state}
                options={serverData?.background_state.choices || []}
                onSelected={(value) =>
                  act('update_background', {
                    new_background: value,
                  })
                }
              />
            </Stack.Item>
            {/* IRIS EDIT ADDITION END: Background Selection */}

            <Stack.Item position="relative">
              <NameInput
                name={data.character_preferences.names[data.name_to_use]}
                handleUpdateName={createSetPreference(act, data.name_to_use)}
                openMultiNameInput={() => {
                  setMultiNameInputOpen(true);
                }}
              />
            </Stack.Item>
          </Stack>
        </Stack.Item>

        <Stack.Item width={`${CLOTHING_CELL_SIZE * 2 + 15}px`}>
          {/* IRIS EDIT: altered wrap to better align icons*/}
          <Stack height="100%" vertical wrap ml="-3px" mt="-3px">
            {mainFeatures.map(([clothingKey, clothing]) => {
              const catalog = serverData?.[
                clothingKey
              ] as FeatureChoicedServerData & {
                name: string;
              };

              return (
                <Stack.Item key={clothingKey} mt={0.5} px={0.5}>
                  {!catalog ? (
                    // Skeleton button
                    <Button height={4} width={4} disabled />
                  ) : (
                    <MainFeature
                      catalog={catalog}
                      currentValue={clothing}
                      isOpen={currentClothingMenu === clothingKey}
                      handleClose={() => {
                        setCurrentClothingMenu(null);
                      }}
                      handleOpen={() => {
                        setCurrentClothingMenu(clothingKey);
                      }}
                      handleSelect={createSetPreference(act, clothingKey)}
                      randomization={randomizationOfMainFeatures[clothingKey]}
                      setRandomization={createSetRandomization(
                        act,
                        clothingKey,
                      )}
                    />
                  )}
                </Stack.Item>
              );
            })}
          </Stack>
        </Stack.Item>

        <Stack.Item grow basis={0}>
          {/* IRIS EDIT BEGIN: Swappable pref menus - SKYRAT PORT */}
          <Stack>
            <Stack.Item grow>
              <PageButton
                currentPage={currentPrefPage}
                page={PrefPage.Visual}
                setPage={setCurrentPrefPage}
              >
                Character Visuals
              </PageButton>
            </Stack.Item>
            <Stack.Item grow>
              <PageButton
                currentPage={currentPrefPage}
                page={PrefPage.Lore}
                setPage={setCurrentPrefPage}
              >
                Character Lore
              </PageButton>
            </Stack.Item>
          </Stack>
          <Stack fill vertical>
            <Stack.Divider />
            {prefPageContents}
          </Stack>
          <Box my={0.5}>
            <Button
              color="red"
              disabled={
                Object.values(data.character_profiles).filter((name) => name)
                  .length < 2
              }
              onClick={() => setDeleteCharacterPopupOpen(true)}
            >
              Delete Character
            </Button>
          </Box>
          {/* IRIS EDIT END: Swappable pref menus -SKYRAT PORT*/}
        </Stack.Item>
      </Stack>
    </>
  );
}
