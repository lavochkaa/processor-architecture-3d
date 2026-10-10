import type { AdditionTraceState } from '../../domain/arithmetic/buildTrace';
import type { Bit } from '../../domain/arithmetic/computeAddition';
import { BitCell } from './BitCell';

function inputBits(bits: string): (Bit | null)[] {
  return [null, ...bits.split('').map((bit) => Number(bit) as Bit)];
}

export function AdditionTable({ state, collapsed, onToggle }: { state: AdditionTraceState; collapsed: boolean; onToggle: () => void }) {
  const order = [4, 3, 2, 1, 0];
  const carries = order.map((index) => state.table.carry[index]);
  const sums = [state.table.resultBit, ...[3, 2, 1, 0].map((index) => state.table.sum[index])];
  const rows = [
    { label: 'Перенос', values: carries, prefix: 'c' },
    { label: 'A', values: inputBits(state.table.aBits), prefix: 'a' },
    { label: 'B', values: inputBits(state.table.bBits), prefix: 'b' },
    { label: 'Сумма', values: sums, prefix: 's' }
  ];

  return <section className={`compute-table-wrap${collapsed ? ' is-collapsed' : ''}`} aria-label="Сложение столбиком">
    <div className="compute-table-head"><strong>СЛОЖЕНИЕ СТОЛБИКОМ</strong><button type="button" onClick={onToggle} aria-expanded={!collapsed}>{collapsed ? 'Развернуть' : 'Свернуть'}</button></div>
    {!collapsed && <table className="compute-table">
      <caption>Биты справа налево: входной перенос c₀ равен 0, выходной c₄ становится s₄.</caption>
      <thead><tr><th scope="col">Бит</th>{order.map((index) => <th key={index} scope="col">{index === 4 ? '16' : 2 ** index}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={index}>{index === 0 && (row.prefix === 'a' || row.prefix === 'b') ? <span aria-label="нет входного бита">—</span> : <BitCell value={value} label={`${row.prefix}${order[index]}`} active={state.activeBit === order[index]} />}</td>)}</tr>)}</tbody>
    </table>}
  </section>;
}
