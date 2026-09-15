// 问卷页逻辑 - H5版本（9题版，兼容微信浏览器）

// ============================================================
// 选项配置（严格按照问题填报清单）
// ============================================================
var OPTIONS = {
  // 第2题：是否企业申请贷款
  isEnterprise: [
    { value: '是', label: 'A、是' },
    { value: '否', label: 'B、否（个体工商户选择"否"）' }
  ],
  // 第3题：所属行业（A-S）
  industries: [
    { value: '黑色金属冶炼及压延加工业', label: 'A、黑色金属冶炼及压延加工业' },
    { value: '机器设备制造业', label: 'B、机器设备制造业' },
    { value: '非金属矿物制品业', label: 'C、非金属矿物制品业' },
    { value: '石油加工炼焦行业', label: 'D、石油加工炼焦行业' },
    { value: '金属制品业', label: 'E、金属制品业' },
    { value: '农副产品加工业', label: 'F、农副产品加工业' },
    { value: '有色金属冶炼及压延加工业', label: 'G、有色金属冶炼及压延加工业' },
    { value: '石油和天然气开采业', label: 'H、石油和天然气开采业' },
    { value: '交通运输设备制造业', label: 'I、交通运输设备制造业' },
    { value: '金属矿采选业', label: 'J、金属矿采选业' },
    { value: '服务业', label: 'K、服务业（包括运输、进出口商贸企业等）' },
    { value: '食品饮料烟草制造业', label: 'L、食品、饮料、烟草制造业' },
    { value: '纺织服装鞋帽制造业', label: 'M、纺织、服装、鞋、帽制造业' },
    { value: '电子及通信设备制造业', label: 'N、电子及通信设备制造业' },
    { value: '锯材加工及家具制造业', label: 'O、锯材加工及家具制造业' },
    { value: '化学工业', label: 'P、化学工业' },
    { value: '仪器仪表行业', label: 'Q、仪器仪表行业及文化、办公用机械制造业' },
    { value: '电器机械及家电制造业', label: 'R、电器机械及家电制造业' },
    { value: '__other__', label: 'S、其他（请文字说明）' }
  ],
  // 第4题：成立年限
  years: [
    { value: '1年以内', label: 'A、1年以内', num: 0.5 },
    { value: '1年-3年', label: 'B、1年-3年', num: 2 },
    { value: '3年-5年', label: 'C、3年-5年', num: 4 },
    { value: '5年以上', label: 'D、5年以上', num: 6 }
  ],
  // 第5题：上一年度营业收入（万元）
  revenue: [
    { value: '10万元以内', label: 'A、10万元以内', num: 5 },
    { value: '10万元-100万元', label: 'B、10万元-100万元（不含）', num: 50 },
    { value: '100万元-500万元', label: 'C、100万元-500万元（不含）', num: 300 },
    { value: '500万元-1000万元', label: 'D、500万元-1000万元（不含）', num: 750 },
    { value: '1000万元-3000万元', label: 'E、1000万元-3000万元（不含）', num: 2000 },
    { value: '3000万元-5000万元', label: 'F、3000万元-5000万元（不含）', num: 4000 },
    { value: '5000万元-1亿元', label: 'G、5000万元-1亿元（不含）', num: 7500 },
    { value: '1亿元以上', label: 'H、1亿元以上', num: 15000 }
  ],
  // 第6题：计划申请融资金额（万元）
  loanAmount: [
    { value: '10万元以内', label: 'A、10万元以内', num: 5 },
    { value: '10万元-100万元', label: 'B、10万元-100万元（不含）', num: 50 },
    { value: '100万元-500万元', label: 'C、100万元-500万元（不含）', num: 300 },
    { value: '500万元-1000万元', label: 'D、500万元-1000万元（不含）', num: 750 },
    { value: '1000万元-3000万元', label: 'E、1000万元-3000万元（不含）', num: 2000 },
    { value: '3000万元-5000万元', label: 'F、3000万元-5000万元（不含）', num: 4000 },
    { value: '5000万元-1亿元', label: 'G、5000万元-1亿元（不含）', num: 7500 },
    { value: '1亿元以上', label: 'H、1亿元以上', num: 15000 }
  ],
  // 第7题：计划贷款使用年限（年）
  loanTerm: [
    { value: '1年以内', label: 'A、1年以内', num: 0.5 },
    { value: '1年-3年', label: 'B、1年-3年（不含）', num: 2 },
    { value: '3年-5年', label: 'C、3年-5年（不含）', num: 4 },
    { value: '5年以上', label: 'D、5年以上', num: 6 }
  ],
  // 第8题：可接受的贷款类型（多选）
  guaranteeTypes: [
    { value: '纯信用', label: 'A、纯信用' },
    { value: '不动产抵押', label: 'B、不动产抵押' },
    { value: '动产/权利质押', label: 'C、动产 / 权利质押' },
    { value: '保证担保', label: 'D、保证担保' },
    { value: '其他', label: 'E、其他' }
  ],
  // 第9题：是否为科技型企业
  isTech: [
    { value: '是', label: 'A、是' },
    { value: '否', label: 'B、否' }
  ]
};

// ============================================================
// 表单数据
// ============================================================
var form = {
  company_name: '',
  is_enterprise: '',
  industry: '',
  industry_other: '',
  years_range: '',
  revenue_range: '',
  loan_amount_range: '',
  loan_term_range: '',
  guarantee_types: [],
  is_tech: '',
  // 已删除字段，保留默认值用于匹配
  location: '黄石市区',
  owner_age: 45,
  tax_grade: 'A级',
  credit_status: '无不良',
  qualifications: [],
  tax_amount: 0,
  main_bank: '',
  collateral_type: '',
  loan_purpose: '',
  expected_speed: ''
};

// ============================================================
// 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  renderAllOptions();
  bindInputEvents();

  // 恢复暂存数据
  var saved = Store.get('formData');
  if (saved) {
    for (var key in saved) {
      if (saved.hasOwnProperty(key)) {
        form[key] = saved[key];
      }
    }
    restoreFormValues();
  }
});

// ============================================================
// 渲染所有选项组
// ============================================================
function renderAllOptions() {
  // 第2题：是否企业
  renderSingleOptions('is_enterprise_group', OPTIONS.isEnterprise, 'is_enterprise');

  // 第3题：所属行业（带S项填空处理）
  renderIndustryOptions();

  // 第4题：成立年限
  renderSingleOptions('years_group', OPTIONS.years, 'years_range');

  // 第5题：营业收入
  renderSingleOptions('revenue_group', OPTIONS.revenue, 'revenue_range');

  // 第6题：融资金额
  renderSingleOptions('loan_amount_group', OPTIONS.loanAmount, 'loan_amount_range');

  // 第7题：贷款年限
  renderSingleOptions('loan_term_group', OPTIONS.loanTerm, 'loan_term_range');

  // 第8题：贷款类型（多选）
  renderMultiOptions('guarantee_types_group', OPTIONS.guaranteeTypes, 'guarantee_types');

  // 第9题：是否科技型
  renderSingleOptions('is_tech_group', OPTIONS.isTech, 'is_tech');
}

// ============================================================
// 第3题：行业选项（特殊处理S项）
// ============================================================
function renderIndustryOptions() {
  var containerId = 'industry_group';
  var options = OPTIONS.industries;
  var field = 'industry';
  var container = document.getElementById(containerId);
  container.innerHTML = '';

  for (var i = 0; i < options.length; i++) {
    (function(item) {
      var isSelected = form[field] === item.value;
      var el = document.createElement('div');
      el.className = 'option-item option-single' + (isSelected ? ' active' : '');
      el.innerHTML = '<div class="option-content">' +
        '<div class="option-text">' + escapeHtml(item.label) + '</div>' +
        '<div class="option-radio">' + (isSelected ? '✓' : '') + '</div>' +
      '</div>';
      el.onclick = function() {
        form[field] = item.value;
        // S项选中时显示填空框
        var otherWrap = document.getElementById('industry_other_wrap');
        if (item.value === '__other__') {
          otherWrap.style.display = 'block';
        } else {
          otherWrap.style.display = 'none';
          form.industry_other = '';
        }
        renderIndustryOptions();
        saveForm();
      };
      container.appendChild(el);
    })(options[i]);
  }
}

// ============================================================
// 渲染单选选项
// ============================================================
function renderSingleOptions(containerId, options, field) {
  var container = document.getElementById(containerId);
  container.innerHTML = '';
  for (var i = 0; i < options.length; i++) {
    (function(item) {
      var isSelected = form[field] === item.value;
      var el = document.createElement('div');
      el.className = 'option-item option-single' + (isSelected ? ' active' : '');
      el.innerHTML = '<div class="option-content">' +
        '<div class="option-text">' + escapeHtml(item.label) + '</div>' +
        '<div class="option-radio">' + (isSelected ? '✓' : '') + '</div>' +
      '</div>';
      el.onclick = function() {
        form[field] = item.value;
        renderSingleOptions(containerId, options, field);
        saveForm();
      };
      container.appendChild(el);
    })(options[i]);
  }
}

// ============================================================
// 渲染多选选项
// ============================================================
function renderMultiOptions(containerId, options, field) {
  var container = document.getElementById(containerId);
  container.innerHTML = '';
  var selected = form[field] || [];
  for (var i = 0; i < options.length; i++) {
    (function(item) {
      var isSelected = selected.indexOf(item.value) > -1;
      var el = document.createElement('div');
      el.className = 'option-item option-multi' + (isSelected ? ' active' : '');
      el.innerHTML = '<div class="option-content">' +
        '<div class="option-text">' + escapeHtml(item.label) + '</div>' +
        '<div class="option-checkbox">' + (isSelected ? '✓' : '') + '</div>' +
      '</div>';
      el.onclick = function() {
        onMultiSelect(field, item.value);
        renderMultiOptions(containerId, options, field);
        updateMultiHint(field);
        saveForm();
      };
      container.appendChild(el);
    })(options[i]);
  }
}

// ============================================================
// 多选处理
// ============================================================
function onMultiSelect(field, value) {
  var oldArr = form[field] || [];
  var newArr = oldArr.slice();
  var idx = newArr.indexOf(value);
  if (idx > -1) {
    newArr.splice(idx, 1);
  } else {
    newArr.push(value);
  }
  form[field] = newArr;
}

// ============================================================
// 更新多选提示
// ============================================================
function updateMultiHint(field) {
  var hint = document.getElementById('guarantee_hint');
  var len = (form[field] || []).length;
  if (len > 0) {
    hint.style.display = 'inline-block';
    hint.textContent = '已选择 ' + len + ' 项';
  } else {
    hint.style.display = 'none';
  }
}

// ============================================================
// 绑定输入框事件
// ============================================================
function bindInputEvents() {
  // 企业名称
  var nameEl = document.getElementById('company_name');
  nameEl.addEventListener('input', function() {
    form.company_name = this.value;
    saveForm();
  });

  // 行业S项填空
  var otherEl = document.getElementById('industry_other');
  otherEl.addEventListener('input', function() {
    form.industry_other = this.value;
    saveForm();
  });
}

// ============================================================
// 恢复表单值
// ============================================================
function restoreFormValues() {
  // 企业名称
  if (form.company_name) {
    document.getElementById('company_name').value = form.company_name;
  }

  // 行业S项填空显示
  if (form.industry === '__other__') {
    document.getElementById('industry_other_wrap').style.display = 'block';
    if (form.industry_other) {
      document.getElementById('industry_other').value = form.industry_other;
    }
  }

  updateMultiHint('guarantee_types');
}

// ============================================================
// 保存表单
// ============================================================
function saveForm() {
  Store.set('formData', form);
}

// ============================================================
// 根据选项值查找num（用于数值区间转换）
// ============================================================
function findOptionNum(optionsList, value) {
  for (var i = 0; i < optionsList.length; i++) {
    if (optionsList[i].value === value) {
      return optionsList[i].num;
    }
  }
  return 0;
}

// ============================================================
// 获取最终行业名称
// ============================================================
function getFinalIndustry() {
  if (form.industry === '__other__') {
    return form.industry_other || '其他';
  }
  return form.industry;
}

// ============================================================
// 获取经营主体类型
// ============================================================
function getEntityType() {
  if (form.is_enterprise === '是') {
    return '法人企业';
  }
  return '个体工商户';
}

// ============================================================
// 校验
// ============================================================
function validateForm() {
  if (!form.company_name) return '请填写企业 / 经营主体名称';
  if (!form.is_enterprise) return '请选择是否企业申请贷款';
  if (!form.industry) return '请选择所属行业';
  if (form.industry === '__other__' && !form.industry_other) return '请填写具体行业名称';
  if (!form.years_range) return '请选择成立年限';
  if (!form.revenue_range) return '请选择上一年度营业收入';
  if (!form.loan_amount_range) return '请选择计划申请融资金额';
  if (!form.loan_term_range) return '请选择计划贷款使用年限';
  if (!form.guarantee_types || form.guarantee_types.length === 0) return '请选择可接受的贷款类型';
  if (!form.is_tech) return '请选择是否为科技型企业';
  return null;
}

// ============================================================
// 提交表单
// ============================================================
function submitForm() {
  var err = validateForm();
  if (err) {
    showToast(err);
    return;
  }

  // 转换为匹配引擎需要的格式
  var formData = {
    company_name: form.company_name,
    entity_type: getEntityType(),
    industry: getFinalIndustry(),
    years_established: findOptionNum(OPTIONS.years, form.years_range),
    annual_revenue: findOptionNum(OPTIONS.revenue, form.revenue_range),
    loan_amount: findOptionNum(OPTIONS.loanAmount, form.loan_amount_range),
    loan_term: findOptionNum(OPTIONS.loanTerm, form.loan_term_range),
    guarantee_types: form.guarantee_types,
    // 科技型企业：如果选"是"，添加科技资质
    qualifications: form.is_tech === '是' ? ['科技型企业资质'] : [],
    // 保留默认值
    location: form.location,
    owner_age: form.owner_age,
    tax_grade: form.tax_grade,
    credit_status: form.credit_status,
    tax_amount: form.tax_amount,
    main_bank: form.main_bank,
    collateral_type: form.collateral_type,
    loan_purpose: form.loan_purpose,
    expected_speed: form.expected_speed,
    founded_year: new Date().getFullYear() - findOptionNum(OPTIONS.years, form.years_range)
  };

  Store.set('formData', formData);

  // 执行匹配
  try {
    if (!window.Matcher) {
      throw new Error('匹配引擎未加载，请刷新页面重试');
    }
    var matcher = window.Matcher;
    var result = matcher.match(formData);

    var priority = result.priority.map(function(p) {
      var info = matcher.getProductInfo(p);
      info.matchReason = matcher.getMatchReason(formData, p);
      return info;
    });
    var backup = result.backup.map(function(p) {
      var info = matcher.getProductInfo(p);
      info.matchReason = matcher.getMatchReason(formData, p);
      return info;
    });

    var matchResultData = {
      priority: priority,
      backup: backup,
      rejected: result.rejected,
      formData: formData
    };
    Store.set('matchResult', matchResultData);

    // 保存数据到云端，等保存完成或超时后再跳转
    var saved = false;
    var jumpTimer = null;

    var doJump = function() {
      if (jumpTimer) {
        clearTimeout(jumpTimer);
        jumpTimer = null;
      }
      window.location.href = 'result.html';
    };

    // 最多等 3 秒，不管成功与否都跳转
    jumpTimer = setTimeout(doJump, 3000);

    if (window.GitHubDB) {
      window.GitHubDB.addSubmission(formData, matchResultData, function(ok) {
        console.log('数据保存结果:', ok);
        saved = true;
        doJump();
      });
    } else {
      doJump();
    }
  } catch (e) {
    console.error('匹配出错:', e);
    showToast('匹配失败: ' + (e.message || '请重试'));
  }
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}
