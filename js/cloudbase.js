// 腾讯云 CloudBase 数据存储模块（ES5 兼容）
// 环境 ID
var ENV_ID = 'hsmqrym2026-d0g8umnymb4c96254';

var CloudDB = {
  app: null,
  db: null,
  inited: false,

  // 初始化
  init: function() {
    if (this.inited) return;
    try {
      if (!window.cloudbase) {
        console.warn('CloudBase SDK 未加载');
        return;
      }
      var app = window.cloudbase.init({
        env: ENV_ID,
        region: 'ap-shanghai'
      });
      this.app = app;
      this.db = app.database();
      this.inited = true;
      console.log('CloudBase 初始化成功');
    } catch (e) {
      console.error('CloudBase 初始化失败:', e);
    }
  },

  // 匿名登录（必须先登录才能写数据）
  signInAnonymously: function(callback) {
    var self = this;
    if (!this.app) {
      this.init();
    }
    if (!this.app) {
      if (callback) callback(null);
      return;
    }
    try {
      var auth = this.app.auth({ persistence: 'local' });
      auth.anonymousAuthProvider().signIn().then(function(loginState) {
        console.log('匿名登录成功');
        if (callback) callback(loginState);
      }).catch(function(err) {
        console.error('匿名登录失败:', err);
        if (callback) callback(null);
      });
    } catch (e) {
      console.error('登录异常:', e);
      if (callback) callback(null);
    }
  },

  // 记录访问量
  addVisitor: function() {
    var self = this;
    if (!this.db) {
      this.init();
    }
    if (!this.db) return;

    var data = {
      page: window.location.pathname,
      url: window.location.href,
      ua: navigator.userAgent,
      timestamp: new Date()
    };

    try {
      this.db.collection('visitors').add(data).then(function() {
        console.log('访问记录已保存');
      }).catch(function(err) {
        console.error('保存访问记录失败:', err);
      });
    } catch (e) {
      console.error('保存访问异常:', e);
    }
  },

  // 保存问卷提交数据
  addSubmission: function(formData, matchResult, callback) {
    var self = this;
    if (!this.db) {
      this.init();
    }
    if (!this.db) {
      if (callback) callback(false);
      return;
    }

    var priorityNames = (matchResult.priority || []).map(function(p) {
      return p['产品名称'] || p.name || '';
    });
    var backupNames = (matchResult.backup || []).map(function(b) {
      return b['产品名称'] || b.name || '';
    });

    var data = {
      // 问卷数据
      company_name: formData.company_name || '',
      entity_type: formData.entity_type || '',
      industry: formData.industry || '',
      years_established: formData.years_established || 0,
      annual_revenue: formData.annual_revenue || 0,
      loan_amount: formData.loan_amount || 0,
      loan_term: formData.loan_term || 0,
      guarantee_types: formData.guarantee_types || [],
      qualifications: formData.qualifications || [],
      is_tech: (formData.qualifications || []).indexOf('科技型企业资质') > -1 ? '是' : '否',
      // 匹配结果
      match_priority: priorityNames,
      match_backup: backupNames,
      match_priority_count: priorityNames.length,
      match_backup_count: backupNames.length,
      // 元数据
      ua: navigator.userAgent,
      submitted_at: new Date()
    };

    try {
      this.db.collection('submissions').add(data).then(function(res) {
        console.log('问卷数据已保存:', res);
        if (callback) callback(true);
      }).catch(function(err) {
        console.error('保存问卷数据失败:', err);
        if (callback) callback(false);
      });
    } catch (e) {
      console.error('保存问卷异常:', e);
      if (callback) callback(false);
    }
  }
};

// 浏览器兼容：导出到全局变量
if (typeof window !== 'undefined') {
  window.CloudDB = CloudDB;
}
