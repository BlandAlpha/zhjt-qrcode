'use strict';

// GF(256) 伽罗华域运算，用于 Reed-Solomon 纠错
var QRMath = {
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256),

  gexp: function (n) {
    while (n < 0)   n += 255;
    while (n >= 256) n -= 255;
    return QRMath.EXP_TABLE[n];
  },

  glog: function (n) {
    if (n < 1) throw new Error('glog(' + n + ')');
    return QRMath.LOG_TABLE[n];
  },
};

// 初始化指数表（本原多项式 x^8 + x^4 + x^3 + x^2 + 1）
for (var i = 0; i < 8; i++) {
  QRMath.EXP_TABLE[i] = 1 << i;
}
for (var i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] =
    QRMath.EXP_TABLE[i - 4] ^
    QRMath.EXP_TABLE[i - 5] ^
    QRMath.EXP_TABLE[i - 6] ^
    QRMath.EXP_TABLE[i - 8];
}

// 由指数表反推对数表
for (var i = 0; i < 255; i++) {
  QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
}
