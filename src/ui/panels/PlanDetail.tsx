import type { ReactNode } from 'react';
import { copy } from '../../core/copy';
import { PLACE_OPTIONS, WHEN_OPTIONS } from '../../core/rules';
import { ActivityImg } from '../icons';

function Fact({ label, options, value, onPick }: { label: string; options: readonly string[]; value: string; onPick: (v: string) => void }) {
  const all = options.includes(value) ? options : [...options, value];
  return (
    <div className="fact">
      <small>{label}</small>
      <select className="chip-select" aria-label={label} value={value} onChange={(e) => onPick(e.target.value)}>
        {all.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

interface Props {
  /** 활동 아이콘(없으면 직접 적은 일 = 연필) */
  activityId?: string;
  title: string;
  minutes: number;
  when: string;
  where: string;
  onWhen: (v: string) => void;
  onWhere: (v: string) => void;
  /** [더 작게]·[다른 활동] 같은 보조 버튼 */
  extra?: ReactNode;
  onConfirm: () => void;
}

/** 미션·일상 연결이 함께 쓰는 "언제 / 어디서 / 얼마나" 계획 화면. */
export function PlanDetail(p: Props) {
  return (
    <>
      <div className="detail">
        <div className="detail-art"><ActivityImg id={p.activityId} className="detail-img" /></div>
        <div className="detail-side">
          <h3>{p.title}</h3>
          <div className="facts">
            <Fact label={copy.panel.when} options={WHEN_OPTIONS} value={p.when} onPick={p.onWhen} />
            <Fact label={copy.panel.where} options={PLACE_OPTIONS} value={p.where} onPick={p.onWhere} />
            <div className="fact">
              <small>{copy.panel.how}</small>
              <strong>{p.minutes > 0 ? copy.panel.minutesFrom(p.minutes) : '내 속도로'}</strong>
            </div>
          </div>
          <div className="detail-alt">{p.extra}</div>
        </div>
      </div>
      <button type="button" className="btn btn-primary" onClick={p.onConfirm}>{copy.panel.confirm}</button>
    </>
  );
}
