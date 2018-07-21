var DBookmarks = {
  is_debug: true,
  show_msg: function(title, msg, btn, notification_id, callback) {
    var notifications_contents = {
      type: 'basic',
      title: title,
      message: msg
    };
    if (btn) {
      notifications_contents.buttons = btn;
    }
    if (typeof callback != 'function') {
      callback = function() {};
    }
    if (!notification_id) {
      notification_id = '';
    }
    chrome.notifications.create(notification_id, notifications_contents, callback);
  },
  debug: function(t) {
    if (DBookmarks.is_debug) {
      console.log(t);
    }
  },
  getQueryString: function(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return (r[2]);
    return null;
  },
  getRandomInt: function(maxNumber) {
    return (Math.floor(Math.random() * maxNumber) + 1);
  },
  randomString: function(len) {　　
    len = len || 32;　　
    var $chars = 'ABCDEFGHJKLMNPQRSTWXYZabcdefhijklmnoprstwxyz012345678';　　
    var maxPos = $chars.length;　　
    var pwd = '';　　
    for (i = 0; i < len; i++) {　　　　 pwd += $chars.charAt(Math.floor(Math.random() * maxPos));　　 }　　
    return pwd;
  },
  moveDiv: function(div, fps) {
    var left = 0,
      leftParam = 1,
      width = document.body.clientWidth;

    function redraw() {
      left += leftParam * 2;
      if (left > width) {
        left = width, leftParam = -1;
      } else if (left < 0) {
        left = 0, leftParam = 1;
      }
      div.style.left = left + "px";
    }
    setInterval(redraw, 1000 / fps);
  },
  drawCanvas: function(id) {
    var canvas = document.getElementById('canvas');
    var content = canvas.getContext('2d');

    switch (id) {
      case 1:
        content.fillStyle = "#FF0000";
        content.fillRect(10, 10, 100, 50);
        break;
      case 2:
        content.beginPath();
        content.moveTo(10, 10);
        content.lineTo(100, 100);
        content.stroke();
        break;
      case 3:
        content.font = "20px Arial";
        content.fillText("Encore Shao", 10, 50);
        break;
      case 4:
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        var radius = 70;

        content.beginPath();
        content.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        content.fillStyle = '#3367d6';
        content.fill();
        content.lineWidth = 5;
        content.strokeStyle = '#333333';
        content.stroke();
        break;
    }
  },
  create5Star: function(context) {
    var n = 0;
    var dx = 100;
    var dy = 0;

    var s = 50;
    //创建路径
    context.beginPath();
    context.fillStyle = 'rgba(255,0,0,0.5)';
    var x = Math.sin(0);
    var y = Math.cos(0);
    var dig = Math.PI / 5 * 4;
    for (var i = 0; i < 5; i++) {
      var x = Math.sin(i * dig);
      var y = Math.cos(i * dig);
      context.lineTo(dx + x * s, dy + y * s);
    }
    context.closePath();
  },
  draw11: function(id) {
    var canvas = document.getElementById(id);
    if (canvas == null)
      return false;
    var context = canvas.getContext("2d");
    context.fillStyle = "#3367d6";
    context.fillRect(0, 0, 300, 300);

    context.shadowOffsetX = 10;
    context.shadowOffsetY = 10;
    context.shadowColor = 'rgba(100, 100, 100, 0.5)';
    context.shadowBlur = 5;
    //图形绘制
    context.translate(0, 0);
    for (var i = 0; i < 2; i++) {
      context.translate(50, 50);
      create5Star(context);
      context.fill();
    }
  },
  showingName: function() {
    var userName = window.localStorage.BDUserName;

    if (userName == undefined) {
      userName = 'Guest';
    }
    return userName;
  },
  addingName: function(e) {
    var userName = $(this).val();
    if (e.keyCode == 13 && userName != '') {
      window.localStorage.BDUserName = userName;
    }
  },
  showingInput: function(e) {
    var userName = $(this).text();
    if (userName != '') {
      $('span#name').text(userName);
    }
  },
  displayStatus: function() {
    var hrs = new Date().getHours();
    var msg = "";

    if (hrs == 0) msg = "Midnight";
    if (hrs > 0) msg = "Mornin' Sunshine";
    if (hrs > 6) msg = "Good Morning";
    if (hrs > 12) msg = "Good Afternoon";
    if (hrs > 17) msg = "Good Evening";
    if (hrs > 22) msg = "Go to bed";

    msg += ",  " + DBookmarks.showingName();

    $('div.visible').text(msg);
  },
  displayClockSection: function() {
    var DBClock = localStorage.DBClock;

    if (DBClock == undefined) { DBClock = 'disabled'; }
    if (DBClock != 'disabled') { $("#clock").removeClass('disabled'); }
  },
  loadingTheme: function(e) {
    var DBThemeColor = localStorage.DBThemeColor;

    if (DBThemeColor == undefined) { DBThemeColor = 'dark'; }
    $('.Ctheme').removeClass('dark light').addClass(DBThemeColor);
  },
  loadingDisplayMode: function(e) {
    var DBMode = localStorage.DBMode;

    if (DBMode == undefined) { DBMode = 'list'; }
    $('.Ctheme').removeClass('list card').addClass(DBMode);
  },
  adjustContentHeight: function(e) {
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();

    $("section.contents").css('height', windowHeight - 50);
  },
  loadingBackgroundImage: function(e) {
    var DBImage = localStorage.DBBackgroundImage;
    if (DBImage == undefined) { DBMode = 'enable'; }

    if (DBImage == 'enable') {
      $('body').css('background-image', "url('../images/" + DBookmarks.getRandomInt(12) + ".jpeg')");
    }
  }
}

var GetUid = {
  get: function() {
    if (window.localStorage.uid) {
      var uid = window.localStorage.uid;
    } else {
      var d = new Date();
      var uid = DBookmarks.randomString() + d.getSeconds() + d.getMinutes() + d.getMilliseconds();
      window.localStorage.uid = uid;
      var cpa_obj = new Cpa();
      cpa_obj.sendEvent('Users', uid);
    }
    return uid;
  }
}

Date.prototype.Format = function(fmt) { //author: meizz
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

Array.prototype.isKeyExist = function(key) {
  for (var i in this) {
    if (key == i) {
      return true;
    } else {
      return false;
    }
  }
}
