// 앱 화면을 헤드리스 Chrome으로 단계별로 눌러 보며 스크린샷을 찍는다(이 환경에선 브라우저 패널이 localhost를 못 열어서 만든 도구).
// 사용: npm run build && node tools/screenshot.mjs <출력폴더> tools/screenshot.steps.example.json file://$PWD/dist/index.html
// 창 크기: SIZE=1440x900 node tools/screenshot.mjs ... (기본 844x390)
// steps: {key:'ArrowUp',hold:600,shotHeld:'이름'} {js:'실행할 코드'} {click:'버튼 글자', sel:'CSS 선택자(생략하면 button)'} {wait:ms} {shot:'파일이름'}
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const [outDir, stepsFile, url] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const steps = JSON.parse(readFileSync(stepsFile, 'utf8'));
const port = 9400 + Math.floor(Math.random() * 300);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--allow-file-access-from-files', `--remote-debugging-port=${port}`,
  `--user-data-dir=${outDir}/profile`, '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let list;
for (let i = 0; i < 50; i++) {
  try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (list.length) break; } catch {}
  await sleep(200);
}
if (!list) { console.log('no cdp'); chrome.kill(); process.exit(1); }
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');
const [VW, VH] = (process.env.SIZE || '844x390').split('x').map(Number);
await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 2, mobile: false });
if (process.env.TOUCH) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url });
await sleep(2500);
for (const s of steps) {
  if (s.js) { const v = await evalJs(s.js); if (v !== undefined) console.log('js ->', JSON.stringify(v)); }
  if (s.click) await evalJs(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(s.sel || 'button')})].find(b=>b.textContent.includes(${JSON.stringify(s.click)}));if(!e)return 'NOT FOUND: ${s.click}';e.click();return 'ok'})()`).then((v) => v !== 'ok' && console.log(v));
  if (s.touch) {
    // {touch:[x,y]}: 손가락으로 누른다. {touchDrag:[x1,y1,x2,y2]}는 끌기.
    const [x, y] = s.touch;
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await sleep(60);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  if (s.touchDrag) {
    const [x1, y1, x2, y2] = s.touchDrag;
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] });
    for (let i = 1; i <= 8; i++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + ((x2 - x1) * i) / 8, y: y1 + ((y2 - y1) * i) / 8 }] }); await sleep(16); }
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  if (s.insertText) await send('Input.insertText', { text: s.insertText }); // 조합이 끝난 한글이 들어오는 것과 같다
  if (s.hold) {
    // {hold:[키,ms]}: 키를 누르고 있는다(걷기 충돌 확인용).
    const [key, ms] = s.hold;
    const code = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 }[key];
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code: key, windowsVirtualKeyCode: code });
    await sleep(ms);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code });
  }
  if (s.drag) {
    // {drag:[x1,y1,x2,y2]}: 누른 채로 끌어서 놓는다(꾸미기 드래그 확인용).
    const [x1, y1, x2, y2] = s.drag;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x1, y: y1 });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x1, y: y1, button: 'left', clickCount: 1 });
    for (let i = 1; i <= 8; i++) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x1 + ((x2 - x1) * i) / 8, y: y1 + ((y2 - y1) * i) / 8, button: 'left' });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x2, y: y2, button: 'left', clickCount: 1 });
  }
  if (s.mouse) {
    // {mouse:[x,y]}: 화면(CSS 픽셀) 좌표를 누른다. 정원 안의 식물·주민처럼 버튼이 아닌 것을 누를 때 쓴다.
    const [x, y] = s.mouse;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  }
  if (s.key) {
    // {key:'ArrowUp', hold:600}: 키를 hold ms 동안 누른다
    const code = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 }[s.key];
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: s.key, windowsVirtualKeyCode: code, code: s.key });
    await sleep(s.hold || 300);
    if (s.shotHeld) { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${s.shotHeld}.png`, Buffer.from(r.result.data, 'base64')); }
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: s.key, windowsVirtualKeyCode: code, code: s.key });
  }
  if (s.wait) await sleep(s.wait);
  if (s.shot) { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${s.shot}.png`, Buffer.from(r.result.data, 'base64')); }
}
ws.close(); chrome.kill();
