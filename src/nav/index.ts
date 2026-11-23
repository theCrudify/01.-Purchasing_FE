import type { NavItem } from './types'
import { nav as identity } from './identity'
import { nav as master } from './master'
import { nav as workflow } from './workflow'
import { nav as bp } from './bp'
import { nav as procurement } from './procurement'

export const ALL_NAV: NavItem[] = [...workflow, ...procurement, ...bp, ...master, ...identity]
export type { NavItem }
