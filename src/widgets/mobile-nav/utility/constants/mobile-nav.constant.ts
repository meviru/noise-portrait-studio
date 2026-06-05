import {
  IconAdjustmentsHorizontal,
  IconBrush,
  IconPalette,
  IconPhoto,
} from '@tabler/icons-react'
import { STRINGS } from '@/shared/constants/strings'

export enum TabId {
  Photo = 'photo',
  Preset = 'preset',
  Parameters = 'parameters',
  Palette = 'palette',
}

export const TABS = [
  { id: TabId.Photo, label: 'Photo', panelLabel: 'Photo', Icon: IconPhoto },
  { id: TabId.Preset, label: 'Style', panelLabel: STRINGS.sidebar.presets, Icon: IconBrush },
  {
    id: TabId.Parameters,
    label: 'Parameters',
    panelLabel: STRINGS.sidebar.parameters,
    Icon: IconAdjustmentsHorizontal,
  },
  {
    id: TabId.Palette,
    label: 'Palette',
    panelLabel: STRINGS.sidebar.palette,
    Icon: IconPalette,
  },
] as const
