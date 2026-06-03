'use strict';

// 公开 API：QRCode 类，对外暴露为 window.QRCode
// 依赖：所有其他模块（须最后加载）

function _getUTF8Length(str) {
  return encodeURI(str).replace(/%[0-9a-fA-F]{2}/g, 'a').length;
}

function _getTypeNumber(text, opt) {
  var level  = opt.correctLevel;
  var length = _getUTF8Length(text);
  var type   = 1;

  for (var i = 0; i < QRCodeLimitLength.length; i++) {
    var limit;
    switch (level) {
      case QRErrorCorrectLevel.L: limit = QRCodeLimitLength[i][0]; break;
      case QRErrorCorrectLevel.M: limit = QRCodeLimitLength[i][1]; break;
      case QRErrorCorrectLevel.Q: limit = QRCodeLimitLength[i][2]; break;
      case QRErrorCorrectLevel.H: limit = QRCodeLimitLength[i][3]; break;
    }
    if (length <= limit) break;
    type++;
  }

  if (type > QRCodeLimitLength.length) throw new Error('Data too long');

  if (opt.version > 0 && type <= opt.version) type = opt.version;
  opt.runVersion = type;
  return type;
}

function QRCode(el, options) {
  // 默认选项
  this._opt = {
    width:          256,
    height:         256,
    correctLevel:   QRErrorCorrectLevel.H,
    colorDark:      '#000000',
    colorLight:     '#ffffff',
    quietZone:      0,
    version:        0,       // 0 = 自动选择
    utf8WithoutBOM: true,
    binary:         false,
    dotScale:       1,
    dotScaleTiming: 1,
    titleHeight:    0,
  };

  if (typeof options === 'string') options = { text: options };
  if (options) {
    for (var k in options) this._opt[k] = options[k];
  }

  // 统一化
  this._opt.width     = Math.round(this._opt.width);
  this._opt.height    = Math.round(this._opt.height);
  this._opt.quietZone = Math.round(this._opt.quietZone || 0);

  if (typeof el === 'string') el = document.getElementById(el);
  this._el      = el;
  this._qrModel = null;

  // 克隆选项传给 Drawing，避免被 _getTypeNumber 修改后污染
  var drawOpt = {};
  for (var k in this._opt) drawOpt[k] = this._opt[k];
  this._drawing = new Drawing(this._el, drawOpt);

  if (this._opt.text) this.makeCode(this._opt.text);
}

QRCode.prototype.makeCode = function (text) {
  this._qrModel = new QRCodeModel(
    _getTypeNumber(text, this._opt),
    this._opt.correctLevel
  );
  this._qrModel.addData(text, this._opt.binary, this._opt.utf8WithoutBOM);
  this._qrModel.make();
  this._drawing.draw(this._qrModel);

  // 向下兼容：_oQRCode 是 app.js 访问矩阵数据的入口
  this._oQRCode = this._qrModel;
};

QRCode.prototype.clear = function () {
  this._drawing.remove();
};

// 纠错等级常量挂载到类上，方便外部使用 QRCode.CorrectLevel.M
QRCode.CorrectLevel = QRErrorCorrectLevel;

window.QRCode = QRCode;
