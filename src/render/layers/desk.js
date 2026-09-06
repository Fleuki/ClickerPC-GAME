/* Стол. Категория «Мебель» задаёт материал и форму столешницы.

   Стол рисуется в два приёма: сначала столешница, потом — уже поверх
   периферии — передний торец и ножки. Так клавиатура и мышь лежат НА
   поверхности и слегка уходят за переднее ребро, а не висят перед столом. */

const TOP  = ['#5a4a38', '#4d4436', '#33384a', '#2c3550'];
const EDGE = ['#3f3326', '#352e24', '#232735', '#1d2438'];

/* Столешница: трапеция в лёгкой перспективе. Всё, что «лежит на столе»,
   рисуется после неё. */
export function drawSurface(g){
  g.withPop('furniture', (g.L.desk.x0 + g.L.desk.x1) / 2, g.L.floorY, () => surface(g));
}
function surface(g){
  const { ctx, L } = g;
  const F = g.vs('furniture');
  const d = L.desk;

  ctx.fillStyle = TOP[F];
  ctx.beginPath();
  ctx.moveTo(d.x0 + 26, d.top - d.depth);
  ctx.lineTo(d.x1 - 26, d.top - d.depth);
  ctx.lineTo(d.x1, d.top);
  ctx.lineTo(d.x0, d.top);
  ctx.closePath();
  ctx.fill();

  /* дальний край чуть темнее — поверхность читается как плоскость */
  const shade = ctx.createLinearGradient(0, d.top - d.depth, 0, d.top);
  shade.addColorStop(0, 'rgba(0,0,0,.28)');
  shade.addColorStop(1, 'rgba(255,255,255,.05)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(d.x0 + 26, d.top - d.depth);
  ctx.lineTo(d.x1 - 26, d.top - d.depth);
  ctx.lineTo(d.x1, d.top);
  ctx.lineTo(d.x0, d.top);
  ctx.closePath();
  ctx.fill();
}

/* Передний торец и ножки: перекрывают низ клавиатуры и мыши. */
export function drawFront(g){
  g.withPop('furniture', (g.L.desk.x0 + g.L.desk.x1) / 2, g.L.floorY, () => front(g));
}
function front(g){
  const { ctx, L } = g;
  const F = g.vs('furniture');
  const d = L.desk;
  const w = d.x1 - d.x0;

  ctx.fillStyle = 'rgba(255,255,255,.09)';
  ctx.fillRect(d.x0, d.top, w, 2);
  ctx.fillStyle = TOP[F];
  ctx.fillRect(d.x0, d.top + 2, w, d.thick);
  ctx.fillStyle = EDGE[F];
  ctx.fillRect(d.x0, d.top + 2 + d.thick, w, 5);

  const legTop = d.top + d.thick + 7;
  if(F >= 2){                                   // рама вместо тумб
    ctx.fillStyle = '#22262f';
    ctx.fillRect(d.x0 + 26, legTop, d.legW, L.floorY - legTop);
    ctx.fillRect(d.x1 - 26 - d.legW, legTop, d.legW, L.floorY - legTop);
    ctx.fillRect(d.x0 + 26, L.floorY - 8, d.x1 - d.x0 - 52, 8);
  }else{
    ctx.fillStyle = TOP[F];
    ctx.fillRect(d.x0 + 20, legTop, d.legW, L.floorY - legTop);
    ctx.fillRect(d.x1 - 20 - d.legW, legTop, d.legW, L.floorY - legTop);
  }

  /* лента под столешницей появляется вместе с подсветкой */
  if(g.vs('rgb') >= 1){
    ctx.fillStyle = 'rgba(120,180,255,.25)';
    ctx.fillRect(d.x0, d.top + d.thick + 4, w, 2);
  }
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.fillRect(d.x0 + 10, L.floorY, w - 20, 6);
}
