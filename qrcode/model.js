'use strict';

// QR 码数据模型：布置所有功能图案、编码数据、选最优掩码
// 依赖：QR8bitByte, QRUtil, QRRSBlock, QRBitBuffer

function QRCodeModel(typeNumber, errorCorrectLevel) {
  this.typeNumber       = typeNumber;
  this.errorCorrectLevel = errorCorrectLevel;
  this.modules          = null;
  this.moduleCount      = 0;
  this.dataCache        = null;
  this.dataList         = [];
}

QRCodeModel.PAD0 = 0xEC;
QRCodeModel.PAD1 = 0x11;

QRCodeModel.prototype = {

  addData: function (data, binary, utf8WithoutBOM) {
    this.dataList.push(new QR8bitByte(data, binary, utf8WithoutBOM));
    this.dataCache = null;
  },

  isDark: function (row, col) {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(row + ',' + col);
    }
    return this.modules[row][col][0];
  },

  getEye: function (row, col) {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(row + ',' + col);
    }
    var block = this.modules[row][col]; // [isDark, 'O'|'I'|undefined, 'TL'|'TR'|'BL'|'A'|undefined]
    if (!block[1]) return null;
    var type = block[2] === 'A' ? ('A' + block[1]) : ('P' + block[1] + '_' + block[2]);
    return { isDark: block[0], type: type };
  },

  getModuleCount: function () {
    return this.moduleCount;
  },

  make: function () {
    this.makeImpl(false, this.getBestMaskPattern());
  },

  makeImpl: function (test, maskPattern) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = [];
    for (var i = 0; i < this.moduleCount; i++) {
      this.modules[i] = [];
      for (var j = 0; j < this.moduleCount; j++) this.modules[i][j] = [];
    }

    this.setupPositionProbePattern(0, 0, 'TL');
    this.setupPositionProbePattern(this.moduleCount - 7, 0, 'BL');
    this.setupPositionProbePattern(0, this.moduleCount - 7, 'TR');
    this.setupPositionAdjustPattern('A');
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);
    if (this.typeNumber >= 7) this.setupTypeNumber(test);

    if (!this.dataCache) {
      this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    }
    this.mapData(this.dataCache, maskPattern);
  },

  // 布置 7×7 定位图案（含 1 模块分隔带）
  setupPositionProbePattern: function (row, col, posName) {
    for (var r = -1; r <= 7; r++) {
      if (row + r < 0 || this.moduleCount <= row + r) continue;
      for (var c = -1; c <= 7; c++) {
        if (col + c < 0 || this.moduleCount <= col + c) continue;
        var isDark = (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        );
        this.modules[row+r][col+c][0] = isDark;
        if (isDark) {
          this.modules[row+r][col+c][2] = posName;
          this.modules[row+r][col+c][1] = (r===0||r===6||c===0||c===6) ? 'O' : 'I';
        }
      }
    }
  },

  // 选择惩罚分最低的掩码
  getBestMaskPattern: function () {
    var minLost = 0, pattern = 0;
    for (var i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      var lost = QRUtil.getLostPoint(this);
      if (i === 0 || lost < minLost) { minLost = lost; pattern = i; }
    }
    return pattern;
  },

  // 水平 + 垂直时序图案（row/col 6，交替深浅）
  setupTimingPattern: function () {
    for (var i = 8; i < this.moduleCount - 8; i++) {
      if (this.modules[i][6][0] == null) this.modules[i][6][0] = (i % 2 === 0);
      if (this.modules[6][i][0] == null) this.modules[6][i][0] = (i % 2 === 0);
    }
  },

  // 对齐图案（5×5）
  setupPositionAdjustPattern: function (posName) {
    var pos = QRUtil.getPatternPosition(this.typeNumber);
    for (var i = 0; i < pos.length; i++) {
      for (var j = 0; j < pos.length; j++) {
        var row = pos[i], col = pos[j];
        if (this.modules[row][col][0] != null) continue;
        for (var r = -2; r <= 2; r++) {
          for (var c = -2; c <= 2; c++) {
            var isDark = (r===-2||r===2||c===-2||c===2||(r===0&&c===0));
            this.modules[row+r][col+c][0] = isDark;
            if (isDark) {
              this.modules[row+r][col+c][2] = posName;
              this.modules[row+r][col+c][1] = (r===-2||r===2||c===-2||c===2) ? 'O' : 'I';
            }
          }
        }
      }
    }
  },

  // 版本信息（v7+，18 位 BCH）
  setupTypeNumber: function (test) {
    var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
    for (var i = 0; i < 18; i++) {
      var mod = !test && ((bits >> i) & 1) === 1;
      this.modules[Math.floor(i/3)][(i%3) + this.moduleCount - 8 - 3][0] = mod;
      this.modules[(i%3) + this.moduleCount - 8 - 3][Math.floor(i/3)][0] = mod;
    }
  },

  // 格式信息（15 位 BCH，紧邻定位图案）
  setupTypeInfo: function (test, maskPattern) {
    var bits = QRUtil.getBCHTypeInfo((this.errorCorrectLevel << 3) | maskPattern);
    for (var i = 0; i < 15; i++) {
      var mod = !test && ((bits >> i) & 1) === 1;
      if      (i < 6) this.modules[i][8][0] = mod;
      else if (i < 8) this.modules[i+1][8][0] = mod;
      else            this.modules[this.moduleCount - 15 + i][8][0] = mod;

      if      (i < 8) this.modules[8][this.moduleCount - i - 1][0] = mod;
      else if (i < 9) this.modules[8][15 - i][0] = mod;
      else            this.modules[8][15 - i - 1][0] = mod;
    }
    this.modules[this.moduleCount - 8][8][0] = !test; // 固定暗模块
  },

  // 将数据字节按 Z 字形写入空余模块，并应用掩码
  mapData: function (data, maskPattern) {
    var inc = -1, row = this.moduleCount - 1, bitIndex = 7, byteIndex = 0;
    for (var col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (var c = 0; c < 2; c++) {
          if (this.modules[row][col-c][0] == null) {
            var dark = (byteIndex < data.length) ? ((data[byteIndex] >>> bitIndex) & 1) === 1 : false;
            if (QRUtil.getMask(maskPattern, row, col-c)) dark = !dark;
            this.modules[row][col-c][0] = dark;
            if (--bitIndex < 0) { byteIndex++; bitIndex = 7; }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) { row -= inc; inc = -inc; break; }
      }
    }
  },
};

// ── 静态方法：数据编码与 RS 纠错 ────────────────────────────────────────────

QRCodeModel.createData = function (typeNumber, errorCorrectLevel, dataList) {
  var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
  var buffer   = new QRBitBuffer();

  for (var i = 0; i < dataList.length; i++) {
    var data = dataList[i];
    buffer.put(data.mode, 4);
    buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
    data.write(buffer);
  }

  var totalDataCount = 0;
  for (var i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;

  if (buffer.getLengthInBits() > totalDataCount * 8) {
    throw new Error('code length overflow (' + buffer.getLengthInBits() + '>' + totalDataCount * 8 + ')');
  }
  if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
  while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);
  while (buffer.getLengthInBits() < totalDataCount * 8) {
    buffer.put(QRCodeModel.PAD0, 8);
    if (buffer.getLengthInBits() < totalDataCount * 8) buffer.put(QRCodeModel.PAD1, 8);
  }

  return QRCodeModel.createBytes(buffer, rsBlocks);
};

QRCodeModel.createBytes = function (buffer, rsBlocks) {
  var maxDc = 0, maxEc = 0;
  var dcdata = [], ecdata = [];
  var offset = 0;

  for (var r = 0; r < rsBlocks.length; r++) {
    var dcCount = rsBlocks[r].dataCount;
    var ecCount = rsBlocks[r].totalCount - dcCount;
    maxDc = Math.max(maxDc, dcCount);
    maxEc = Math.max(maxEc, ecCount);

    dcdata[r] = [];
    for (var i = 0; i < dcCount; i++) dcdata[r][i] = 0xFF & buffer.buffer[i + offset];
    offset += dcCount;

    var rsPoly  = QRUtil.getErrorCorrectPolynomial(ecCount);
    var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
    var modPoly = rawPoly.mod(rsPoly);
    ecdata[r] = [];
    for (var i = 0; i < ecCount; i++) {
      var idx = i + modPoly.getLength() - ecCount;
      ecdata[r][i] = (idx >= 0) ? modPoly.get(idx) : 0;
    }
  }

  var totalCount = 0;
  for (var i = 0; i < rsBlocks.length; i++) totalCount += rsBlocks[i].totalCount;
  var data = new Array(totalCount), index = 0;

  for (var i = 0; i < maxDc; i++) {
    for (var r = 0; r < rsBlocks.length; r++) {
      if (i < dcdata[r].length) data[index++] = dcdata[r][i];
    }
  }
  for (var i = 0; i < maxEc; i++) {
    for (var r = 0; r < rsBlocks.length; r++) {
      if (i < ecdata[r].length) data[index++] = ecdata[r][i];
    }
  }
  return data;
};
