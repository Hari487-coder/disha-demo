# Disha: voice orb + chatbot demo

The live demo behind the QR code on the marketing showcase poster. Visitors open it on their phone,
tap the glass orb and talk to Disha, or tap "Chat with Disha" and type.

Live link: https://hari487-coder.github.io/disha-demo/ (the QR code points here, so keep this address)

## What runs where

| Part | Where it lives |
|---|---|
| Disha herself: prompt, IITH facts, voice, greeting, call limits | The assistant "Disha - IITH campus guide (showcase demo)" in the Assistable Demo Account |
| Voice calls from the orb | The Programmable button widget "Disha - hero orb button (showcase demo)", loaded from `botdisplay.com/button.js` |
| The chat window | The Chat widget V2 "Disha - chat (showcase demo)" (ID `cmw4okkjj005xl708cd1knq81`): colours, intro message, suggested questions, disclaimer, allowed domains |
| The page: orb, headline, sections, footer | `index.html`, `style.css`, `app.js` in this repo |

So most changes happen in the Assistable dashboard, not here. Edit the assistant to change what
Disha says. Edit the chat widget to change how the chat window looks. Changes there show up on the
site within about 5 minutes, with no commit needed.

## Editing this site (the QR link never changes)

1. Open this repository on GitHub.
2. Click the file you want to change, then the pencil icon.
3. Edit and press **Commit changes**. The live site updates in about a minute.

| To change | Edit |
|---|---|
| Headline, "Try asking" questions, the pain and fix cards, footer | `index.html` |
| Colours, sizes, layout | `style.css` |
| The orb's status messages ("Tap the orb to talk", errors) | the `TEXT` list at the top of `app.js` |
| The call button's labels for screen readers | the `data-button-text` lines on the `button.js` script tag in `index.html` |

## How the orb works

- `button.js` adds an invisible call button over the glass orb, so a tap on the orb starts a real
  voice call with Disha. The phone asks for the microphone the first time.
- `app.js` watches that button and changes the orb's state: connecting, listening, Disha speaking,
  call ended, or an error with a nudge towards the chat. A timer under the orb counts up to the
  3-minute limit.
- While Disha talks, `app.js` measures the volume of her voice and the orb swells and glows with it.
  On iPhones and in Safari the orb pulses on a steady beat instead, because reading call audio there
  can mute it.
- Browsers built into some apps and QR scanners can't make calls. The page spots this and points
  people to Chrome, Safari or the chat.
- A call ends when the visitor taps the orb again, at 3 minutes, after 30 to 45 seconds of silence
  (the setting is 30 seconds, and the platform may apply its 45-second minimum), or when the phone
  switches to another app or locks.
- To test without a phone, add `?novoice` (a browser that can't call) or `?nolevel` (the iPhone
  behaviour) to the address.

## Privacy

Calls and chats are recorded and kept in the Demo Account so the team can review how Disha did.
Disha never asks for personal details. Her facts come from IIT Hyderabad's public pages, checked
5 November 2026.

## Files

- `orb.webp`: the glass orb render (1200 px, the same artwork as the poster)
- `avatar.png`: the orb on a dark square, used as the chat widget's avatar and the favicon

Student demo for the IIT Hyderabad marketing showcase. Not an official IITH service.
