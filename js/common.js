// 公共工具函数 - H5版本（兼容微信浏览器）

// Toast 提示
function showToast(msg, duration) {
  if (!duration) duration = 2000;
  var toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
  }, duration);
}

// 从联系字符串中提取电话号码（支持手机号和座机号）
function extractPhone(contactStr) {
  if (!contactStr) return { name: '', phone: '', phones: [], displayText: '' };
  
  var phones = [];
  
  // 提取手机号
  var mobileMatch = contactStr.match(/1[3-9]\d{9}/g);
  if (mobileMatch) {
    for (var i = 0; i < mobileMatch.length; i++) {
      var m = mobileMatch[i];
      if (phones.indexOf(m) === -1) {
        phones.push(m);
      }
    }
  }
  
  // 提取座机号
  var remaining = contactStr;
  if (mobileMatch) {
    for (var j = 0; j < mobileMatch.length; j++) {
      remaining = remaining.replace(mobileMatch[j], '');
    }
  }
  
  var landlineRegex = /(?:\(?0\d{2,3}\)?[-\s]?)?\d{7,8}/g;
  var landlineMatch = remaining.match(landlineRegex);
  if (landlineMatch) {
    for (var k = 0; k < landlineMatch.length; k++) {
      var l = landlineMatch[k].trim();
      if (l.length >= 7 && l.length <= 20) {
        var normalized = l.replace(/\s/g, '');
        if (phones.indexOf(normalized) === -1) {
          phones.push(normalized);
        }
      }
    }
  }
  
  // 提取姓名/部门名称
  var name = '';
  var deptMatch = contactStr.match(/[\u4e00-\u9fa5A-Za-z]+(?:部|经理|普惠|公司|零贷)/);
  if (deptMatch) {
    name = deptMatch[0];
  }
  if (!name) {
    var nameMatch = contactStr.match(/[\u4e00-\u9fa5]{2,4}/);
    if (nameMatch) {
      name = nameMatch[0];
    }
  }
  if (!name) {
    name = contactStr;
  }
  
  var phone = phones.length > 0 ? phones[0] : '';
  
  return { 
    name: name, 
    phone: phone, 
    phones: phones,
    displayText: contactStr 
  };
}

// 从产品特点中提取标签
function extractFeatures(featuresStr) {
  if (!featuresStr) return [];
  var raw = featuresStr.split(/[，,。；;、\s]+/);
  var features = [];
  for (var i = 0; i < raw.length; i++) {
    var f = raw[i].trim();
    if (f && f.length <= 12) {
      features.push(f);
    }
  }
  return features.slice(0, 4);
}

// 拨打电话
function callPhone(phone) {
  if (!phone) {
    showToast('暂无联系电话');
    return;
  }
  window.location.href = 'tel:' + phone;
}

// 复制到剪贴板
function copyToClipboard(text) {
  if (!text) {
    showToast('暂无内容');
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('已复制');
    }).catch(function() {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('已复制');
  } catch (e) {
    showToast('复制失败');
  }
  document.body.removeChild(textarea);
}

// 生成年份范围
function generateYearRange() {
  var currentYear = new Date().getFullYear();
  var years = [];
  for (var y = currentYear; y >= 1980; y--) {
    years.push(y + '年');
  }
  return years;
}

// 存储管理
var Store = {
  set: function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  },
  get: function(key) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  },
  remove: function(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
};
