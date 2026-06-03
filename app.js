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

  // 预置 16 个随机载荷（48字节随机数据的大写十六进制），每次刷新从中选一个，
  // 且保证与上一次使用的不同。
  const PAYLOADS = [
    '56E1904195A327BF4079EDF2C6193A8E4CE19F4B2AB949CBE76D4013B79EF71DDE309821394482EA6B479A18FF2C0128A7D3F081B4E92C56F7A038D1E4B9C25F80A3D7E14B96C20F5D8A31E7B4C9F26D0A58E3B71C4F9D2A06E58B3C17F4D9A0',
    'A3F82C017D6E94B05E2F1A8C3D7B4E9F6A1C5D8B2E0F7A493C6D1E8B5F20A3C7D4E9B1F6A8C230D5E7B4F1A9C6D3E0B5C8D2F1A7E0943C6D5B1F8A2E07C4D9B3F6A1E85C70D4B2F9A8E1C35D7F0B6A4E9C2D1F8B7A0E345C9D6B2F1A8E70C',
    '1B7E3F9A2C8D4E6F0A5B9C3D7E1F4A8B2C6D0E5F9A3B7C1D4E8F2A6B0C5D9E3F7A1B8C2D6E0F4A9B3C7D1E5F8A2B4C6D9F2A1B7E0C3D5F8A2B4E1C7D09F3A6B5E2C4D7F0A9B1E6C3D8F5A0B4E9C2D6F1A7B3E0C5D4F8A2B9E1C70D3F6A',
    'C4D8F1A5B9E2F6A0B3C7D1E5F9A2B6C0D4E8F3A7B1C5D9E0F4A8B2C6D3E7F1A9B5C2D6E0F8A4B7C1D5E9F3A0B8C2D6E4F7A1B0C3D9F5A2B8E1C4D0F6A7B3E5C1D8F2A9B4E7C0D5F3A1B6E4C2D9F8A0B7E3C6D1F5A4B0E8C3D7F9A2B1E6C5',
    '7F2A6B1C8D3E9F4A0B5C2D7E4F1A8B6C3D0E5F9A2B7C4D1E6F8A3B0C9D5E2F7A4B1C6D8E3F0A9B5C7D2E6F1A4B8C3D5E9F2A0B7C1D4E6F8A3B0C5D2E7F4A9B1C6D3E0F5A8B2C4D7F1A9B5E3C0D6F4A2B8E1C7D5F9A3B0E6C4D2F8A1B7E5C3',
    'E9B3F7A1C5D2E6F0A8B4C1D9E3F5A7B2C0D6E4F8A1B9C5D3E7F2A0B6C4D1E8F3A5B7C2D0E9F6A4B1C8D5E2F7A3B0C6D4F8A2B1E5C9D0F3A7B4E2C6D1F9A5B8E0C3D7F4A1B6E9C2D5F0A8B3E7C1D4F6A2B9E5C0D8F3A7B1E4C6D0F5A9B2E8C4',
    '3D1E8F4A9B2C6D0E5F7A3B8C1D4E9F2A6B0C5D3E7F1A8B4C9D2E6F0A4B7C3D5E2F9A1B6C8D0E4F7A2B5C1D9E3F6A0B8C4D7F1A2B5E9C3D0F6A4B1E8C7D2F5A9B3E0C1D4F7A6B2E5C9D3F0A8B4E1C6D7F2A5B9E0C4D8F3A1B6E7C5D9F2A0B3',
    'B5C9D2E7F1A4B0C6D3E8F5A1B7C2D0E9F4A6B3C7D1E5F8A2B9C4D6E0F3A7B5C1D4E8F2A6B0C9D7E3F1A5B2C8D4E6F0A3B7C5D1F8A2B4E9C6D0F5A3B7E1C4D8F2A9B5E0C3D1F7A6B4E2C9D5F3A0B8E7C1D4F6A2B5E3C0D9F4A1B6E8C7D3F5A2',
    '6A0B4C8D1E5F9A3B7C2D6E0F4A1B8C5D9E3F7A2B6C4D0E8F1A5B9C3D7E2F6A4B0C1D5E9F3A7B2C8D4E0F6A1B5C9D3E7F2A4B0C8D1F5A9B3E6C0D4F7A2B1E5C8D3F9A6B0E4C7D2F1A5B8E3C6D0F4A9B7E1C5D3F8A0B4E6C2D9F5A3B7E0C1D8F4',
    'F3A7B1C5D9E2F6A0B4C8D3E7F1A5B9C2D6E0F4A8B3C7D1E5F9A2B6C4D0E8F5A1B7C3D9E2F6A4B0C5D8E1F3A7B2C6D4E0F8A1B9C3D5F7A2B0E6C4D1F9A5B8E3C0D7F4A2B6E1C5D3F9A8B0E4C7D2F6A1B5E8C3D0F4A9B7E2C6D1F5A3B8E0C4D7F9',
    '2C6D0E4F8A1B5C9D3E7F2A6B0C4D8E1F5A9B3C7D2E6F0A4B8C1D5E9F3A7B2C0D6E4F1A5B9C3D7E0F8A2B6C4D1E5F9A3B7C0D2F6A4B1E8C5D9F3A0B7E4C2D6F1A9B5E0C3D7F4A1B8E5C6D0F9A2B4E7C1D3F8A0B6E5C9D2F7A1B4E3C0D8F5A9B2E6',
    '8E2F6A4B0C5D9E1F3A7B2C8D4E0F6A1B5C9D3E7F2A6B0C4D8E3F7A1B5C2D6E0F9A4B8C1D5E3F7A2B6C0D4E8F1A5B9C3D7E2F0A6B4C1D9F5A3B8E2C6D0F4A7B1E9C5D3F8A0B6E4C2D7F1A9B5E3C8D0F6A4B2E7C1D5F9A3B0E8C4D6F2A1B7E5C9D3',
    '4A8B3C7D1E6F2A5B9C0D4E8F1A6B2C7D3E0F5A9B4C1D8E2F6A0B5C9D3E7F1A4B8C2D6E0F3A7B1C5D9E4F2A6B0C8D5E1F7A3B9C4D2F6A0B5E8C1D3F7A4B2E9C6D0F1A5B8E3C7D4F2A9B0E6C1D5F8A3B7E2C4D9F6A1B0E5C3D8F2A7B4E1C6D0F9A5B3E7',
    'D0E5F9A3B7C2D6E1F4A8B0C5D9E3F7A1B6C2D4E8F0A5B9C3D7E2F6A1B4C0D8E5F3A7B2C6D1E9F4A0B8C5D3E7F2A6B1C4D8F0A2B5E9C3D7F1A4B6E0C2D5F8A9B3E1C7D4F6A0B2E5C8D1F3A9B7E4C0D6F2A5B1E3C9D7F0A4B8E2C6D5F1A3B9E0C7D4F8',
    '9C3D7E2F5A1B8C4D0E6F9A3B7C1D5E2F8A4B0C6D3E7F1A9B5C2D8E0F4A6B3C7D1E5F9A2B6C4D0E8F5A1B7C3D2E6F0A4B9C5D1F8A3B6E0C2D7F4A1B5E9C3D8F0A6B2E4C1D9F7A3B5E0C8D2F6A4B1E7C0D5F3A9B8E2C6D4F1A0B5E7C3D9F2A6B4E1C8D0',
    '5F8A2B6C0D4E1F7A3B9C5D2E8F0A6B4C1D7E3F9A5B2C6D0E4F8A1B7C3D5E2F6A0B9C4D8E1F3A7B5C2D6E0F4A8B1C9D3E7F2A4B0C6D1F9A5B3E8C7D2F0A4B6E1C5D3F9A7B0E4C2D8F6A1B5E3C9D0F4A7B2E6C1D5F8A3B0E7C4D9F2A6B1E5C3D8F0A7B4E9',
  ];
  let _lastIdx = typeof drawQR._lastIdx === 'number' ? drawQR._lastIdx : -1;
  let idx;
  do { idx = Math.floor(Math.random() * PAYLOADS.length); } while (idx === _lastIdx);
  drawQR._lastIdx = idx;
  const payload = PAYLOADS[idx];

  // 借助 EasyQRCodeJS 生成真实的 QR 矩阵（Reed-Solomon + 最优掩码）
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;visibility:hidden';
  document.body.appendChild(tmp);

  const qr = new QRCode(tmp, {
    text:         payload,
    width:        10,
    height:       10,
    correctLevel: QRCode.CorrectLevel.M,
    version:      10,     // 192字符字母数字，version 10 (57×57模块)
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
