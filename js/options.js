var defaultName = 'Guest';

function loadOptions() {
  var userName = localStorage["BDUserName"];
  if (userName == undefined) {
    userName = defaultName;
    localStorage["BDUserName"] = userName;
  }

  updateEventText(localStorage["BDUserName"], '');

  checkAndSetupDefaultValue('DBBackgroundImage', 'enable');
  checkAndSetupDefaultValue('DBThemeColor', 'dark');
  checkAndSetupDefaultValue('DBClock', 'disabled');
  checkAndSetupDefaultValue('DBMode', 'list');
}

function checkAndSetupDefaultValue(name, defaultValue) {
  var value = localStorage[name];
  if (value == undefined) {
    value = defaultValue;
    localStorage[name] = value;
  }
  var radios = document.getElementsByName(name);

  if (radios.length > 0) {
    for (var i = 0; i < radios.length; i++) {
      var radio = radios[i];

      if (radio.value == value) {
        radio.setAttribute('checked', 'checked');
        break
      }
    }
  }
}

function saveOptions() {
  setBannerNameTolocalStorage('BDUserName');

  savingCheckedRadioValueTolocalStorage('DBBackgroundImage');
  savingCheckedRadioValueTolocalStorage('DBThemeColor');
  savingCheckedRadioValueTolocalStorage('DBClock');
  savingCheckedRadioValueTolocalStorage('DBMode');

  updateEventText(localStorage["BDUserName"], "Ok");
}

function setBannerNameTolocalStorage(name) {
  localStorage[name] = document.getElementById(name).value;
}

function savingCheckedRadioValueTolocalStorage(name) {
  var element = document.getElementsByName(name);

  for (var i = 0; i < element.length; i++) {
    if (element[i].checked == true) {
      localStorage[name] = element[i].value;
    }
  }
}

function eraseOptions() {
  localStorage["BDUserName"] = defaultName;
  localStorage["DBBackgroundImage"] = 'enable';
  localStorage["DBThemeColor"] = 'dark';
  localStorage["DBClock"] = 'disabled';
  localStorage["DBMode"] = 'list';

  location.reload();
}

function updateEventText(userName, msg) {
  $("#BDUserName").val(userName);

  if (msg == 'Ok') { window.close(); }
}

window.addEventListener("load", function(e) {
  document.getElementById("Update").addEventListener("click", saveOptions);
  document.getElementById("Clean").addEventListener("click", eraseOptions);
  loadOptions();
})
