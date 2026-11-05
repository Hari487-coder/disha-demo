# Disha: voice orb + chatbot demo

The live demo behind the QR code on the marketing showcase poster. Visitors open it on their phone,
tap the orb and talk, or type in the chat box.

Live link: https://hari487-coder.github.io/disha-demo/

## How to edit it (the QR link never changes)

1. Open this repository on GitHub.
2. Click the file you want to change, then the pencil icon.
3. Edit and press **Commit changes**. The live site updates in about a minute.

| To change | Edit |
|---|---|
| What Disha knows and says | `knowledge.js`: each topic has keywords and an answer |
| The suggested questions | `starters` at the top of `knowledge.js` |
| The booking flow (the call-to-action demo) | `flows.visit` at the bottom of `knowledge.js` |
| Headline, footer text | `index.html` |
| Colours and layout | `style.css` |

## How it works

- Voice in: the phone's built-in speech recognition (Chrome on Android, Safari on iPhone). If a
  browser doesn't support it, the orb asks the visitor to type instead.
- Voice out: the phone's built-in speech, with an Indian English voice when the phone has one.
- Answers: matched on the phone from `knowledge.js`. Nothing is sent to a server and nothing is
  stored. Facts come from IIT Hyderabad's public pages, checked 5 November 2026.

## Switching to the full AI agent later

When the full AI voice agent is ready, paste its website embed code into `index.html`, just before
`</body>`. Keep or remove the built-in orb as you like.

Student demo for the IIT Hyderabad marketing showcase. Not an official IITH service.
