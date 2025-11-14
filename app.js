
// WeightMate v3.1 PWA — ES5 only
(function(){
  var VERSION = '3.1.0';
  var jsBadge = document.getElementById('jsBadge');
  var errorBar = document.getElementById('error');
  function showError(msg){ errorBar.style.display='block'; errorBar.textContent='Error: '+msg; }

  try{
    // PWA SW register (safe)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function(){
        navigator.serviceWorker.register('sw.js?v='+VERSION).catch(function(e){ console.log('SW fail', e); });
      });
    }

    var STORAGE_KEY='weightmate_v31_pwa';
    var state = loadState();

    function loadState(){
      try{
        var s = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if(!s) throw 'empty';
        if(!s.targets) s.targets = {kids:3, like:5, love:8, gh:12};
        if(!s.employees) s.employees = ['Sarah','Gavin','Edward','Brianna'];
        if(!s.log) s.log = [];
        if(typeof s.varianceOz !== 'number') s.varianceOz = 1.0;
        if(!s.theme) s.theme='dark';
        return s;
      }catch(e){
        return { theme:'dark', employees:['Sarah','Gavin','Edward','Brianna'], targets:{kids:3,like:5,love:8,gh:12}, varianceOz:1.0, log:[] };
      }
    }
    function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

    // Tabs
    var tabWeighBtn = document.getElementById('tabWeighBtn');
    var tabReportsBtn = document.getElementById('tabReportsBtn');
    var tabSettingsBtn = document.getElementById('tabSettingsBtn');

    tabWeighBtn.addEventListener('click', function(){ showTab('weigh'); }, false);
    tabReportsBtn.addEventListener('click', function(){ showTab('reports'); renderDayInit(); }, false);
    tabSettingsBtn.addEventListener('click', function(){ showTab('settings'); renderSettings(); }, false);

    function showTab(tab){
      var btns = document.getElementsByClassName('tab-btn');
      for(var i=0;i<btns.length;i++){ btns[i].classList.remove('active'); }
      if(tab==='weigh') tabWeighBtn.classList.add('active');
      if(tab==='reports') tabReportsBtn.classList.add('active');
      if(tab==='settings') tabSettingsBtn.classList.add('active');
      var tabs = document.getElementsByClassName('tab');
      for(var j=0;j<tabs.length;j++){ tabs[j].classList.remove('active'); }
      document.getElementById('tab-'+tab).classList.add('active');
    }

    // Theme
    applyTheme(state.theme);
    function applyTheme(theme){
      document.documentElement.setAttribute('data-theme', theme);
      var meta=document.querySelector('meta[name="theme-color"]');
      if(meta){ meta.setAttribute('content', theme==='dark' ? '#111827' : '#ffffff'); }
    }

    // Employees
    var employeeSelect = document.getElementById('employeeSelect');
    var addEmployeeBtn = document.getElementById('addEmployeeBtn');
    function renderEmployees(){
      employeeSelect.innerHTML='';
      for(var i=0;i<state.employees.length;i++){
        var opt=document.createElement('option'); opt.value=state.employees[i]; opt.textContent=state.employees[i]; employeeSelect.appendChild(opt);
      }
      renderEmpChips();
    }
    function renderEmpChips(){
      var box=document.getElementById('empList'); box.innerHTML='';
      for(var i=0;i<state.employees.length;i++){
        (function(name){
          var chip=document.createElement('div');
          chip.className='size-pill';
          chip.style.margin='4px';
          chip.textContent=name+' ';
          var x=document.createElement('button'); x.className='btn'; x.textContent='✕';
          x.addEventListener('click', function(){
            if(!confirm('Remove '+name+'?')) return;
            var next=[]; for(var k=0;k<state.employees.length;k++){ if(state.employees[k]!==name) next.push(state.employees[k]); }
            state.employees=next; save(); renderEmployees();
          }, false);
          chip.appendChild(x); box.appendChild(chip);
        })(state.employees[i]);
      }
    }
    addEmployeeBtn.addEventListener('click', function(){
      var name = prompt('Employee name');
      if(!name) return;
      for(var i=0;i<state.employees.length;i++){ if(state.employees[i]===name){ alert('Already exists.'); return; } }
      state.employees.push(name); save(); renderEmployees(); employeeSelect.value=name;
    }, false);

    // Sizes
    var currentSize='kids';
    function updateTargetsUI(){
      var key = (currentSize==='kids')?'kids':(currentSize==='like')?'like':(currentSize==='love')?'love':'gh';
      document.getElementById('targetOz').textContent = Number(state.targets[key]||0).toFixed(2).replace(/\.00$/,'');
      document.getElementById('varianceOz').textContent = Number(state.varianceOz).toFixed(2).replace(/\.00$/,'');
    }
    var sizeGroup = document.getElementById('sizeGroup');
    sizeGroup.addEventListener('change', function(e){
      var t = e.target;
      if(t && t.name==='size'){ currentSize = t.value; updateTargetsUI(); }
    }, false);

    // Weigh flow
    var checkBtn = document.getElementById('checkBtn');
    var resetBtn = document.getElementById('resetBtn');
    var resultBox = document.getElementById('result');
    checkBtn.addEventListener('click', function(){
      var emp = employeeSelect.value;
      if(!emp){ alert('Select an employee.'); return; }
      var actual = parseFloat(document.getElementById('actualInput').value);
      if(isNaN(actual)){ alert('Enter actual weight in ounces.'); return; }
      var key = (currentSize==='kids')?'kids':(currentSize==='like')?'like':(currentSize==='love')?'love':'gh';
      var target = parseFloat(state.targets[key]);
      var delta = +(actual - target).toFixed(2);
      var pass = Math.abs(delta) <= state.varianceOz + 1e-9;
      state.log.push({ts:Date.now(), emp:emp, size:key, actual:actual, target:target, delta:delta, pass:pass});
      save();
      resultBox.style.display='block';
      resultBox.className='result ' + (pass?'good':'bad');
      var direction = delta>0?'OVER':'UNDER';
      resultBox.innerHTML = pass ?
        ('✅ <b>Good!</b> '+emp+' hit <b>'+actual+'</b> vs target <b>'+target+'</b> (Δ '+delta+').') :
        ('❌ <b>'+direction+'</b> by <b>'+Math.abs(delta)+'</b>. Try again until within ±'+state.varianceOz+'.');
    }, false);
    resetBtn.addEventListener('click', function(){
      document.getElementById('actualInput').value='';
      resultBox.style.display='none'; resultBox.className='result'; resultBox.textContent='';
    }, false);

    // Reports
    var reportDate = document.getElementById('reportDate');
    var reportGoBtn = document.getElementById('reportGoBtn');
    var exportCsvDayBtn = document.getElementById('exportCsvDayBtn');
    var exportCsvBtn = document.getElementById('exportCsvBtn');
    var clearDayBtn = document.getElementById('clearDayBtn');
    function renderDayInit(){ if(!reportDate.value){ reportDate.value = (new Date()).toISOString().slice(0,10); } renderDay(); }
    function renderDay(){
      var input = reportDate.value;
      if(input && !/^\d{4}-\d{2}-\d{2}$/.test(input)){ alert('Enter date as YYYY-MM-DD'); return; }
      var d = input ? new Date(input+'T00:00:00') : new Date();
      var start = +new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
      var end   = +new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);
      var tbody = document.querySelector('#logTable tbody'); tbody.innerHTML='';
      var passCount=0, rows=0;
      for(var i=0;i<state.log.length;i++){
        var r = state.log[i];
        if(r.ts>=start && r.ts<=end){
          rows++; if(r.pass) passCount++;
          var tr = document.createElement('tr');
          var t = new Date(r.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
          tr.innerHTML = '<td>'+t+'</td><td>'+r.emp+'</td><td>'+r.size+'</td><td>'+r.actual+'</td><td>'+r.target+'</td><td>'+r.delta+'</td><td>'+(r.pass?'✅':'—')+'</td>';
          tbody.appendChild(tr);
        }
      }
      document.getElementById('todaySummary').textContent = input+' • '+rows+' attempts • '+passCount+' passed';
    }
    reportGoBtn.addEventListener('click', renderDay, false);
    exportCsvDayBtn.addEventListener('click', function(){
      var input = reportDate.value;
      var d = input ? new Date(input+'T00:00:00') : new Date();
      var start = +new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
      var end   = +new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);
      var rows = [['Timestamp','Employee','Size','Actual (oz)','Target (oz)','Delta (oz)','Pass']];
      for(var i=0;i<state.log.length;i++){
        var r = state.log[i];
        if(r.ts>=start && r.ts<=end){
          rows.push([new Date(r.ts).toISOString(), r.emp, r.size, r.actual, r.target, r.delta, r.pass?'yes':'no']);
        }
      }
      downloadCsv(rows, 'weightmate-'+(input||'today')+'.csv');
    }, false);
    exportCsvBtn.addEventListener('click', function(){
      var rows = [['Timestamp','Employee','Size','Actual (oz)','Target (oz)','Delta (oz)','Pass']];
      for(var i=0;i<state.log.length;i++){
        var r = state.log[i];
        rows.push([new Date(r.ts).toISOString(), r.emp, r.size, r.actual, r.target, r.delta, r.pass?'yes':'no']);
      }
      downloadCsv(rows, 'weightmate-log-all.csv');
    }, false);
    clearDayBtn.addEventListener('click', function(){
      var input = reportDate.value;
      var d = input ? new Date(input+'T00:00:00') : new Date();
      var start = +new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
      var end   = +new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);
      if(!confirm('Clear entries for '+(input||'today')+'?')) return;
      var next=[];
      for(var i=0;i<state.log.length;i++){
        var r = state.log[i];
        if(r.ts < start || r.ts > end) next.push(r);
      }
      state.log = next; save(); renderDay();
    }, false);

    function downloadCsv(rows, filename){
      var csv='';
      for(var i=0;i<rows.length;i++){
        var row=rows[i];
        for(var j=0;j<row.length;j++){
          var str=String(row[j]);
          row[j] = /[",\n]/.test(str)? '"'+str.replace(/"/g,'""')+'"' : str;
        }
        csv += row.join(',') + '\n';
      }
      var blob=new Blob([csv], {type:'text/csv;charset=utf-8;'});
      var url=(window.URL||window.webkitURL).createObjectURL(blob);
      var a=document.createElement('a'); a.href=url; a.download=filename;
      document.body.appendChild(a); a.click(); a.parentNode.removeChild(a);
      (window.URL||window.webkitURL).revokeObjectURL(url);
    }

    // Settings
    var tKids=document.getElementById('tKids');
    var tLike=document.getElementById('tLike');
    var tLove=document.getElementById('tLove');
    var tGhi=document.getElementById('tGhi');
    var tVar=document.getElementById('tVar');
    var themeSelect=document.getElementById('themeSelect');
    var saveSettingsBtn=document.getElementById('saveSettingsBtn');
    var resetDefaultsBtn=document.getElementById('resetDefaultsBtn');
    var empAddBtn=document.getElementById('empAddBtn');
    var forceRefreshBtn=document.getElementById('forceRefreshBtn');

    function renderSettings(){
      tKids.value = state.targets.kids;
      tLike.value = state.targets.like;
      tLove.value = state.targets.love;
      tGhi.value  = state.targets.gh;
      tVar.value  = state.varianceOz;
      themeSelect.value = state.theme;
    }
    saveSettingsBtn.addEventListener('click', function(){
      var kids=parseFloat(tKids.value), like=parseFloat(tLike.value), love=parseFloat(tLove.value), gh=parseFloat(tGhi.value), v=parseFloat(tVar.value);
      if(isNaN(kids)||isNaN(like)||isNaN(love)||isNaN(gh)||isNaN(v)){ alert('Enter numeric targets/variance.'); return; }
      state.targets.kids=kids; state.targets.like=like; state.targets.love=love; state.targets.gh=gh; state.varianceOz=v; state.theme=themeSelect.value;
      save(); applyTheme(state.theme); updateTargetsUI(); alert('Saved.'); renderEmployees();
    }, false);
    resetDefaultsBtn.addEventListener('click', function(){
      if(!confirm('Reset targets & variance to defaults?')) return;
      state.targets={kids:3,like:5,love:8,gh:12}; state.varianceOz=1.0; save(); renderSettings(); updateTargetsUI();
    }, false);
    empAddBtn.addEventListener('click', function(){
      var val = document.getElementById('empNameInput').value; if(!val){ return; }
      for(var i=0;i<state.employees.length;i++){ if(state.employees[i]===val){ alert('Already exists.'); return; } }
      state.employees.push(val); save(); document.getElementById('empNameInput').value=''; renderEmployees();
    }, false);

    // Force Refresh (kills caches + updates SW)
    forceRefreshBtn.addEventListener('click', function(){
      if(!confirm('Force refresh app files now?')) return;
      if ('caches' in window) {
        caches.keys().then(function(names){
          return Promise.all(names.map(function(n){ return caches.delete(n); }));
        }).then(function(){
          if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
            return navigator.serviceWorker.getRegistrations().then(function(regs){
              return Promise.all(regs.map(function(r){ return r.unregister(); }));
            });
          }
        }).then(function(){
          alert('Cache cleared. Reload the page.');
          window.location.reload(true);
        });
      } else {
        window.location.reload(true);
      }
    }, false);

    // Initial renders
    renderEmployees();
    updateTargetsUI();
    renderSettings();
    renderDayInit();

    // JS ready
    jsBadge.className='badge ok';
    jsBadge.textContent='JS: ready';

  }catch(ex){
    showError(ex && ex.message? ex.message : String(ex));
  }
})();
