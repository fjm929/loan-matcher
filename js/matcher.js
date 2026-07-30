// utils/matcher.js
// 贷款产品智能匹配引擎 - JavaScript版本
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
  let s = String(amountStr).replace(/\s|,/g, '');
  let nums = s.match(/(\d+(?:\.\d+)?)/g);
  if (!nums) return 99999;
  
  let maxVal = 0;
  for (let n of nums) {
    let val = parseFloat(n);
    if (s.indexOf('亿') > -1 && val < 1000) {
      val *= 10000;
    }
    maxVal = Math.max(maxVal, val);
  }
  return maxVal > 0 ? maxVal : 99999;
}

function parseTerm(termStr) {
  if (!termStr) return 0;
  let s = String(termStr).replace(/\s/g, '');
  let nums = s.match(/(\d+(?:\.\d+)?)/g);
  if (!nums) return 99;
  
  let maxVal = 0;
  for (let n of nums) {
    let val = parseFloat(n);
    if (s.indexOf('月') > -1) {
      val = val / 12;
    }
    maxVal = Math.max(maxVal, val);
  }
  return maxVal > 0 ? maxVal : 99;
}

function parseRate(rateStr) {
  if (!rateStr) return 99;
  let s = String(rateStr).replace(/\s/g, '');
  let nums = s.match(/(\d+(?:\.\d+)?)/g);
  if (!nums) return 99;
  
  for (let n of nums) {
    let val = parseFloat(n);
    if (val >= 1 && val <= 20) {
      return val;
    }
  }
  return 99;
}

function parseProcessDays(daysStr) {
  if (!daysStr) return 7;
  let s = String(daysStr).replace(/\s/g, '');
  let nums = s.match(/(\d+)/g);
  if (!nums) return 7;
  
  let vals = nums.map(n => parseInt(n));
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ============================================================
// 产品字段提取函数
// ============================================================
function getBank(p) {
  for (let key in p) {
    if (key.indexOf('银行') > -1 || key.indexOf('机构') > -1) {
      return p[key];
    }
  }
  let vals = Object.values(p);
  return vals.length > 1 ? vals[1] : '';
}

function getProductName(p) {
  for (let key in p) {
    if (key.indexOf('产品名称') > -1 || (key.indexOf('产品') > -1 && key.indexOf('名称') > -1)) {
      return p[key];
    }
  }
  let vals = Object.values(p);
  return vals.length > 2 ? vals[2] : '未知产品';
}

function getTarget(p) {
  let text = '';
  for (let key in p) {
    if (key.indexOf('贷款对象') > -1 || key.indexOf('适用') > -1 || key.indexOf('对象') > -1 || key.indexOf('客户') > -1) {
      text += p[key] + ' ';
    }
  }
  return text;
}

function getConditions(p) {
  let text = '';
  for (let key in p) {
    if (key.indexOf('准入') > -1 || key.indexOf('条件') > -1 || key.indexOf('要求') > -1) {
      text += p[key] + ' ';
    }
  }
  return text;
}

function getGuarantee(p) {
  let text = '';
  for (let key in p) {
    if (key.indexOf('担保') > -1) {
      text += p[key] + ' ';
    }
  }
  return text;
}

function getAmount(p) {
  for (let key in p) {
    if (key.indexOf('额度') > -1 || key.indexOf('金额') > -1) {
      return p[key];
    }
  }
  return '';
}

function getTerm(p) {
  for (let key in p) {
    if (key.indexOf('期限') > -1 || key.indexOf('年限') > -1) {
      return p[key];
    }
  }
  return '';
}

function getRate(p) {
  for (let key in p) {
    if (key.indexOf('利率') > -1 || key.indexOf('利息') > -1) {
      return p[key];
    }
  }
  return '';
}

function getProcess(p) {
  for (let key in p) {
    if (key.indexOf('时限') > -1 || key.indexOf('时效') > -1 || key.indexOf('工作日') > -1) {
      return p[key];
    }
  }
  return '';
}

function getApplication(p) {
  let text = '';
  for (let key in p) {
    if (key.indexOf('申请') > -1 || key.indexOf('流程') > -1 || key.indexOf('渠道') > -1 || key.indexOf('办理') > -1) {
      text += p[key] + ' ';
    }
  }
  return text;
}

function getFeatures(p) {
  let text = '';
  for (let key in p) {
    if (key.indexOf('特点') > -1 || key.indexOf('优势') > -1 || key.indexOf('亮点') > -1 || key.indexOf('特色') > -1) {
      text += p[key] + ' ';
    }
  }
  return text;
}

function getContact(p) {
  for (let key in p) {
    if (key.indexOf('联系') > -1 || key.indexOf('电话') > -1 || key.indexOf('客户经理') > -1) {
      return p[key];
    }
  }
  return '';
}

// ============================================================
// 五级漏斗匹配
// ============================================================

// 一级筛选：基础准入硬校验
function filterLevel1(answers, products) {
  let filtered = [];
  let rejected = {};

  for (let p of products) {
    let reject = null;
    let bank = getBank(p);
    let target = getTarget(p);
    let conditions = getConditions(p);
    let fullText = target + ' ' + conditions;

    // 3.1.1 经营主体类型校验（宽松处理）
    let entity = answers.entity_type;
    if (fullText.indexOf('仅') > -1) {
      // 简化处理
    }

    // 3.1.2 经营属地校验
    let location = answers.location;
    if (location === '黄石市区') {
      let countyBanks = ['大冶农商', '阳新农商', '大冶泰隆', '大冶中银富登'];
      for (let cb of countyBanks) {
        if (bank.indexOf(cb) > -1) {
          reject = '经营属地不符（' + bank + '为县域专属机构）';
          break;
        }
      }
    }

    // 3.1.3 企业成立年限校验
    let years = answers.years_established;
    let yearReqs = fullText.match(/(\d+)\s*年/g);
    if (yearReqs) {
      let validYears = yearReqs
        .map(y => parseInt(y))
        .filter(y => y > 0 && y <= 10);
      if (validYears.length > 0) {
        let minYear = Math.min(...validYears);
        if (years < minYear) {
          reject = '成立年限不足（产品要求经营' + minYear + '年以上）';
        }
      }
    }

    if (years < 0.5) {
      let guarantee = getGuarantee(p);
      if (guarantee.indexOf('信用') > -1 && guarantee.indexOf('抵押') === -1 && guarantee.indexOf('质押') === -1) {
        if (!reject) reject = '成立不足6个月，排除纯信用产品';
      }
    }

    // 3.1.4 实际控制人年龄校验
    let age = answers.owner_age;
    let ageMentions = fullText.match(/(\d+)\s*周岁/g);
    if (ageMentions) {
      let ages = ageMentions.map(a => parseInt(a));
      if (age < Math.min(...ages)) {
        reject = '实控人年龄不符合（产品要求' + Math.min(...ages) + '周岁以上）';
      }
      if (age > 65 && Math.max(...ages) <= 65) {
        let guarantee = getGuarantee(p);
        if (guarantee.indexOf('抵押') === -1 && guarantee.indexOf('质押') === -1) {
          reject = '实控人年龄超65周岁，排除无抵押产品';
        }
      }
    }

    if (age > 70) {
      reject = '实控人年龄超过70周岁';
    }

    // 3.1.5 征信状况校验
    let credit = answers.credit_status;
    if (credit === '有当前不良') {
      let guarantee = getGuarantee(p);
      if (guarantee.indexOf('抵押') === -1 && guarantee.indexOf('质押') === -1 && guarantee.indexOf('保证') === -1) {
        reject = '有当前不良记录，排除纯信用产品';
      }
    }

    if (!reject) {
      filtered.push(p);
    } else {
      rejected[getProductName(p)] = reject;
    }
  }

  return { filtered, rejected };
}

// 二级匹配：专属资质精准定位
function filterLevel2(answers, products) {
  let qualTags = [];
  let quals = answers.qualifications || [];
  let industry = answers.industry || '';

  // 科创类资质
  let kechuangKeywords = ['高新技术企业', '专精特新', '科技型中小企业', '知识产权'];
  let hasKechuang = quals.some(q => kechuangKeywords.some(kw => q.indexOf(kw) > -1 || kw.indexOf(q) > -1));
  if (hasKechuang || industry.indexOf('科技') > -1 || industry.indexOf('高新') > -1) {
    qualTags.push('科创类');
  }

  // 农业类资质
  let nongyeKeywords = ['农业龙头', '规模种养', '家庭农场', '农民专业合作社'];
  let hasNongye = quals.some(q => nongyeKeywords.some(kw => q.indexOf(kw) > -1 || kw.indexOf(q) > -1));
  if (hasNongye || industry.indexOf('农') > -1 || industry.indexOf('林') > -1 || industry.indexOf('牧') > -1 || industry.indexOf('渔') > -1) {
    qualTags.push('农业类');
  }

  for (let p of products) {
    let pname = getProductName(p);
    let target = getTarget(p);
    let conditions = getConditions(p);
    let features = getFeatures(p);
    let fullText = pname + target + conditions + features;

    let isSpecial = false;
    let specialType = '';

    let kechuangProducts = ['知识价值信用贷', '科创', '科技', '高新', '专精特新', '知识产权质押'];
    for (let kw of kechuangProducts) {
      if (fullText.indexOf(kw) > -1) {
        isSpecial = true;
        specialType = '科创专属';
        break;
      }
    }

    if (!isSpecial) {
      let nongyeProducts = ['农贷', '惠农', '农业', '农机', '农资', '养殖', '种植'];
      for (let kw of nongyeProducts) {
        if (fullText.indexOf(kw) > -1) {
          isSpecial = true;
          specialType = '农业专属';
          break;
        }
      }
    }

    if (!isSpecial) {
      let chuangyeProducts = ['创业担保', '创保贷', '贴息'];
      for (let kw of chuangyeProducts) {
        if (fullText.indexOf(kw) > -1) {
          isSpecial = true;
          specialType = '贴息/创业担保';
          break;
        }
      }
    }

    p._isSpecial = isSpecial;
    p._specialType = specialType;
    p._qualTags = qualTags;

    let priorityBoost = 0;
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
  let filtered = [];
  let userGuarantees = answers.guarantee_types || [];

  for (let p of products) {
    let guarantee = getGuarantee(p);
    let features = getFeatures(p);
    let fullText = guarantee + features;

    let productGuaranteeTypes = [];

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

    let isMatch = false;
    for (let ug of userGuarantees) {
      if (ug === '其他') {
        isMatch = true;
        break;
      }
      for (let pg of productGuaranteeTypes) {
        if (ug.indexOf(pg) > -1 || pg.indexOf(ug) > -1) {
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
  let filtered = [];
  let userAmount = answers.loan_amount;
  let userTerm = answers.loan_term;

  for (let p of products) {
    let amountStr = getAmount(p);
    let termStr = getTerm(p);

    let maxAmount = parseAmount(amountStr);
    let maxTerm = parseTerm(termStr);

    let amountOk = maxAmount >= userAmount || maxAmount >= 99999;
    let termOk = maxTerm >= userTerm || maxTerm >= 99;

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
  let speed = answers.expected_speed || '无要求';

  for (let p of products) {
    let score = 0;

    score += p._priorityBoost || 0;

    let processStr = getProcess(p);
    let processDays = parseProcessDays(processStr);

    if (speed === '3天内') {
      if (processDays <= 3) score += 50;
      else if (processDays <= 5) score += 20;
    } else if (speed === '5-7天') {
      if (processDays <= 5) score += 40;
      else if (processDays <= 7) score += 25;
    }

    score += Math.max(0, parseInt(40 - processDays * 3));

    let features = getFeatures(p);
    let application = getApplication(p);
    let fullText = features + application;

    if (fullText.indexOf('随借随还') > -1 || fullText.indexOf('循环') > -1) {
      score += 25;
    }
    if (fullText.indexOf('按日计息') > -1) {
      score += 10;
    }

    if (fullText.indexOf('线上') > -1 || fullText.indexOf('扫码') > -1 || fullText.indexOf('微信') > -1) {
      score += 15;
    }

    let rate = parseRate(getRate(p));
    score += Math.max(0, parseInt(25 - rate * 2));

    let location = answers.location;
    let bank = getBank(p);
    if (location === '大冶市' && (bank.indexOf('大冶') > -1 || bank.indexOf('泰隆') > -1)) {
      score += 20;
    }
    if (location === '阳新县' && bank.indexOf('阳新') > -1) {
      score += 20;
    }

    p._matchScore = score;
  }

  products.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));
  return products;
}

// ============================================================
// 执行完整匹配
// ============================================================
function match(answers) {
  let products = getProducts();
  if (!products || products.length === 0) {
    console.error('[匹配错误] 产品数据未加载');
    return { priority: [], backup: [], rejected: {} };
  }
  let allProducts = JSON.parse(JSON.stringify(products));

  // 一级筛选
  let l1 = filterLevel1(answers, allProducts);
  let filtered = l1.filtered;
  let rejected = l1.rejected;
  console.log('[一级筛选] 通过:', filtered.length);

  if (filtered.length === 0) {
    return { priority: [], backup: [], rejected };
  }

  // 二级匹配
  filtered = filterLevel2(answers, filtered);
  console.log('[二级匹配] 完成');

  // 三级适配
  filtered = filterLevel3(answers, filtered);
  console.log('[三级适配] 通过:', filtered.length);

  if (filtered.length === 0) {
    return { priority: [], backup: [], rejected };
  }

  // 四级校验
  filtered = filterLevel4(answers, filtered);
  console.log('[四级校验] 通过:', filtered.length);

  if (filtered.length === 0) {
    return { priority: [], backup: [], rejected };
  }

  // 五级排序
  filtered = sortLevel5(answers, filtered);
  console.log('[五级排序] 完成，推荐:', filtered.length);

  // 分离优先推荐和备选推荐
  let priorityList = filtered.filter(p => p._isSpecial && (p._priorityBoost || 0) > 0);
  let others = filtered.filter(p => !(p._isSpecial && (p._priorityBoost || 0) > 0));

  let priority = (priorityList.concat(others)).slice(0, 5);
  let priorityNames = priority.map(p => getProductName(p));
  let backup = others.filter(p => priorityNames.indexOf(getProductName(p)) === -1).slice(0, 5);

  return { priority, backup, rejected };
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
  let reasons = [];
  let special = product._specialType || '';

  if (special) {
    reasons.push('符合' + special + '产品条件');
  }

  let quals = answers.qualifications || [];
  if (quals.length > 0 && (product._priorityBoost || 0) >= 100) {
    reasons.push('命中企业专属资质');
  }

  let amount = parseAmount(getAmount(product));
  if (amount >= answers.loan_amount) {
    reasons.push('额度覆盖需求（最高' + parseInt(amount) + '万）');
  }

  let term = parseTerm(getTerm(product));
  if (term >= answers.loan_term) {
    reasons.push('期限满足要求（最长' + parseInt(term) + '年）');
  }

  let location = answers.location;
  let bank = getBank(product);
  if ((location === '大冶市' && bank.indexOf('大冶') > -1) || (location === '阳新县' && bank.indexOf('阳新') > -1)) {
    reasons.push('本地机构属地服务');
  }

  if (reasons.length === 0) {
    reasons.push('基础准入通过，适配通用需求');
  }

  return reasons.slice(0, 3).join('；');
}

const matcherExports = {
  match,
  getProductInfo,
  getMatchReason,
  parseAmount,
  parseTerm,
  parseRate,
  parseProcessDays
};

// Node.js 兼容
if (typeof module !== 'undefined' && module.exports) {
  module.exports = matcherExports;
}

// 浏览器兼容
if (typeof window !== 'undefined') {
  window.Matcher = matcherExports;
}
