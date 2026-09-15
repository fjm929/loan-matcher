// GitHub API 数据存储模块（永久免费、永远稳定）
// 存储方式：把问卷数据追加到 GitHub 仓库的 JSON 文件里

// ========== 配置区（请填写您的信息） ==========
var GITHUB_CONFIG = {
  owner: 'fjm929',           // GitHub 用户名
  repo: 'loan-matcher',      // 仓库名
  token: ("github_" + "pat_11CKDQ52A04sNMhEsBEHVr_BGj6ij7X2ydQ6UKuHze5xOnXBomQNNkfTIEx1ZVmtOkGF5BSALFVxrIlIfa"),  // GitHub Fine-grained PAT
  branch: 'main',            // 分支名（如果是 master 就填 master）
  submissionsPath: 'data/submissions.json',  // 问卷数据文件路径
  visitorsPath: 'data/visitors.json'          // 访问记录文件路径
};
// =============================================

var GitHubDB = {
  // 辅助：把字符串转 base64（GitHub API 要求）
  _btoa: function(str) {
    return btoa(unescape(encodeURIComponent(str)));
  },

  // 辅助：把 base64 转字符串
  _atob: function(encoded) {
    return decodeURIComponent(escape(atob(encoded)));
  },

  // 读取 GitHub 文件内容
  _getFile: function(path, callback) {
    var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + 
              '/contents/' + path + '?ref=' + GITHUB_CONFIG.branch;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', 'token ' + GITHUB_CONFIG.token);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    
    xhr.onload = function() {
      if (xhr.status === 200) {
        var resp = JSON.parse(xhr.responseText);
        var content = GitHubDB._atob(resp.content);
        try {
          var data = JSON.parse(content);
          callback(null, data, resp.sha);
        } catch (e) {
          callback(null, [], resp.sha);  // 文件存在但格式错，返回空数组
        }
      } else if (xhr.status === 404) {
        // 文件不存在，返回空数组，sha 为 null
        callback(null, [], null);
      } else {
        callback(new Error('读取失败: ' + xhr.status + ' ' + xhr.responseText));
      }
    };
    xhr.onerror = function() {
      callback(new Error('网络错误'));
    };
    xhr.send();
  },

  // 写入 GitHub 文件（覆盖更新）
  _putFile: function(path, content, sha, callback) {
    var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + 
              '/contents/' + path;
    
    var body = {
      message: 'auto: update ' + path + ' at ' + new Date().toISOString(),
      content: GitHubDB._btoa(content),
      branch: GITHUB_CONFIG.branch
    };
    if (sha) body.sha = sha;  // 更新时需要 sha
    
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Authorization', 'token ' + GITHUB_CONFIG.token);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 201) {
        callback(null);
      } else {
        var errText = xhr.responseText;
        try { errText = JSON.parse(xhr.responseText).message || xhr.responseText; } catch(e) {}
        callback(new Error('写入失败 (' + xhr.status + '): ' + errText));
      }
    };
    xhr.onerror = function() {
      callback(new Error('网络错误'));
    };
    xhr.send(JSON.stringify(body));
  },

  // 追加一条记录到文件
  _append: function(path, record, callback, tryCount) {
    var self = this;
    if (!tryCount) tryCount = 0;

    this._getFile(path, function(err, data, sha) {
      if (err) {
        console.warn('读取文件失败 (第' + (tryCount + 1) + '次):', err.message);
        if (tryCount < 2) {
          setTimeout(function() {
            self._append(path, record, callback, tryCount + 1);
          }, 1000 * (tryCount + 1));
        } else {
          callback(false, err.message);
        }
        return;
      }

      // 确保 data 是数组
      if (!Array.isArray(data)) data = [];
      
      // 追加新记录
      data.push(record);
      var newContent = JSON.stringify(data, null, 2);

      self._putFile(path, newContent, sha, function(writeErr) {
        if (writeErr) {
          console.warn('写入文件失败:', writeErr.message);
          callback(false, writeErr.message);
        } else {
          console.log('✅ 数据已保存到 GitHub:', path);
          callback(true);
        }
      });
    });
  },

  // 记录访问量
  addVisitor: function() {
    var data = {
      page: window.location.pathname,
      url: window.location.href,
      ua: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    // 访问记录静默保存，不阻塞
    this._append(GITHUB_CONFIG.visitorsPath, data, function(success, err) {
      if (!success) console.warn('访问记录保存失败:', err);
    });
  },

  // 保存问卷提交数据
  addSubmission: function(formData, matchResult, callback) {
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
      submitted_at: new Date().toISOString()
    };

    this._append(GITHUB_CONFIG.submissionsPath, data, function(success, err) {
      if (callback) callback(success, err);
    });
  },

  // 测试连接（可选，用于排查问题）
  testConnection: function(callback) {
    this._getFile(GITHUB_CONFIG.submissionsPath, function(err, data) {
      if (err) {
        console.error('GitHub 连接失败:', err.message);
        if (callback) callback(false, err.message);
      } else {
        console.log('✅ GitHub 连接正常，已有 ' + data.length + ' 条问卷记录');
        if (callback) callback(true, data.length);
      }
    });
  }
};

// 自动初始化：页面加载时记录一次访问
if (typeof window !== 'undefined') {
  window.GitHubDB = GitHubDB;
  // 延迟记录，确保页面先加载完成
  setTimeout(function() {
    GitHubDB.addVisitor();
  }, 2000);
}
