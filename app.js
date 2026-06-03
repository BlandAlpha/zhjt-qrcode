/* ---------- 有效期至：当前时间 +3 天，时间随机生成一次 ---------- */
function setExpire() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  // 随机时间：时 8-22，分/秒随机
  const h = 8 + Math.floor(Math.random() * 15);
  const m = Math.floor(Math.random() * 60);
  const s = Math.floor(Math.random() * 60);
  d.setHours(h, m, s, 0);
  const p = n => String(n).padStart(2, '0');
  const str = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
            + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  document.getElementById('expire').textContent = str;
}

/* ---------- 真实二维码绘制（EasyQRCodeJS 提供矩阵，自行渲染） ---------- */
function drawQR() {
  const canvas = document.getElementById('qr');
  const ctx    = canvas.getContext('2d');
  const SZ     = canvas.width;
  const COLOR  = '#6c6c6c';
  const QUIET  = 3; // 静区模块数

  // 每次生成不同随机载荷，使二维码内容每次刷新都不同。
  // 填充约 250 字节随机数据，使版本自动提升、整张矩阵都是伪随机模块，
  // 避免大片填充字节产生的规则斜纹。
  let rand = '';
  while (rand.length < 250) rand += Math.random().toString(36).slice(2).toUpperCase();
  const payload = 'ZHJT-' + rand.slice(0, 250);

  // 借助 EasyQRCodeJS 生成真实的 QR 矩阵（Reed-Solomon + 最优掩码）
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;visibility:hidden';
  document.body.appendChild(tmp);

  const qr = new QRCode(tmp, {
    text:         payload,
    width:        10,
    height:       10,
    correctLevel: QRCode.CorrectLevel.M,
    version:      7,      // 最低版本，载荷较大时自动升版
    quietZone:    0,
  });

  const model = qr._oQRCode;
  const N     = model.getModuleCount(); // 45
  document.body.removeChild(tmp);

  // 计算单元格尺寸（含静区）
  const CELL = SZ / (N + QUIET * 2);
  const px   = i => (i + QUIET) * CELL;

  // 绘制背景
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SZ, SZ);

  // 绘制所有模块
  ctx.fillStyle = COLOR;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (model.isDark(r, c)) {
        ctx.fillRect(px(c), px(r), CELL + 0.5, CELL + 0.5);
      }
    }
  }
}

/* ---------- 300 秒倒计时 ---------- */
let count = 300;
let timer = null;
const countEl = document.getElementById('count');

function startCountdown() {
  clearInterval(timer);
  count = 300;
  countEl.textContent = count;
  timer = setInterval(() => {
    count--;
    if (count <= 0) { count = 0; clearInterval(timer); }
    countEl.textContent = count;
  }, 1000);
}

/* ---------- 刷新：~0.5s 延迟后换码 + 重置倒计时 ---------- */
function onRefresh() {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('loading', 'spin');
  clearInterval(timer);
  setTimeout(() => {
    drawQR();
    startCountdown();
    btn.classList.remove('loading', 'spin');
  }, 500);
}

/* ---------- 简易提示 ---------- */
let toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1200);
}

/* ---------- 用户名编辑 ---------- */
function initUserNameEdit() {
  const userNameEdit    = document.getElementById('userNameEdit');
  const userNameDisplay = userNameEdit.querySelector('.user-name-display');
  const userNameInput   = document.getElementById('userNameInput');

  userNameEdit.addEventListener('click', () => {
    if (!userNameEdit.classList.contains('editing')) {
      const tn = Array.from(userNameDisplay.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
      userNameInput.value = tn ? tn.textContent.trim() : '';
      userNameEdit.classList.add('editing');
      userNameInput.focus();
      userNameInput.select();
    }
  });

  function saveUserName() {
    const newName = userNameInput.value.trim() || '用户名';
    // 只更新文字节点，保留 SVG 图标
    const textNode = Array.from(userNameDisplay.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = newName;
    } else {
      userNameDisplay.insertBefore(document.createTextNode(newName), userNameDisplay.firstChild);
    }
    userNameEdit.classList.remove('editing');
  }

  userNameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  saveUserName();
    if (e.key === 'Escape') userNameEdit.classList.remove('editing');
  });

  userNameInput.addEventListener('blur', () => {
    setTimeout(() => {
      if (userNameEdit.classList.contains('editing')) saveUserName();
    }, 0);
  });
}

/* ---------- 初始化 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setExpire();
  drawQR();
  startCountdown();
  initUserNameEdit();
});
