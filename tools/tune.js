/* Служебный перебор множителей для §9. Не часть игры: печатает компактную
   сводку по набору m-значений, чтобы не править config.js на каждой итерации. */
import { CATEGORIES } from '../src/config.js';
import { run } from './sim.js';

const byId = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const M = {
  cpu:'clickBase', gpu:'income', ram:'autoMult', keyboard:'autoCps', mouse:'clickMult',
  monitor:'globalMult', furniture:'globalMult', rgb:'globalMult', decor:'globalMult'
};
const R = { keyboard:1, ram:1 };

const C0 = Object.fromEntries(CATEGORIES.map(c => [c.id, c.cost.C0]));
export function apply(set, c0scale = 1, psuBase = null){
  for(const c of CATEGORIES) c.cost.C0 = Math.round(C0[c.id] * c0scale);
  if(psuBase !== null) byId.psu.effects.wattLimit.V0 = psuBase;
  for(const id in set){
    if(id.endsWith('_r')) byId[id.slice(0,-2)].cost.r = set[id];
    else byId[id].effects[M[id]].m = set[id];
  }
}
const mmss = s => s === null ? '—' : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

export function probe(label, set, c0scale = 1, psuBase = null, minutes = 60){
  apply(set, c0scale, psuBase);
  const out = [3, 5, 0].map(cps => {
    const l = run(cps, minutes);
    let t5m = null, acc = 0;
    return { cps, l };
  });
  const r3 = out[0].l;
  console.log(`${label.padEnd(10)} | 1-я ${mmss(r3.firstBuy).padStart(5)} | Вт ${mmss(r3.firstWattBlock).padStart(6)} | все14 ${mmss(r3.allCategories).padStart(6)} | 5M ${mmss(r3.reach5m).padStart(6)} | троттл ${(r3.throttleTime/60).toFixed(1)}м | итог ${r3.state.earned.toExponential(2)} | ур.ср ${(CATEGORIES.reduce((a,c)=>a+r3.state.levels[c.id],0)/CATEGORIES.length).toFixed(1)}`);
  return out;
}
