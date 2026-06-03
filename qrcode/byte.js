'use strict';

// 8-bit 字节编码段，将字符串转换为 UTF-8 字节序列
// 依赖：QRMode

function QR8bitByte(data, binary, utf8WithoutBOM) {
  this.mode = QRMode.MODE_8BIT_BYTE;
  this.data = data;

  if (binary) {
    // 二进制模式：直接取字符编码
    this.parsedData = [];
    for (var i = 0; i < data.length; i++) {
      this.parsedData.push(data.charCodeAt(i));
    }
  } else {
    this.parsedData = toUTF8Array(data);
  }

  // 不带 BOM 的 UTF-8 才不加前缀
  if (!utf8WithoutBOM && this.parsedData.length !== this.data.length) {
    this.parsedData.unshift(0xEF, 0xBB, 0xBF);
  }
}

QR8bitByte.prototype = {
  getLength: function () {
    return this.parsedData.length;
  },
  write: function (buffer) {
    for (var i = 0; i < this.parsedData.length; i++) {
      buffer.put(this.parsedData[i], 8);
    }
  },
};

function toUTF8Array(str) {
  var utf8 = [];
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    if (code < 0x80) {
      utf8.push(code);
    } else if (code < 0x800) {
      utf8.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
    } else if (code < 0xD800 || code >= 0xE000) {
      utf8.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
    } else {
      // 代理对（surrogate pair）
      i++;
      code = 0x10000 + (((code & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
      utf8.push(
        0xF0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3F),
        0x80 | ((code >> 6)  & 0x3F),
        0x80 | (code & 0x3F)
      );
    }
  }
  return utf8;
}
