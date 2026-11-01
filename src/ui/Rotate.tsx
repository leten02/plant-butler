import { createPortal } from 'react-dom';
import { copy } from '../core/copy';

/** 세로 화면일 때만 CSS가 보여주는 안내. 정원 틀 밖(body)에 깔린다. */
export function Rotate() {
  return createPortal(
    <div className="rotate-notice" role="alert">
      <div className="rotate-icon">📱</div>
      <p>{copy.rotate.message}</p>
    </div>,
    document.body,
  );
}
