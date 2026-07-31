// utils/matcher.js
// 贷款产品智能匹配引擎 - JavaScript版本（ES5兼容，支持微信浏览器）
// 基于《黄石市民营企业贷款产品智能匹配规则》实现

// 获取产品列表（延迟获取，确保页面加载完成后 products 已就绪）
function getProducts() {
  if (typeof window !== 'undefined' && window.Products) {
    return window.Products;
  }
  if (typeof require !== 'undefined') {
    return require('./products.js');
  }
  return [];
}

// ============================================================
// 工具函数
// ============================================================
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  var s = String(amountStr).replace(/\s|,/g, '');
  var nums = s.match(/(\d+(?:\.\d+)?)/g);
  if (!nums) return 99999;

  var maxVal = 0;
  for (var i = 0; i < nums.length; i++) {
    var n = nums[i];
    var val = parseFloat(n);
    if (s.indexOf('亿') > -1 && val < 1000) {
      val *= 10000;
    }
    if (val > maxVal) maxVal = val;
  }
  return maxVal > 0 ? maxVal : 99999;
}

function parseTerm(termStr) {
  if (!termStr) return 0;
  var s = String(termStr).replace(/\s/g, '');
  
  // 中文数字映射
  var cnNums = { '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '半': 0.5 };
  
  // 把中文数字替换成阿拉伯数字（如 "一年" -> "1年"）
  for (var cn in cnNums) {
    if (cnNums.hasOwnProperty(cn)) {
      // 处理 "十年" -> "10年"，"十二个月" -> "12个月"
      s = s.replace(new RegExp(cn, 'g'), String(cnNums[cn]));
    }
  }
  // 处理 "十二"、"二十" 等组合（简单处理）
  s = s.replace(/10([1-9])/g, function(m, n) { return String(10 + parseInt(n)); });
  s = s.replace(/([2-9])10/g, function(m, n) { return String(parseInt(n) * 10); });
  
  var allTerms = [];
  
  // 按句子分隔符拆分（逗号、顿号、分号、句号）
  var segments = s.split(/[，,、；;。]/);
  for (var si = 0; si < segments.length; si++) {
    var seg = segments[si];
    if (!seg) continue;
    
    // 查找数字+单位的组合
    var matches = seg.match(/(\d+(?:\.\d+)?)\s*(年|个月|月|个季度|季度|天|日)/g);
    if (matches) {
      for (var mi = 0; mi < matches.length; mi++) {
        var m = matches[mi];
        var numMatch = m.match(/(\d+(?:\.\d+)?)/);
        if (!numMatch) continue;
        var val = parseFloat(numMatch[1]);
        
        // 单位换算成年
        if (m.indexOf('个月') > -1 || m.indexOf('月') > -1) {
          val = val / 12;
        } else if (m.indexOf('个季度') > -1 || m.indexOf('季度') > -1) {
          val = val / 4;
        } else if (m.indexOf('天') > -1 || m.indexOf('日') > -1) {
          val = val / 365;
        }
        
        if (val > 0) {
          allTerms.push({ seg: seg, val: val });
        }
      }
    }
  }
  
  // 如果找到了期限
  if (allTerms.length > 0) {
    // 优先级：优先提取"贷款期限"、"单笔业务"相关的
    var loanTerms = [];
    for (var ti = 0; ti < allTerms.length; ti++) {
      var t = allTerms[ti];
      var segText = t.seg;
      // 明确提到"贷款期限"或"单笔业务"或"业务期限"的优先
      if (segText.indexOf('贷款期限') > -1 || segText.indexOf('单笔') > -1 || 
          segText.indexOf('贷款业务期限') > -1 || segText.indexOf('业务期限') > -1) {
        loanTerms.push(t.val);
      }
    }
    
    if (loanTerms.length > 0) {
      var maxLoan = 0;
      for (var li = 0; li < loanTerms.length; li++) {
        if (loanTerms[li] > maxLoan) maxLoan = loanTerms[li];
      }
      return maxLoan;
    }
    
    // 没有明确的贷款期限，取所有期限的最大值
    var maxVal = 0;
    for (var ai = 0; ai < allTerms.length; ai++) {
      if (allTerms[ai].val > maxVal) maxVal = allTerms[ai].val;
    }
    return maxVal;
  }
  
  // 兜底：尝试只找数字
  var nums = s.match(/(\d+(?:\.\d+)?)/g);
  if (nums) {
    var hasYear = s.indexOf('年') > -1;
    var hasMonth = s.indexOf('月') > -1;
    var maxFallback = 0;
    for (var ni = 0; ni < nums.length; ni++) {
      var v = parseFloat(nums[ni]);
      if (hasMonth && !hasYear) {
        v = v / 12;
      }
      if (v > maxFallback) maxFallback = v;
    }
    if (maxFallback > 0) return maxFallback;
  }
  
  return 99;
}

function parseRate(rateStr) {
  if (!rateStr) return 99;
  var s = String(rateStr).replace(/\s/g, '');
  var nums = s.match(/(\d+(?:\.\d+)?)/g);
  if (!nums) return 99;

  for (var i = 0; i < nums.length; i++) {
    var val = parseFloat(nums[i]);
    if (val >= 1 && val <= 20) {
      return val;
    }
  }
  return 99;
}

function parseProcessDays(daysStr) {
  if (!daysStr) return 7;
  var s = String(daysStr).replace(/\s/g, '');
  var nums = s.match(/(\d+)/g);
  if (!nums) return 7;

  var sum = 0;
  for (var i = 0; i < nums.length; i++) {
    sum += parseInt(nums[i]);
  }
  return sum / nums.length;
}

// 数组辅助函数
function arrSome(arr, fn) {
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i], i)) return true;
  }
  return false;
}

function arrFilter(arr, fn) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i], i)) result.push(arr[i]);
  }
  return result;
}

function arrMap(arr, fn) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    result.push(fn(arr[i], i));
  }
  return result;
}

function mathMinArr(arr) {
  var min = arr[0];
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
  }
  return min;
}

function mathMaxArr(arr) {
  var max = arr[0];
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}

// ============================================================
// 产品字段提取函数
// ============================================================
function getBank(p) {
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('银行') > -1 || key.indexOf('机构') > -1) {
        return p[key];
      }
    }
  }
  var vals = [];
  for (var k in p) {
    if (p.hasOwnProperty(k)) vals.push(p[k]);
  }
  return vals.length > 1 ? vals[1] : '';
}

function getProductName(p) {
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('产品名称') > -1 || (key.indexOf('产品') > -1 && key.indexOf('名称') > -1)) {
        return p[key];
      }
    }
  }
  var vals = [];
  for (var k in p) {
    if (p.hasOwnProperty(k)) vals.push(p[k]);
  }
  return vals.length > 2 ? vals[2] : '未知产品';
}

function getTarget(p) {
  var text = '';
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('贷款对象') > -1 || key.indexOf('适用') > -1 || key.indexOf('对象') > -1 || key.indexOf('客户') > -1) {
        text += p[key] + ' ';
      }
    }
  }
  return text;
}

function getConditions(p) {
  var text = '';
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('准入') > -1 || key.indexOf('条件') > -1 || key.indexOf('要求') > -1) {
        text += p[key] + ' ';
      }
    }
  }
  return text;
}

function getGuarantee(p) {
  var text = '';
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('担保') > -1) {
        text += p[key] + ' ';
      }
    }
  }
  return text;
}

function getAmount(p) {
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('额度') > -1 || key.indexOf('金额') > -1) {
        return p[key];
      }
    }
  }
  return '';
}

function getTerm(p) {
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('期限') > -1 || key.indexOf('年限') > -1) {
        return p[key];
      }
    }
  }
  return '';
}

function getRate(p) {
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('利率') > -1 || key.indexOf('利息') > -1) {
        return p[key];
      }
    }
  }
  return '';
}

function getProcess(p) {
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('时限') > -1 || key.indexOf('时效') > -1 || key.indexOf('工作日') > -1) {
        return p[key];
      }
    }
  }
  return '';
}

function getApplication(p) {
  var text = '';
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('申请') > -1 || key.indexOf('流程') > -1 || key.indexOf('渠道') > -1 || key.indexOf('办理') > -1) {
        text += p[key] + ' ';
      }
    }
  }
  return text;
}

function getFeatures(p) {
  var text = '';
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('特点') > -1 || key.indexOf('优势') > -1 || key.indexOf('亮点') > -1 || key.indexOf('特色') > -1) {
        text += p[key] + ' ';
      }
    }
  }
  return text;
}

function getContact(p) {
  for (var key in p) {
    if (p.hasOwnProperty(key)) {
      if (key.indexOf('联系') > -1 || key.indexOf('电话') > -1 || key.indexOf('客户经理') > -1) {
        return p[key];
      }
    }
  }
  return '';
}

// ============================================================
// 五级漏斗匹配
// ============================================================

// 一级筛选：基础准入硬校验
function filterLevel1(answers, products) {
  var filtered = [];
  var rejected = {};

  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var reject = null;
    var bank = getBank(p);
    var target = getTarget(p);
    var conditions = getConditions(p);
    var fullText = target + ' ' + conditions;

    // 3.1.1 经营主体类型校验（宽松处理）
    var entity = answers.entity_type;
    if (fullText.indexOf('仅') > -1) {
      // 简化处理
    }

    // 3.1.2 经营属地校验
    var location = answers.location;
    if (location === '黄石市区') {
      var countyBanks = ['大冶农商', '阳新农商', '大冶泰隆', '大冶中银富登'];
      for (var cb = 0; cb < countyBanks.length; cb++) {
        if (bank.indexOf(countyBanks[cb]) > -1) {
          reject = '经营属地不符（' + bank + '为县域专属机构）';
          break;
        }
      }
    }

    // 3.1.3 企业成立年限校验
    var years = answers.years_established;
    var yearReqs = fullText.match(/(\d+)\s*年/g);
    if (yearReqs) {
      var validYears = arrFilter(arrMap(yearReqs, function(y) { return parseInt(y); }), function(y) { return y > 0 && y <= 10; });
      if (validYears.length > 0) {
        var minYear = mathMinArr(validYears);
        if (years < minYear) {
          reject = '成立年限不足（产品要求经营' + minYear + '年以上）';
        }
      }
    }

    if (years < 0.5) {
      var guarantee1 = getGuarantee(p);
      if (guarantee1.indexOf('信用') > -1 && guarantee1.indexOf('抵押') === -1 && guarantee1.indexOf('质押') === -1) {
        if (!reject) reject = '成立不足6个月，排除纯信用产品';
      }
    }

    // 3.1.4 实际控制人年龄校验
    var age = answers.owner_age;
    var ageMentions = fullText.match(/(\d+)\s*周岁/g);
    if (ageMentions) {
      var ages = arrMap(ageMentions, function(a) { return parseInt(a); });
      if (age < mathMinArr(ages)) {
        reject = '实控人年龄不符合（产品要求' + mathMinArr(ages) + '周岁以上）';
      }
      if (age > 65 && mathMaxArr(ages) <= 65) {
        var guarantee2 = getGuarantee(p);
        if (guarantee2.indexOf('抵押') === -1 && guarantee2.indexOf('质押') === -1) {
          reject = '实控人年龄超65周岁，排除无抵押产品';
        }
      }
    }

    if (age > 70) {
      reject = '实控人年龄超过70周岁';
    }

    // 3.1.5 征信状况校验
    var credit = answers.credit_status;
    if (credit === '有当前不良') {
      var guarantee3 = getGuarantee(p);
      if (guarantee3.indexOf('抵押') === -1 && guarantee3.indexOf('质押') === -1 && guarantee3.indexOf('保证') === -1) {
        reject = '有当前不良记录，排除纯信用产品';
      }
    }

    if (!reject) {
      filtered.push(p);
    } else {
      rejected[getProductName(p)] = reject;
    }
  }

  return { filtered: filtered, rejected: rejected };
}

// 二级匹配：专属资质精准定位
function filterLevel2(answers, products) {
  var qualTags = [];
  var quals = answers.qualifications || [];
  var industry = answers.industry || '';

  // 科创类资质
  var kechuangKeywords = ['高新技术企业', '专精特新', '科技型中小企业', '知识产权'];
  var hasKechuang = arrSome(quals, function(q) {
    return arrSome(kechuangKeywords, function(kw) {
      return q.indexOf(kw) > -1 || kw.indexOf(q) > -1;
    });
  });
  if (hasKechuang || industry.indexOf('科技') > -1 || industry.indexOf('高新') > -1) {
    qualTags.push('科创类');
  }

  // 农业类资质
  var nongyeKeywords = ['农业龙头', '规模种养', '家庭农场', '农民专业合作社'];
  var hasNongye = arrSome(quals, function(q) {
    return arrSome(nongyeKeywords, function(kw) {
      return q.indexOf(kw) > -1 || kw.indexOf(q) > -1;
    });
  });
  if (hasNongye || industry.indexOf('农') > -1 || industry.indexOf('林') > -1 || industry.indexOf('牧') > -1 || industry.indexOf('渔') > -1) {
    qualTags.push('农业类');
  }

  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var pname = getProductName(p);
    var target = getTarget(p);
    var conditions = getConditions(p);
    var features = getFeatures(p);
    var fullText = pname + target + conditions + features;

    var isSpecial = false;
    var specialType = '';

    var kechuangProducts = ['知识价值信用贷', '科创', '科技', '高新', '专精特新', '知识产权质押'];
    for (var k1 = 0; k1 < kechuangProducts.length; k1++) {
      if (fullText.indexOf(kechuangProducts[k1]) > -1) {
        isSpecial = true;
        specialType = '科创专属';
        break;
      }
    }

    if (!isSpecial) {
      var nongyeProducts = ['农贷', '惠农', '农业', '农机', '农资', '养殖', '种植'];
      for (var k2 = 0; k2 < nongyeProducts.length; k2++) {
        if (fullText.indexOf(nongyeProducts[k2]) > -1) {
          isSpecial = true;
          specialType = '农业专属';
          break;
        }
      }
    }

    if (!isSpecial) {
      var chuangyeProducts = ['创业担保', '创保贷', '贴息'];
      for (var k3 = 0; k3 < chuangyeProducts.length; k3++) {
        if (fullText.indexOf(chuangyeProducts[k3]) > -1) {
          isSpecial = true;
          specialType = '贴息/创业担保';
          break;
        }
      }
    }

    p._isSpecial = isSpecial;
    p._specialType = specialType;
    p._qualTags = qualTags;

    var priorityBoost = 0;
    if (isSpecial) {
      if (specialType.indexOf('科创') > -1 && qualTags.indexOf('科创类') > -1) {
        priorityBoost = 100;
      } else if (specialType.indexOf('农业') > -1 && qualTags.indexOf('农业类') > -1) {
        priorityBoost = 100;
      } else if (specialType.indexOf('贴息') > -1) {
        priorityBoost = 50;
      }
    }
    p._priorityBoost = priorityBoost;
  }

  return products;
}

// 三级适配：担保方式对齐
function filterLevel3(answers, products) {
  var filtered = [];
  var userGuarantees = answers.guarantee_types || [];

  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var guarantee = getGuarantee(p);
    var features = getFeatures(p);
    var fullText = guarantee + features;

    var productGuaranteeTypes = [];

    if ((fullText.indexOf('信用') > -1 && fullText.indexOf('无抵押') > -1) || fullText.indexOf('纯信用') > -1) {
      productGuaranteeTypes.push('纯信用');
    } else if (fullText.indexOf('信用') > -1) {
      productGuaranteeTypes.push('纯信用');
    }

    if (fullText.indexOf('抵押') > -1) {
      productGuaranteeTypes.push('不动产抵押');
    }

    if (fullText.indexOf('质押') > -1) {
      productGuaranteeTypes.push('动产/权利质押');
    }

    if (fullText.indexOf('保证') > -1 || fullText.indexOf('担保') > -1) {
      productGuaranteeTypes.push('保证担保');
    }

    if (productGuaranteeTypes.length === 0) {
      filtered.push(p);
      continue;
    }

    var isMatch = false;
    for (var ug = 0; ug < userGuarantees.length; ug++) {
      if (userGuarantees[ug] === '其他') {
        isMatch = true;
        break;
      }
      for (var pg = 0; pg < productGuaranteeTypes.length; pg++) {
        if (userGuarantees[ug].indexOf(productGuaranteeTypes[pg]) > -1 || productGuaranteeTypes[pg].indexOf(userGuarantees[ug]) > -1) {
          isMatch = true;
          break;
        }
      }
      if (isMatch) break;
    }

    if (isMatch) {
      filtered.push(p);
    }
  }

  return filtered;
}

// 四级校验：额度与期限符合性
function filterLevel4(answers, products) {
  var filtered = [];
  var userAmount = answers.loan_amount;
  var userTerm = answers.loan_term;

  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var amountStr = getAmount(p);
    var termStr = getTerm(p);

    var maxAmount = parseAmount(amountStr);
    var maxTerm = parseTerm(termStr);

    var amountOk = maxAmount >= userAmount || maxAmount >= 99999;
    var termOk = maxTerm >= userTerm || maxTerm >= 99;

    if (amountOk && termOk) {
      p._maxAmount = maxAmount;
      p._maxTerm = maxTerm;
      filtered.push(p);
    }
  }

  return filtered;
}

// 五级排序：客户需求偏好优化排序
function sortLevel5(answers, products) {
  var speed = answers.expected_speed || '无要求';

  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var score = 0;

    score += p._priorityBoost || 0;

    var processStr = getProcess(p);
    var processDays = parseProcessDays(processStr);

    if (speed === '3天内') {
      if (processDays <= 3) score += 50;
      else if (processDays <= 5) score += 20;
    } else if (speed === '5-7天') {
      if (processDays <= 5) score += 40;
      else if (processDays <= 7) score += 25;
    }

    score += Math.max(0, parseInt(40 - processDays * 3));

    var features = getFeatures(p);
    var application = getApplication(p);
    var fullText = features + application;

    if (fullText.indexOf('随借随还') > -1 || fullText.indexOf('循环') > -1) {
      score += 25;
    }
    if (fullText.indexOf('按日计息') > -1) {
      score += 10;
    }

    if (fullText.indexOf('线上') > -1 || fullText.indexOf('扫码') > -1 || fullText.indexOf('微信') > -1) {
      score += 15;
    }

    var rate = parseRate(getRate(p));
    score += Math.max(0, parseInt(25 - rate * 2));

    var location = answers.location;
    var bank = getBank(p);
    if (location === '大冶市' && (bank.indexOf('大冶') > -1 || bank.indexOf('泰隆') > -1)) {
      score += 20;
    }
    if (location === '阳新县' && bank.indexOf('阳新') > -1) {
      score += 20;
    }

    p._matchScore = score;
  }

  products.sort(function(a, b) {
    return (b._matchScore || 0) - (a._matchScore || 0);
  });
  return products;
}

// ============================================================
// 执行完整匹配
// ============================================================
function match(answers) {
  var products = getProducts();
  if (!products || products.length === 0) {
    console.error('[匹配错误] 产品数据未加载');
    return { priority: [], backup: [], rejected: {} };
  }
  var allProducts = JSON.parse(JSON.stringify(products));

  // 一级筛选
  var l1 = filterLevel1(answers, allProducts);
  var filtered = l1.filtered;
  var rejected = l1.rejected;
  console.log('[一级筛选] 通过:', filtered.length);

  if (filtered.length === 0) {
    return { priority: [], backup: [], rejected: rejected };
  }

  // 二级匹配
  filtered = filterLevel2(answers, filtered);
  console.log('[二级匹配] 完成');

  // 三级适配
  filtered = filterLevel3(answers, filtered);
  console.log('[三级适配] 通过:', filtered.length);

  if (filtered.length === 0) {
    return { priority: [], backup: [], rejected: rejected };
  }

  // 四级校验
  filtered = filterLevel4(answers, filtered);
  console.log('[四级校验] 通过:', filtered.length);

  if (filtered.length === 0) {
    return { priority: [], backup: [], rejected: rejected };
  }

  // 五级排序
  filtered = sortLevel5(answers, filtered);
  console.log('[五级排序] 完成，推荐:', filtered.length);

  // 分离优先推荐和备选推荐
  var priorityList = arrFilter(filtered, function(p) {
    return p._isSpecial && (p._priorityBoost || 0) > 0;
  });
  var others = arrFilter(filtered, function(p) {
    return !(p._isSpecial && (p._priorityBoost || 0) > 0);
  });

  var priority = priorityList.concat(others).slice(0, 5);
  var priorityNames = arrMap(priority, function(p) { return getProductName(p); });
  var backup = arrFilter(others, function(p) {
    return priorityNames.indexOf(getProductName(p)) === -1;
  }).slice(0, 5);

  return { priority: priority, backup: backup, rejected: rejected };
}

// ============================================================
// 产品信息提取辅助函数（供外部使用）
// ============================================================
function getProductInfo(p) {
  return {
    bank: getBank(p),
    name: getProductName(p),
    target: getTarget(p),
    conditions: getConditions(p),
    guarantee: getGuarantee(p),
    amount: getAmount(p),
    term: getTerm(p),
    rate: getRate(p),
    process: getProcess(p),
    application: getApplication(p),
    features: getFeatures(p),
    contact: getContact(p),
    specialType: p._specialType || '',
    isSpecial: p._isSpecial || false,
    matchScore: p._matchScore || 0
  };
}

// 生成匹配核心理由
function getMatchReason(answers, product) {
  var reasons = [];
  var special = product._specialType || '';

  if (special) {
    reasons.push('符合' + special + '产品条件');
  }

  var quals = answers.qualifications || [];
  if (quals.length > 0 && (product._priorityBoost || 0) >= 100) {
    reasons.push('命中企业专属资质');
  }

  var amount = parseAmount(getAmount(product));
  if (amount >= answers.loan_amount) {
    reasons.push('额度覆盖需求（最高' + parseInt(amount) + '万）');
  }

  var term = parseTerm(getTerm(product));
  if (term >= answers.loan_term) {
    reasons.push('期限满足要求（最长' + parseInt(term) + '年）');
  }

  var location = answers.location;
  var bank = getBank(product);
  if ((location === '大冶市' && bank.indexOf('大冶') > -1) || (location === '阳新县' && bank.indexOf('阳新') > -1)) {
    reasons.push('本地机构属地服务');
  }

  if (reasons.length === 0) {
    reasons.push('基础准入通过，适配通用需求');
  }

  return reasons.slice(0, 3).join('；');
}

var matcherExports = {
  match: match,
  getProductInfo: getProductInfo,
  getMatchReason: getMatchReason,
  parseAmount: parseAmount,
  parseTerm: parseTerm,
  parseRate: parseRate,
  parseProcessDays: parseProcessDays
};

// Node.js 兼容
if (typeof module !== 'undefined' && module.exports) {
  module.exports = matcherExports;
}

// 浏览器兼容
if (typeof window !== 'undefined') {
  window.Matcher = matcherExports;
}
