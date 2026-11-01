// 이야기 재생 규칙. 대사는 data/story.json에 장면 단위로 넣고, 화면(panels/Story.tsx)은 이 규칙대로 보여 주기만 한다.
// 지도판 본편도 json에 장면을 더하면 그대로 재생된다.
import raw from './data/story.json';
import { freePacket } from './rules';
import type { AppState } from './types';

export type Speaker = 'nuri' | 'moru' | 'pio' | 'sprout';
export type StoryEffect = 'free-packet';

export interface StoryChoice {
  label: string;
  next: string;
}

export interface StoryNode {
  who: Speaker;
  text: string;
  next?: string;
  choices?: StoryChoice[];
  /** 이 대사가 나올 때 일어나는 일 */
  do?: StoryEffect[];
  /** 장면이 끝난 뒤 이어지는 화면 */
  after?: 'packet';
}

export interface StoryScene {
  start: string;
  nodes: Record<string, StoryNode>;
  /** 어느 길로 끝나든, 중간에 닫아도 받는 것(이야기가 보상을 잠그지 않게) */
  always?: StoryEffect[];
}

export const scenes = raw as unknown as Record<string, StoryScene>;

function applyEffect(draft: AppState, effect: StoryEffect): void {
  if (draft.story.seen.includes(effect)) return;
  draft.story.seen.push(effect);
  if (effect === 'free-packet') freePacket(draft);
}

export function enterNode(draft: AppState, node: StoryNode): void {
  node.do?.forEach((e) => applyEffect(draft, e));
}

/** 고른 답을 기억한다. 뒤 장면에서 분기할 때 읽는다. */
export function rememberChoice(draft: AppState, sceneId: string, nodeId: string, index: number): void {
  draft.story.choices[`${sceneId}/${nodeId}`] = index;
}

export function finishScene(draft: AppState, sceneId: string): void {
  scenes[sceneId].always?.forEach((e) => applyEffect(draft, e));
  if (!draft.story.seen.includes(sceneId)) draft.story.seen.push(sceneId);
}

/** 처음 온 사람에게만 프롤로그를 보여 준다. 이미 쓰던 저장본에는 끼어들지 않는다. */
export function needsIntro(state: AppState): boolean {
  return !state.story.seen.includes('intro') && state.logs.length === 0 && state.garden.plants.length === 0;
}

/** 장면의 잘못된 연결을 찾는다(json을 고칠 때 테스트가 잡아 준다). */
export function brokenLinks(scene: StoryScene): string[] {
  const bad: string[] = scene.nodes[scene.start] ? [] : [scene.start];
  for (const node of Object.values(scene.nodes)) {
    for (const to of [node.next, ...(node.choices ?? []).map((c) => c.next)]) {
      if (to && !scene.nodes[to]) bad.push(to);
    }
  }
  return bad;
}
