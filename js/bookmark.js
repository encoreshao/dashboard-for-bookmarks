window.searchKeyword == undefined;

if (window.localStorage.booksMenu == undefined) { window.localStorage.booksMenu = []; }

drawBookmarks = function() {
  chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
    $('#bookmarks').html(drawTreeNodes(bookmarkTreeNodes));
  });
}

drawTreeNodes = function(bookmarkNodes) {
  var list = $('<div />').addClass('rootNode');

  for (var i = 0; i < bookmarkNodes.length; i++) {
    list.append(drawNode(bookmarkNodes[i]));
  }
  return list;
}

drawNode = function(bookmarkNode) {
  var bookmarkTitle = bookmarkNode.title;
  if (bookmarkTitle) {
    var webLink = bookmarkNode.url;

    var item = $('<div />')
    if (!bookmarkNode.children) { item.addClass('item'); }
    var tag = $('<div />').addClass('tag');
    var icon = $('<div />').addClass('icon');
    var link = $('<div />').addClass('label-text');
    var anchor = $('<a />');
    var hoverText = $('<span />');

    anchor.text(bookmarkTitle);

    if (webLink != undefined) {
      if (webLink.startsWith('http')) {
        content = "content: -webkit-image-set(url(\"chrome://favicon/size/16@1x/" + webLink + "\") 1x, url(\"chrome://favicon/size/16@2x/" + webLink + "\") 2x);"
        icon.attr('style', content);

        anchor.attr('href', webLink);
        anchor.addClass('mLeft').attr('target', '_blank');
        hoverText.text(webLink);
      }
    } else {
      item.addClass('folder')
    }

    if (window.searchKeyword == undefined) {
      link.append(anchor).append(hoverText);
      item.append(icon).append(link);
    } else if (new RegExp(window.searchKeyword, 'i').exec(bookmarkTitle) || new RegExp(window.searchKeyword, 'i').exec(webLink)) {
      link.append(anchor).append(hoverText);
      item.append(icon).append(link);
    } else {
      item.addClass('disabled')
    }
  }
  var div = $('<div />').append(item);

  if (bookmarkNode.children && bookmarkNode.children.length > 0) {
    div.append(drawTreeNodes(bookmarkNode.children));
  }
  return div;
}
