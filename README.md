# Bookmark Dashboard

A clean, modern Chrome extension that replaces your new tab with an organized, searchable bookmark dashboard.

## Features

- Browse all Chrome bookmarks organized by folder
- Search bookmarks by title or URL
- Grid and list view modes
- Dark / light theme
- Optional clock with greeting
- Customizable display name

## Install (Developer Mode)

1. Clone this repository
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project folder
5. Open a new tab

## Settings

Open the settings page from the gear icon in the top bar, or right-click the extension icon and choose **Options**.

- **Display Name** -- shown in the greeting
- **Theme** -- dark or light
- **Display Mode** -- grid or list
- **Clock** -- enable or disable

## Project Structure

```
├── manifest.json           # Chrome extension manifest (v3)
├── src/
│   ├── index.html          # New tab dashboard
│   └── options/
│       └── index.html      # Settings page
├── css/
│   ├── main.css            # Dashboard styles
│   └── options.css         # Settings styles
├── js/
│   ├── app.js              # Dashboard logic
│   ├── options.js          # Settings logic
│   └── service-worker.js   # Background service worker
├── icons/                  # Extension icons (16, 48, 128px)
└── scripts/
    └── release.sh          # Release zip builder
```

## Release

### 1. Update the version

Edit `manifest.json` and bump the `"version"` field.

### 2. Build the release zip

```bash
./scripts/release.sh
```

The script will:
- Read the version from `manifest.json` (or pass one: `./scripts/release.sh 1.2.0`)
- Bundle only the files Chrome needs (no git, no dev files)
- Include `key.pem` from `config/credentials/key.pem` if it exists (keeps the extension ID consistent across updates)
- Output to `dist/bookmark-dashboard-v{version}.zip`

Options:
- `./scripts/release.sh --no-key` -- skip PEM key bundling

### 3. Upload to Chrome Web Store

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Upload `dist/bookmark-dashboard-v{version}.zip`

### PEM Key

The private key (`key.pem`) maintains a consistent extension ID across published updates. Store it at:

```
config/credentials/key.pem
```

This directory is git-ignored. The release script handles copying it in and cleaning it up automatically. Never commit the PEM key to the repository.

## Author

[Encore Shao](https://github.com/encoreshao)
