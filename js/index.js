$(function() {
  var bookContents = $('section.contents'),
    backToTop = $('#back-to-top');

  DBookmarks.loadingBackgroundImage();
  DBookmarks.displayStatus();
  DBookmarks.displayClockSection();
  DBookmarks.loadingTheme();
  DBookmarks.loadingDisplayMode();
  DBookmarks.adjustContentHeight();

  drawBookmarks();

  $(window).resize(function() { DBookmarks.adjustContentHeight() });
  $(".ext-url").click(function(e) { chrome.runtime.sendMessage({ method: $(e.target).data('name') }) });
  $("#keyword").keyup(function(e) {
    window.searchKeyword = $(e.target).val();
    drawBookmarks();
  });

  bookContents.scroll(function() {
    if (bookContents.scrollTop() < 5) {
      backToTop.hide();
    } else {
      backToTop.show();
    }
  })

  backToTop.click(function(e) {
    backToTop.hide();
    bookContents.animate({ scrollTop: 0 }, '500');
  });
});
