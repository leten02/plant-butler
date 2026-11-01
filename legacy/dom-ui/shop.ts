// 모루의 작업대: 열매로 꾸미기 소품을 산다. 사지 않아도 이야기는 그대로 이어진다.
import { buy, SHOP } from '../core/economy';
import { copy } from '../core/copy';
import { store } from '../core/store';
import { btn, el } from './dom';
import { iconBtn, propImg, wrap } from './icons';
import { closeModal, openModal, replaceModalContent } from './modal';

export function openShop(): void {
  let say: string = copy.shop.intro;

  const render = (): HTMLElement => {
    const fruit = store.state.fruit;
    const box = el('section', 'panel shop');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', copy.shop.title);

    const head = el('div', 'panel-head');
    head.append(el('span', 'icon-spacer'), el('h2', 'panel-title', copy.shop.title), iconBtn('close', copy.panel.close, closeModal));

    const top = el('div', 'shop-top');
    top.append(el('p', 'shop-say', say), el('strong', 'shop-balance', copy.shop.balance(fruit)));

    const grid = el('ul', 'shop-grid');
    for (const item of SHOP) {
      const card = el('li', 'shop-card');
      const canBuy = fruit >= item.price;
      const b = btn(canBuy ? 'btn-chip btn-chip-primary' : 'btn-chip', canBuy ? `${copy.shop.buy} · ${copy.shop.price(item.price)}` : copy.shop.price(item.price), () => {
        // 모자라면 사지 않고 모루의 말만 바뀐다(살 수 없는 버튼도 눌러 볼 수 있게 둔다).
        if (store.state.fruit < item.price) {
          say = copy.shop.poor;
        } else {
          store.update((d) => { buy(d, item.kind); });
          say = copy.shop.bought;
        }
        replaceModalContent(render());
      });
      b.setAttribute('aria-label', `${copy.decorate.kind[item.kind]} ${copy.shop.price(item.price)}`);
      card.append(wrap('shop-img', propImg(item.kind)), el('strong', '', copy.decorate.kind[item.kind]), b);
      grid.append(card);
    }
    box.append(head, top, grid);
    return box;
  };

  openModal(render);
}
