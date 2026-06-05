import {
  IconAdjustmentsHorizontal,
  IconBrush,
  IconPalette,
  IconPhoto,
} from '@tabler/icons-react'
import { STRINGS } from '@/shared/constants/strings'

export type TabId = 'photo' | 'preset' | 'parameters' | 'palette'

export const TABS = [
  { id: 'photo' as TabId, label: 'Photo', panelLabel: 'Photo', Icon: IconPhoto },
  { id: 'preset' as TabId, label: 'Style', panelLabel: STRINGS.sidebar.presets, Icon: IconBrush },
  {
    id: 'parameters' as TabId,
    label: 'Parameters',
    panelLabel: STRINGS.sidebar.parameters,
    Icon: IconAdjustmentsHorizontal,
  },
  {
    id: 'palette' as TabId,
    label: 'Palette',
    panelLabel: STRINGS.sidebar.palette,
    Icon: IconPalette,
  },
] as const
