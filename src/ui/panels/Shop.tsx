// 모루의 작업대: 열매로 꾸미기 소품을 산다. 사지 않아도 이야기는 그대로 이어진다.
import { useState } from 'react';
import { buy, SHOP } from '../../core/economy';
import { copy } from '../../core/copy';
import { events } from '../../core/events';
import { store } from '../../core/store';
import { PropImg } from '../icons';
import { openModal } from '../modal';
import { useAppState } from '../useAppState';
import { PanelHead } from './PanelHead';

function Shop() {
  const { fruit } = useAppState();
  const [say, setSay] = useState<string>(copy.shop.intro);
  return (
    <section className="panel shop" role="dialog" aria-label={copy.shop.title}>
      <PanelHead title={copy.shop.title} />
      <div className="shop-top">
        <p className="shop-say">{say}</p>
        <strong className="shop-balance">{copy.shop.balance(fruit)}</strong>
      </div>
      <ul className="shop-grid">
        {SHOP.map((item) => {
          const canBuy = fruit >= item.price;
          const name = copy.decorate.kind[item.kind];
          return (
            <li className="shop-card" key={item.kind}>
              <span className="shop-img"><PropImg kind={item.kind} /></span>
              <strong>{name}</strong>
              <button
                type="button"
                className={canBuy ? 'btn-chip btn-chip-primary' : 'btn-chip'}
                aria-label={`${name} ${copy.shop.price(item.price)}`}
                onClick={() => {
                  // 모자라면 사지 않고 모루의 말만 바뀐다(살 수 없는 버튼도 눌러 볼 수 있게 둔다).
                  if (fruit < item.price) return setSay(copy.shop.poor);
                  store.update((d) => { buy(d, item.kind); });
                  events.emit('sfx', { name: 'buy' });
                  setSay(copy.lines.bought);
                }}
              >
                {canBuy ? `${copy.shop.buy} · ${copy.shop.price(item.price)}` : copy.shop.price(item.price)}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export const openShop = () => openModal(<Shop />);
