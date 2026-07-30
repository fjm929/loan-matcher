// 问卷页逻辑 - H5版本（精简8题版，兼容微信浏览器）

// 选项配置
var OPTIONS = {
  entityTypes: ['法人企业', '个体工商户', '小微企业主', '农业经营主体'],
  guaranteeTypes: ['纯信用', '不动产抵押', '动产/权利质押', '保证担保', '其他']
};

// 表单数据
var form = {
  company_name: '',
  entity_type: '',
  industry: '',
  founded_year: '',
  years_established: 0,
  annual_revenue: '',
  loan_amount: '',
  loan_term: '',
  guarantee_types: [],
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

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  initYearSelect();
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

// 初始化年份下拉
function initYearSelect() {
  var select = document.getElementById('founded_year');
  var years = generateYearRange();
  for (var i = 0; i < years.length; i++) {
    var y = years[i];
    var opt = document.createElement('option');
    opt.value = y.replace('年', '');
    opt.textContent = y;
    select.appendChild(opt);
  }
}

// 渲染所有选项组
function renderAllOptions() {
  renderSingleOptions('entity_type_group', OPTIONS.entityTypes, 'entity_type');
  renderMultiOptions('guarantee_types_group', OPTIONS.guaranteeTypes, 'guarantee_types');
}

// 渲染单选选项
function renderSingleOptions(containerId, options, field) {
  var container = document.getElementById(containerId);
  container.innerHTML = '';
  for (var i = 0; i < options.length; i++) {
    (function(item) {
      var el = document.createElement('div');
      el.className = 'option-item option-single' + (form[field] === item ? ' active' : '');
      el.innerHTML = '<div class="option-content">' +
        '<div class="option-text">' + escapeHtml(item) + '</div>' +
        '<div class="option-radio">' + (form[field] === item ? '✓' : '') + '</div>' +
      '</div>';
      el.onclick = function() {
        form[field] = item;
        renderSingleOptions(containerId, options, field);
        saveForm();
      };
      container.appendChild(el);
    })(options[i]);
  }
}

// 渲染多选选项
function renderMultiOptions(containerId, options, field) {
  var container = document.getElementById(containerId);
  container.innerHTML = '';
  var selected = form[field] || [];
  for (var i = 0; i < options.length; i++) {
    (function(item) {
      var isSelected = selected.indexOf(item) > -1;
      var el = document.createElement('div');
      el.className = 'option-item option-multi' + (isSelected ? ' active' : '');
      el.innerHTML = '<div class="option-content">' +
        '<div class="option-text">' + escapeHtml(item) + '</div>' +
        '<div class="option-checkbox">' + (isSelected ? '✓' : '') + '</div>' +
      '</div>';
      el.onclick = function() {
        onMultiSelect(field, item);
        renderMultiOptions(containerId, options, field);
        updateMultiHint(field);
        saveForm();
      };
      container.appendChild(el);
    })(options[i]);
  }
}

// 多选处理
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

// 更新多选提示
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

// 绑定输入框事件
function bindInputEvents() {
  var inputs = ['company_name', 'industry', 'annual_revenue', 'loan_amount', 'loan_term'];
  for (var i = 0; i < inputs.length; i++) {
    (function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', function() {
          form[id] = this.value;
          saveForm();
        });
      }
    })(inputs[i]);
  }

  // 年份选择
  var yearSel = document.getElementById('founded_year');
  yearSel.addEventListener('change', function() {
    var year = parseInt(this.value);
    var currentYear = new Date().getFullYear();
    form.founded_year = year;
    form.years_established = year ? currentYear - year : 0;
    saveForm();
  });
}

// 恢复表单值
function restoreFormValues() {
  var inputs = ['company_name', 'industry', 'annual_revenue', 'loan_amount', 'loan_term'];
  for (var i = 0; i < inputs.length; i++) {
    var id = inputs[i];
    var el = document.getElementById(id);
    if (el && form[id]) {
      el.value = form[id];
    }
  }
  if (form.founded_year) {
    document.getElementById('founded_year').value = form.founded_year;
  }
  updateMultiHint('guarantee_types');
}

// 保存表单
function saveForm() {
  Store.set('formData', form);
}

// 校验
function validateForm() {
  if (!form.company_name) return '请填写企业/经营主体名称';
  if (!form.entity_type) return '请选择经营主体类型';
  if (!form.industry) return '请填写所属行业';
  if (!form.founded_year) return '请选择企业成立年份';
  if (!form.annual_revenue && form.annual_revenue !== 0) return '请填写上一年度营业收入';
  if (!form.loan_amount && form.loan_amount !== 0) return '请填写申请融资金额';
  if (!form.loan_term && form.loan_term !== 0) return '请填写贷款使用年限';
  if (!form.guarantee_types || form.guarantee_types.length === 0) return '请选择可接受的贷款类型';
  return null;
}

// 提交表单
function submitForm() {
  var err = validateForm();
  if (err) {
    showToast(err);
    return;
  }

  // 格式化数字字段
  var formData = {};
  for (var key in form) {
    if (form.hasOwnProperty(key)) {
      formData[key] = form[key];
    }
  }
  formData.annual_revenue = parseFloat(formData.annual_revenue) || 0;
  formData.loan_amount = parseFloat(formData.loan_amount) || 0;
  formData.loan_term = parseFloat(formData.loan_term) || 0;
  formData.tax_amount = parseFloat(formData.tax_amount) || 0;

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

    Store.set('matchResult', {
      priority: priority,
      backup: backup,
      rejected: result.rejected,
      formData: formData
    });

    window.location.href = 'result.html';
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
