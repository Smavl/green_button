# Green Button

Firefox extension that shows, on a GitHub repository's main page, whether the repo accepts
private vulnerability reports (the green "Report a vulnerability" button on `/security`).

## Where it shows up

A button is added at the start of the repo's action row, next to **Watch / Fork / Star**:

- Green **Report a vulnerability**: private reporting is on. Click it to open the report form.
- Grey, **No private reporting**: private reporting is off.
- Grey, **PVR: unknown**: the check failed (network error, rate limit).
- Grey, **Sign in to check PVR**: you are logged out. GitHub only shows the button to signed-in users.

You can hide the negative state in the extension's options.

## How it works

It fetches `https://github.com/<owner>/<repo>/security` with your session and looks for a
link to `/security/advisories/new`. Results are cached for 30 minutes per repo.

## Install (development)

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…** and select `manifest.json`

Package it with `npx web-ext build`.
