import { useSyncExternalStore } from 'react';
import { store } from '../core/store';
import type { AppState } from '../core/types';

/** 저장소의 상태를 읽고, 바뀌면 이 컴포넌트를 다시 그린다. */
export function useAppState(): AppState {
  return useSyncExternalStore(store.subscribe, () => store.state);
}
