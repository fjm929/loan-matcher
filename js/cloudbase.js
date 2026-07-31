// 腾讯云 CloudBase 数据存储模块（简化版，更可靠）
var ENV_ID = 'hsmqrym2026-d0g8umnymb4c96254';

var CloudDB = {
  app: null,
  db: null,
  auth: null,
  inited: false,
  loggingIn: false,

  // 初始化（页面加载时自动调用）
  init: function() {
    if (this.inited) return;
    try {
      if (!window.cloudbase) {
        console.warn('CloudBase SDK 未加载');
        return;
      }
      this.app = window.cloudbase.init({ env: ENV_ID });
      this.auth = this.app.auth({ persistence: 'local' });
      this.db = this.app.database();
      this.inited = true;
      console.log('CloudBase 初始化成功');
      // 初始化后尝试匿名登录
      this.tryLogin();
    } catch (e) {
      console.error('CloudBase 初始化失败:', e);
    }
  },

  // 尝试匿名登录（不阻塞）
  tryLogin: function() {
    var self = this;
    if (!this.auth || this.loggingIn) return;
    this.loggingIn = true;

    var doLogin = function() {
      try {
        self.auth.anonymousAuthProvider().signIn().then(function(res) {
          console.log('匿名登录成功');
        }).catch(function(err) {
          console.warn('匿名登录失败，稍后重试:', err && err.message ? err.message : err);
          setTimeout(doLogin, 3000);
        });
      } catch (e) {
        console.warn('登录异常:', e);
        setTimeout(doLogin, 3000);
      }
    };
    doLogin();
  },

  // 执行数据库操作（带重试）
  _doDB: function(collection, data, callback, tryCount) {
    var self = this;
    if (!tryCount) tryCount = 0;
    if (!this.db) {
      if (callback) callback(false);
      return;
    }

    try {
      this.db.collection(collection).add(data).then(function(res) {
        console.log('数据保存成功:', collection, res && res.id);
        if (callback) callback(true);
      }).catch(function(err) {
        console.warn('数据保存失败 (第' + (tryCount + 1) + '次):', err && err.message ? err.message : err);
        // 如果失败了，最多重试2次
        if (tryCount < 2) {
          setTimeout(function() {
            self._doDB(collection, data, callback, tryCount + 1);
          }, 1500 * (tryCount + 1));
        } else {
          if (callback) callback(false);
        }
      });
    } catch (e) {
      console.warn('数据库操作异常:', e);
      if (tryCount < 2) {
        setTimeout(function() {
          self._doDB(collection, data, callback, tryCount + 1);
        }, 1500 * (tryCount + 1));
      } else {
        if (callback) callback(false);
      }
    }
  },

  // 记录访问量
  addVisitor: function() {
    if (!this.inited) this.init();
    var data = {
      page: window.location.pathname,
      url: window.location.href,
      ua: navigator.userAgent,
      timestamp: new Date()
    };
    this._doDB('visitors', data);
  },

  // 保存问卷提交数据
  addSubmission: function(formData, matchResult, callback) {
    if (!this.inited) this.init();

    var priority = matchResult && matchResult.priority ? matchResult.priority : [];
    var backup = matchResult && matchResult.backup ? matchResult.backup : [];

    var getProductNames = function(arr) {
      var result = [];
      for (var i = 0; i < arr.length; i++) {
        var name = arr[i]['产品名称'] || arr[i].name || '';
        if (name) result.push(name);
      }
      return result;
    };

    var getFullNames = function(arr) {
      var result = [];
      for (var i = 0; i < arr.length; i++) {
        var bank = arr[i]['机构名称'] || arr[i].bank || '';
        var product = arr[i]['产品名称'] || arr[i].name || '';
        if (bank && product) {
          result.push(bank + ' - ' + product);
        } else if (product) {
          result.push(product);
        }
      }
      return result;
    };

    var getBanks = function(arr) {
      var result = [];
      for (var i = 0; i < arr.length; i++) {
        var bank = arr[i]['机构名称'] || arr[i].bank || '';
        if (bank && result.indexOf(bank) === -1) {
          result.push(bank);
        }
      }
      return result;
    };

    var priorityNames = getProductNames(priority);
    var backupNames = getProductNames(backup);
    var priorityFull = getFullNames(priority);
    var backupFull = getFullNames(backup);
    var priorityBanks = getBanks(priority);
    var backupBanks = getBanks(backup);

    var data = {
      company_name: String(formData.company_name || ''),
      entity_type: String(formData.entity_type || ''),
      industry: String(formData.industry || ''),
      years_established: Number(formData.years_established) || 0,
      annual_revenue: Number(formData.annual_revenue) || 0,
      loan_amount: Number(formData.loan_amount) || 0,
      loan_term: Number(formData.loan_term) || 0,
      guarantee_types: formData.guarantee_types || [],
      qualifications: formData.qualifications || [],
      is_tech: (formData.qualifications || []).indexOf('科技型企业资质') > -1 ? '是' : '否',
      match_priority: priorityNames,
      match_backup: backupNames,
      match_priority_full: priorityFull,
      match_backup_full: backupFull,
      match_priority_banks: priorityBanks,
      match_backup_banks: backupBanks,
      match_priority_count: priorityNames.length,
      match_backup_count: backupNames.length,
      ua: navigator.userAgent,
      submitted_at: new Date()
    };

    this._doDB('submissions', data, callback);
  }
};

// 自动初始化
if (typeof window !== 'undefined') {
  window.CloudDB = CloudDB;
  // 页面加载完成后自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      CloudDB.init();
    });
  } else {
    CloudDB.init();
  }
}
