'use strict';

// Canvas 渲染器：将 QRCodeModel 矩阵绘制到 canvas 元素
// （已裁剪：仅保留 canvas 路径，去除 SVG / Table / Logo / 背景图 / 标题）

var Drawing = (function () {

  function Drawing(el, opt) {
    this._el     = el;
    this._opt    = opt;
    this._canvas = document.createElement('canvas');
    this._el.appendChild(this._canvas);
    this._ctx    = this._canvas.getContext('2d');
  }

  Drawing.prototype.draw = function (qrModel) {
    var opt  = this._opt;
    var n    = qrModel.getModuleCount();
    var cellW = Math.max(1, Math.round(opt.width  / n));
    var cellH = Math.max(1, Math.round(opt.height / n));
    var qz   = opt.quietZone || 0;

    this._canvas.width  = cellW * n + qz * 2;
    this._canvas.height = cellH * n + qz * 2;

    var ctx = this._ctx;
    ctx.fillStyle = opt.colorLight;
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    for (var row = 0; row < n; row++) {
      for (var col = 0; col < n; col++) {
        ctx.fillStyle = qrModel.isDark(row, col) ? opt.colorDark : opt.colorLight;
        ctx.fillRect(col * cellW + qz, row * cellH + qz, cellW, cellH);
      }
    }
  };

  Drawing.prototype.clear = function () {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  };

  Drawing.prototype.remove = function () {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._el.innerHTML = '';
  };

  // 我们不需要 data URL，保留空实现以兼容 QRCode 调用链
  Drawing.prototype.makeImage = function () {};

  return Drawing;
})();
