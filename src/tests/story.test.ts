import { describe, expect, it } from 'vitest';
import { FORBIDDEN_WORDS } from '../core/copy';
import { openFreePacket, pendingPacketCount, pendingPacketDates } from '../core/rules';
import { brokenLinks, enterNode, finishScene, needsIntro, rememberChoice, scenes } from '../core/story';
import { createState } from '../core/store';

describe('이야기', () => {
  it('모든 장면의 연결이 맞고 금지 표현이 없다', () => {
    for (const scene of Object.values(scenes)) {
      expect(brokenLinks(scene)).toEqual([]);
      for (const n of Object.values(scene.nodes)) {
        const texts = [n.text, ...(n.choices ?? []).map((c) => c.label)];
        for (const t of texts) for (const w of FORBIDDEN_WORDS) expect(t).not.toContain(w);
      }
    }
  });

  it('어느 선택으로 끝나도, 중간에 닫아도 첫 주머니는 하나만 받는다', () => {
    const s = createState();
    enterNode(s, scenes.intro.nodes['p03-3']);
    expect(pendingPacketCount(s)).toBe(1);
    finishScene(s, 'intro');
    expect(pendingPacketCount(s)).toBe(1);
    const quit = createState();
    finishScene(quit, 'intro'); // 첫 대사에서 닫은 경우
    expect(pendingPacketCount(quit)).toBe(1);
  });

  it('첫 주머니는 날짜와 상관없고, 그날 활동 주머니를 막지 않는다', () => {
    const s = createState();
    finishScene(s, 'intro');
    expect(pendingPacketDates(s)).toEqual([]);
    const seed = openFreePacket(s)!;
    expect(s.seeds).toEqual([seed]);
    expect(pendingPacketCount(s)).toBe(0);
    expect(openFreePacket(s)).toBeNull();
  });

  it('프롤로그는 처음 온 사람에게 한 번만 나온다', () => {
    const s = createState();
    expect(needsIntro(s)).toBe(true);
    finishScene(s, 'intro');
    expect(needsIntro(s)).toBe(false);
    const old = createState();
    old.logs.push({} as never); // 이미 쓰던 저장본
    expect(needsIntro(old)).toBe(false);
  });

  it('고른 답을 기억한다', () => {
    const s = createState();
    rememberChoice(s, 'intro', 'p02-2', 2);
    expect(s.story.choices['intro/p02-2']).toBe(2);
  });
});
