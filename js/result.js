// 结果页逻辑 - H5版本（兼容微信浏览器）

var priority = [];
var backup = [];
var formData = {};

document.addEventListener('DOMContentLoaded', function() {
  var result = Store.get('matchResult');
  if (!result) {
    showToast('无匹配数据');
    setTimeout(function() {
      window.location.href = 'index.html';
    }, 1500);
    return;
  }
  
  formData = result.formData || {};
  priority = result.priority || [];
  backup = result.backup || [];
  
  // 处理产品数据
  priority = priority.map(function(p) {
    var contactInfo = extractPhone(p.contact);
    p.featureList = extractFeatures(p.features);
    p.contactName = contactInfo.name;
    p.phone = contactInfo.phone;
    p.phones = contactInfo.phones;
    return p;
  });
  
  backup = backup.map(function(p) {
    var contactInfo = extractPhone(p.contact);
    p.contactName = contactInfo.name;
    p.phone = contactInfo.phone;
    p.phones = contactInfo.phones;
    return p;
  });
  
  try {
    renderResult();
  } catch (e) {
    console.error('渲染失败:', e);
    showToast('渲染失败: ' + (e.message || '请刷新'));
  }
});

function renderResult() {
  var container = document.getElementById('result-container');
  if (!container) {
    console.error('找不到 result-container');
    return;
  }
  var html = '';
  
  html += renderSummary();
  
  html += '<div class="match-stats">' +
    '<div class="stat-item">' +
      '<div class="stat-num">' + priority.length + '</div>' +
      '<div class="stat-label">优先推荐</div>' +
    '</div>' +
    '<div class="stat-divider"></div>' +
    '<div class="stat-item">' +
      '<div class="stat-num">' + backup.length + '</div>' +
      '<div class="stat-label">备选方案</div>' +
    '</div>' +
  '</div>';
  
  if (priority.length > 0) {
    html += '<div class="section">' +
      '<div class="section-header">' +
        '<div class="section-title">★ 优先推荐</div>' +
        '<div class="section-desc">命中专属资质，最优适配</div>' +
      '</div>';
    for (var i = 0; i < priority.length; i++) {
      html += renderPriorityCard(priority[i], i);
    }
    html += '</div>';
  }
  
  if (backup.length > 0) {
    html += '<div class="section">' +
      '<div class="section-header">' +
        '<div class="section-title">◆ 备选推荐</div>' +
        '<div class="section-desc">通用类产品，补充融资选择</div>' +
      '</div>';
    for (var j = 0; j < backup.length; j++) {
      html += renderBackupCard(backup[j]);
    }
    html += '</div>';
  }
  
  if (priority.length === 0 && backup.length === 0) {
    html += '<div class="no-result">' +
      '<div class="no-result-icon">😔</div>' +
      '<div class="no-result-title">暂无匹配产品</div>' +
      '<div class="no-result-desc">您的需求可能较为特殊，建议联系银行客户经理定制方案</div>' +
    '</div>';
  }
  
  html += renderTips();
  
  html += '<div class="bottom-actions">' +
    '<button class="btn-secondary" onclick="backToHome()">返回首页</button>' +
    '<button class="btn-primary" onclick="restart()">重新匹配</button>' +
  '</div>';
  
  container.innerHTML = html;
}

function renderSummary() {
  var guaranteeTypes = '';
  if (Array.isArray(formData.guarantee_types)) {
    guaranteeTypes = formData.guarantee_types.join('、');
  } else {
    guaranteeTypes = formData.guarantee_types || '';
  }
  var qualifications = formData.qualifications || [];
  
  var qualHtml = '';
  if (qualifications.length > 0) {
    qualHtml = '<div class="qual-tags">';
    for (var i = 0; i < qualifications.length; i++) {
      qualHtml += '<span class="tag tag-purple">' + escapeHtml(qualifications[i]) + '</span>';
    }
    qualHtml += '</div>';
  }
  
  return '<div class="card summary-card">' +
    '<div class="summary-title">您的融资需求</div>' +
    '<div class="summary-grid">' +
      '<div class="summary-item">' +
        '<div class="summary-label">经营主体</div>' +
        '<div class="summary-value">' + escapeHtml(formData.company_name || '-') + '</div>' +
      '</div>' +
      '<div class="summary-item">' +
        '<div class="summary-label">主体类型</div>' +
        '<div class="summary-value">' + escapeHtml(formData.entity_type || '-') + '</div>' +
      '</div>' +
      '<div class="summary-item">' +
        '<div class="summary-label">所属行业</div>' +
        '<div class="summary-value">' + escapeHtml(formData.industry || '-') + '</div>' +
      '</div>' +
      '<div class="summary-item">' +
        '<div class="summary-label">经营地点</div>' +
        '<div class="summary-value">' + escapeHtml(formData.location || '-') + '</div>' +
      '</div>' +
      '<div class="summary-item">' +
        '<div class="summary-label">申请额度</div>' +
        '<div class="summary-value highlight">' + (formData.loan_amount || 0) + ' 万元</div>' +
      '</div>' +
      '<div class="summary-item">' +
        '<div class="summary-label">使用年限</div>' +
        '<div class="summary-value highlight">' + (formData.loan_term || 0) + ' 年</div>' +
      '</div>' +
      '<div class="summary-item">' +
        '<div class="summary-label">担保方式</div>' +
        '<div class="summary-value">' + escapeHtml(guaranteeTypes || '-') + '</div>' +
      '</div>' +
      '<div class="summary-item">' +
        '<div class="summary-label">征信状况</div>' +
        '<div class="summary-value">' + escapeHtml(formData.credit_status || '-') + '</div>' +
      '</div>' +
    '</div>' +
    qualHtml +
  '</div>';
}

function renderPriorityCard(p, idx) {
  var typeTag = p.specialType ? '<div class="product-type tag tag-blue">' + escapeHtml(p.specialType) + '</div>' : '';
  
  var featureHtml = '';
  if (p.featureList && p.featureList.length > 0) {
    featureHtml = '<div class="product-features">';
    for (var i = 0; i < p.featureList.length; i++) {
      featureHtml += '<span class="tag tag-green">' + escapeHtml(p.featureList[i]) + '</span>';
    }
    featureHtml += '</div>';
  }
  
  var phonesHtml = '';
  if (p.phones && p.phones.length > 0) {
    phonesHtml = '<div class="contact-phones">';
    for (var j = 0; j < p.phones.length; j++) {
      phonesHtml += '<a class="contact-phone" href="tel:' + p.phones[j] + '" onclick="event.stopPropagation();">' + p.phones[j] + '</a>';
    }
    phonesHtml += '</div>';
  }
  
  var contactStyle = p.contact ? '' : 'display:none;';
  var contactEscaped = (p.contact || '').replace(/'/g, "\\'");
  
  return '<div class="product-card">' +
    '<div class="product-header">' +
      '<div class="product-rank">' + (idx + 1) + '</div>' +
      '<div class="product-basic">' +
        '<div class="product-name">' + escapeHtml(p.name) + '</div>' +
        '<div class="product-bank">' + escapeHtml(p.bank) + '</div>' +
      '</div>' +
      typeTag +
    '</div>' +
    '<div class="product-body">' +
      '<div class="product-attrs">' +
        '<div class="attr-item">' +
          '<div class="attr-label">最高额度</div>' +
          '<div class="attr-value">' + escapeHtml(p.amount) + '</div>' +
        '</div>' +
        '<div class="attr-item">' +
          '<div class="attr-label">最长期限</div>' +
          '<div class="attr-value">' + escapeHtml(p.term) + '</div>' +
        '</div>' +
        '<div class="attr-item">' +
          '<div class="attr-label">参考利率</div>' +
          '<div class="attr-value rate">' + escapeHtml(p.rate) + '</div>' +
        '</div>' +
        '<div class="attr-item">' +
          '<div class="attr-label">办理时效</div>' +
          '<div class="attr-value">' + escapeHtml(p.process) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="product-reason">' +
        '<div class="reason-label">匹配核心理由</div>' +
        '<div class="reason-text">' + escapeHtml(p.matchReason || '符合多项准入条件') + '</div>' +
      '</div>' +
      featureHtml +
      '<div class="product-contact" style="' + contactStyle + '">' +
        '<div class="contact-label">联系信息</div>' +
        '<div class="contact-info">' +
          '<div class="contact-name">' + escapeHtml(p.contactName || '') + '</div>' +
          phonesHtml +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="product-actions">' +
      '<a class="action-btn action-call" href="tel:' + (p.phone || '') + '">📞 电话咨询</a>' +
      '<div class="action-btn action-copy" onclick="copyContact(\'' + contactEscaped + '\')">📋 复制信息</div>' +
    '</div>' +
  '</div>';
}

function renderBackupCard(p) {
  var phonesHtml = '';
  if (p.phones && p.phones.length > 0) {
    for (var i = 0; i < p.phones.length; i++) {
      phonesHtml += '<a class="call-btn" href="tel:' + p.phones[i] + '" onclick="event.stopPropagation();">' + p.phones[i] + '</a>';
    }
  }
  
  var contactStyle = p.contact ? '' : 'display:none;';
  
  return '<div class="backup-card">' +
    '<div class="backup-header">' +
      '<div class="backup-name">' + escapeHtml(p.name) + '</div>' +
      '<div class="backup-bank">' + escapeHtml(p.bank) + '</div>' +
    '</div>' +
    '<div class="backup-info">' +
      '<span>额度：' + escapeHtml(p.amount) + '</span>' +
      '<span>期限：' + escapeHtml(p.term) + '</span>' +
      '<span class="rate">利率：' + escapeHtml(p.rate) + '</span>' +
    '</div>' +
    '<div class="backup-contact" style="' + contactStyle + '">' +
      '<span class="contact-text">' + escapeHtml(p.contactName || '') + '：</span>' +
      phonesHtml +
    '</div>' +
  '</div>';
}

function renderTips() {
  return '<div class="tips-card">' +
    '<div class="tips-title">温馨提示</div>' +
    '<div class="tip-item">1. 本匹配结果基于您填报的信息生成，最终贷款额度、利率、期限以银行实际审批为准。</div>' +
    '<div class="tip-item">2. 申请专属类产品需补充提供对应资质证明、经营流水、财务报表等材料。</div>' +
    '<div class="tip-item">3. 若可补充抵押物、担保等增信措施，可进一步申请更低利率、更高额度的产品。</div>' +
    '<div class="tip-item">4. 您可直接拨打表格内对应联系人电话咨询详情或预约办理。</div>' +
    '<div class="tip-item">5. 建议您同时联系2-3家银行进行对比，选择最适合您的融资方案。</div>' +
  '</div>';
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}

function copyContact(text) {
  copyToClipboard(text);
}

function backToHome() {
  window.location.href = 'index.html';
}

function restart() {
  window.location.href = 'questionnaire.html';
}
