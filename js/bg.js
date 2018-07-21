function openChromeInternalPage(chromeExtURL) {
  chrome.tabs.getAllInWindow(null, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].url == chromeExtURL) {
        chrome.tabs.update(tabs[i].id, { selected: true })
        return;
      }
    }
    chrome.tabs.create({ url: chromeExtURL, selected: true })
  })
}

chrome.runtime.onMessage.addListener(function(request) {
  if (request.method == 'downloads' || request.method == 'extensions') {
    openChromeInternalPage("chrome://" + request.method + '/');
  }
});
