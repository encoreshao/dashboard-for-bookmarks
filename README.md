# Dashboard for Bookmarks - Chrome Exntesion

### Review already installed extensions

  * Open your Chrome and visit the URL chrome://extensions - Enjoy it!

  <img src="https://github.com/encoreshao/dashboard-for-bookmarks/blob/master/demo/normal-listing.png" />

### Developer mode in chrome://extensions

  * Check Developer mode in chrome://extensions
  * Loading your local copy of the extension on Chrome is super easy:
  * Click Load unpacked extension... and select the extension app directory

To see your changes, click the Reload (Ctrl+R) link in chrome://extensions. If you want to create a Pack extension just make a zip file of the extension app directory.

### Setting - options

The extension can be configured via an options page.
To open the options page, right-click the extension icon and choose Options on the menu. You can also go to chrome://extensions and click the options link.

  * Banner Name
  * Background Image
  * Display Mode
  * Theme
  * Clock

  <img src="https://github.com/encoreshao/dashboard-for-bookmarks/blob/master/demo/settings.png" />

### How to release new version

  - 1: updates version number

    1. manifest.json - update latest version

  - 2: generate release zip

    1. mv ../pems/dashboards_for_bookmarks.pem key.pem
    2. zip -r dashboards_for_bookmarks_vx_x_x.zip . -x *.git* -x *.DS_Store*
    3. mv key.pem ../pems/dashboards_for_bookmarks.pem
    4. mv dashboards_for_bookmarks_vx_x_x.zip ../packages

  - 3: upload zip file to chrome store

    1. go to [Web Store](https://chrome.google.com/webstore/developer/dashboard)
    2. choose and uoload dashboards_for_bookmarks_vx_x_x.zip

### Online Compress js tool

  - http://jscompress.com/
