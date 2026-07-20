import { type CSSProperties, type ReactNode, useState } from 'react';

export interface TableColumn<Row> {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
}

export interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  onRowClick?: (row: Row) => void;
  rowKey: keyof Row;
  selectedRowKey?: Row[keyof Row] | null;
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: 'var(--text-2xs)',
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border-default)',
  fontWeight: 600,
};

const tdStyle: CSSProperties = {
  padding: '10px 12px',
  color: 'var(--text-secondary)',
  fontVariantNumeric: 'tabular-nums',
};

export function Table<Row>({ columns = [], rows = [], onRowClick, rowKey, selectedRowKey }: TableProps<Row>) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} style={thStyle}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <TableRow
            key={String(r[rowKey])}
            row={r}
            columns={columns}
            onRowClick={onRowClick}
            selected={selectedRowKey != null && r[rowKey] === selectedRowKey}
            index={i}
          />
        ))}
      </tbody>
    </table>
  );
}

function TableRow<Row>({
  row,
  columns,
  onRowClick,
  selected,
}: {
  row: Row;
  columns: TableColumn<Row>[];
  onRowClick?: (row: Row) => void;
  selected: boolean;
  index: number;
}) {
  const [hover, setHover] = useState(false);

  return (
    <tr
      onClick={() => onRowClick?.(row)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: onRowClick ? 'pointer' : 'default',
        borderBottom: '1px solid var(--border-subtle)',
        background: selected ? 'var(--surface-hover)' : hover ? 'var(--surface-hover)' : 'transparent',
      }}
    >
      {columns.map((c) => (
        <td key={c.key} style={tdStyle}>
          {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
        </td>
      ))}
    </tr>
  );
}
