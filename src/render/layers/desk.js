/* Стол. Категория «Мебель» задаёт материал и форму столешницы. */

const TOP  = ['#5a4a38', '#4d4436', '#33384a', '#2c3550'];
const EDGE = ['#3f3326', '#352e24', '#232735', '#1d2438'];

export function draw(g){
  const { ctx, L } = g;
  const F = g.vs('furniture');
  const d = L.desk;
  const w = d.x1 - d.x0;

  /* столешница в лёгкой перспективе */
  ctx.fillStyle = TOP[F];
  ctx.beginPath();
  ctx.moveTo(d.x0 + 18, d.top - 14);
  ctx.lineTo(d.x1 - 18, d.top - 14);
  ctx.lineTo(d.x1, d.top);
  ctx.lineTo(d.x0, d.top);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,.07)';
  ctx.fillRect(d.x0, d.top, w, 3);
  ctx.fillStyle = TOP[F];
  ctx.fillRect(d.x0, d.top, w, d.thick);
  ctx.fillStyle = EDGE[F];
  ctx.fillRect(d.x0, d.top + d.thick, w, 5);

  /* ножки */
  ctx.fillStyle = TOP[F];
  const legTop = d.top + d.thick + 5;
  if(F >= 2){                                   // рама вместо тумб
    ctx.fillStyle = '#22262f';
    ctx.fillRect(d.x0 + 26, legTop, d.legW, L.floorY - legTop);
    ctx.fillRect(d.x1 - 26 - d.legW, legTop, d.legW, L.floorY - legTop);
    ctx.fillRect(d.x0 + 26, L.floorY - 8, d.x1 - d.x0 - 52, 8);
  }else{
    ctx.fillRect(d.x0 + 20, legTop, d.legW, L.floorY - legTop);
    ctx.fillRect(d.x1 - 20 - d.legW, legTop, d.legW, L.floorY - legTop);
  }

  /* подсветка под столешницей появляется вместе с лентой */
  if(g.vs('rgb') >= 1){
    ctx.fillStyle = 'rgba(120,180,255,.25)';
    ctx.fillRect(d.x0, d.top + d.thick + 2, w, 2);
  }
  /* тень под столом */
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.fillRect(d.x0 + 10, L.floorY, w - 20, 6);
}
