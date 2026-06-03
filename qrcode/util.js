'use strict';

// QR 工具集：BCH 校验、掩码函数、对齐图案位置、纠错多项式、惩罚评分
// 依赖：QRMath, QRPolynomial, QRMode, QRMaskPattern

var QRUtil = {

  // 各 version 的对齐图案中心坐标列表（index = version - 1）
  PATTERN_POSITION_TABLE: [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170],
  ],

  // BCH 生成多项式常量
  G15:      (1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|(1<<0),
  G18:      (1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|(1<<0),
  G15_MASK: (1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1),

  // 格式信息 BCH 校验码（15 位）
  getBCHTypeInfo: function (data) {
    var d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
      d ^= QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15));
    }
    return ((data << 10) | d) ^ QRUtil.G15_MASK;
  },

  // 版本信息 BCH 校验码（18 位，v7+）
  getBCHTypeNumber: function (data) {
    var d = data << 12;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
      d ^= QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18));
    }
    return (data << 12) | d;
  },

  // 整数的二进制位数
  getBCHDigit: function (data) {
    var digit = 0;
    while (data !== 0) { digit++; data >>>= 1; }
    return digit;
  },

  getPatternPosition: function (typeNumber) {
    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
  },

  // 8 种掩码函数
  getMask: function (maskPattern, i, j) {
    switch (maskPattern) {
      case QRMaskPattern.PATTERN000: return (i + j) % 2 === 0;
      case QRMaskPattern.PATTERN001: return i % 2 === 0;
      case QRMaskPattern.PATTERN010: return j % 3 === 0;
      case QRMaskPattern.PATTERN011: return (i + j) % 3 === 0;
      case QRMaskPattern.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case QRMaskPattern.PATTERN101: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case QRMaskPattern.PATTERN110: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      case QRMaskPattern.PATTERN111: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
      default: throw new Error('bad maskPattern: ' + maskPattern);
    }
  },

  // 生成 RS 纠错多项式
  getErrorCorrectPolynomial: function (errorCorrectLength) {
    var a = new QRPolynomial([1], 0);
    for (var i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  },

  // 数据长度字段的位数（因 version 区间而异）
  getLengthInBits: function (mode, type) {
    if (type >= 1 && type < 10) {
      switch (mode) {
        case QRMode.MODE_NUMBER:    return 10;
        case QRMode.MODE_ALPHA_NUM: return 9;
        case QRMode.MODE_8BIT_BYTE: return 8;
        case QRMode.MODE_KANJI:     return 8;
      }
    } else if (type < 27) {
      switch (mode) {
        case QRMode.MODE_NUMBER:    return 12;
        case QRMode.MODE_ALPHA_NUM: return 11;
        case QRMode.MODE_8BIT_BYTE: return 16;
        case QRMode.MODE_KANJI:     return 10;
      }
    } else {
      switch (mode) {
        case QRMode.MODE_NUMBER:    return 14;
        case QRMode.MODE_ALPHA_NUM: return 13;
        case QRMode.MODE_8BIT_BYTE: return 16;
        case QRMode.MODE_KANJI:     return 12;
      }
    }
    throw new Error('mode: ' + mode);
  },

  // 计算掩码惩罚分数（用于选最优掩码）
  getLostPoint: function (qrCode) {
    var n = qrCode.getModuleCount();
    var lost = 0;

    // 规则1：连续同色行/列
    for (var row = 0; row < n; row++) {
      for (var col = 0; col < n; col++) {
        var same = 0;
        var dark = qrCode.isDark(row, col);
        for (var r = -1; r <= 1; r++) {
          if (row + r < 0 || n <= row + r) continue;
          for (var c = -1; c <= 1; c++) {
            if (col + c < 0 || n <= col + c) continue;
            if (r === 0 && c === 0) continue;
            if (dark === qrCode.isDark(row + r, col + c)) same++;
          }
        }
        if (same > 5) lost += 3 + same - 5;
      }
    }

    // 规则2：2×2 同色块
    for (var row = 0; row < n - 1; row++) {
      for (var col = 0; col < n - 1; col++) {
        var cnt = 0;
        if (qrCode.isDark(row,   col))   cnt++;
        if (qrCode.isDark(row+1, col))   cnt++;
        if (qrCode.isDark(row,   col+1)) cnt++;
        if (qrCode.isDark(row+1, col+1)) cnt++;
        if (cnt === 0 || cnt === 4) lost += 3;
      }
    }

    // 规则3：类定位图案序列
    for (var row = 0; row < n; row++) {
      for (var col = 0; col < n - 6; col++) {
        if (qrCode.isDark(row,col) && !qrCode.isDark(row,col+1) &&
            qrCode.isDark(row,col+2) && qrCode.isDark(row,col+3) &&
            qrCode.isDark(row,col+4) && !qrCode.isDark(row,col+5) &&
            qrCode.isDark(row,col+6)) lost += 40;
      }
    }
    for (var col = 0; col < n; col++) {
      for (var row = 0; row < n - 6; row++) {
        if (qrCode.isDark(row,col) && !qrCode.isDark(row+1,col) &&
            qrCode.isDark(row+2,col) && qrCode.isDark(row+3,col) &&
            qrCode.isDark(row+4,col) && !qrCode.isDark(row+5,col) &&
            qrCode.isDark(row+6,col)) lost += 40;
      }
    }

    // 规则4：深色模块比例偏离 50% 的程度
    var darkCount = 0;
    for (var col = 0; col < n; col++) {
      for (var row = 0; row < n; row++) {
        if (qrCode.isDark(row, col)) darkCount++;
      }
    }
    lost += Math.abs((100 * darkCount) / n / n - 50) / 5 * 10;

    return lost;
  },
};
