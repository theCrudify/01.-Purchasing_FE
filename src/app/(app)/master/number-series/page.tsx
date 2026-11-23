'use client'
import { CrudPage } from '@/components/crud-page'

export default function Page() {
  return (
    <CrudPage
      title="Number Series"
      path="/number-series"
      defaultSort="seriesCode:asc"
      keyField="key"
      allowCreate={false}
      softDelete={false}
      hasActive={false}
      perms={{ manage: 'SYS.NUMBER_SERIES_MANAGE' }}
      columns={[
        { key: 'seriesCode', header: 'Series', sortable: true },
        { key: 'periodKey', header: 'Period', sortable: true },
        { key: 'prefix', header: 'Prefix' },
        { key: 'format', header: 'Format' },
        { key: 'lastNumber', header: 'Last no.', sortable: true },
      ]}
      fields={[
        { name: 'prefix', label: 'Prefix', required: true },
        { name: 'format', label: 'Format (tokens: {PREFIX} {SEQ:n} {MM} {YY} {YYYY})', required: true },
      ]}
    />
  )
}
