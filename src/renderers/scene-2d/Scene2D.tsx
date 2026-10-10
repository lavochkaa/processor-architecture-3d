import type { Scenario } from '../../content/scenarios/schema';

type Step = Scenario['steps'][number];

const nodes = [
  { id: 'keyboard', label: 'Клавиатура', x: 82, y: 96 },
  { id: 'usb', label: 'USB', x: 253, y: 96 },
  { id: 'os', label: 'ОС', x: 425, y: 96 },
  { id: 'focus', label: 'Фокус', x: 596, y: 96 },
  { id: 'browser', label: 'Браузер', x: 596, y: 230 },
  { id: 'cpu', label: 'Состояние UI', x: 425, y: 230 },
  { id: 'render', label: 'Кадр', x: 253, y: 230 },
  { id: 'display', label: 'Дисплей', x: 82, y: 230 }
] as const;

const connections = 'M82 96 H596 V230 H82';

export function Scene2D({ step }: { step: Step }) {
  const current = nodes.find((node) => node.id === step.visualCue.node) ?? nodes[0];
  const shape = step.visualCue.signalType;
  return (
    <div className="diagram" data-testid="scene-2d">
      <div className="diagram-topline"><span>СХЕМА ПРОЦЕССА</span><span>08 УЗЛОВ · 01 СОБЫТИЕ</span></div>
      <svg viewBox="0 0 680 370" role="img" aria-label={`Схема: активный узел ${current.label}`}>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#253b4a" strokeWidth="0.7" /></pattern>
        </defs>
        <rect x="0" y="0" width="680" height="370" fill="url(#grid)" />
        <path d={connections} fill="none" stroke="#405566" strokeWidth="2" strokeDasharray="6 8" />
        {nodes.map((node, index) => {
          const active = node.id === current.id;
          return <g key={node.id} className={active ? `diagram-node active signal-${shape}` : 'diagram-node'}>
            <circle cx={node.x} cy={node.y} r="35" />
            <text x={node.x} y={node.y + 5} className="node-number" textAnchor="middle">{String(index + 1).padStart(2, '0')}</text>
            <text x={node.x} y={node.y + 63} className="node-label" textAnchor="middle">{node.label}</text>
          </g>;
        })}
        <g key={step.id} className={`signal-token signal-${shape}`} transform={`translate(${current.x}, ${current.y - 44})`}>
          {shape === 'input' && <polygon points="-13,-7 0,-14 13,-7 13,7 0,14 -13,7" />}
          {shape === 'event' && <rect x="-14" y="-11" width="28" height="22" rx="3" />}
          {shape === 'state' && <circle r="13" />}
          {shape === 'frame' && <rect x="-15" y="-11" width="30" height="22" />}
        </g>
      </svg>
      <div className="diagram-caption"><span className={`signal-swatch signal-${shape}`} aria-hidden="true" />{signalName(shape)}<strong>{current.label}</strong></div>
    </div>
  );
}

function signalName(signal: Step['visualCue']['signalType']): string {
  return { input: 'Ввод', event: 'Событие', state: 'Состояние', frame: 'Кадр' }[signal];
}
