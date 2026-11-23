import { Shell } from '@/components/shell'

/** BP (supplier / customer) portal area: routes under /portal/*. Public registration lives outside this group. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <Shell area="portal">{children}</Shell>
}
