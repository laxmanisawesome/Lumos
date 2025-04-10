# Purgify

A Chrome extension for grammar fixing and rephrasing using local LLMs via Ollama.

## Overview

Purgify is a writing enhancement tool that uses local language models to help you fix grammar issues and rephrase text while preserving meaning and tone. It integrates with Ollama to provide these capabilities without sending your text to remote servers.

## Features

- ✅ **Grammar Fix** - Corrects grammar issues while preserving the original tone and meaning
- 🔁 **Rephrase** - Rewrites text with different wording while keeping the same meaning and tone
- 🏠 **Local Processing** - Uses Ollama for local LLM processing, ensuring your text never leaves your computer
- 🚀 **Floating Interface** - Provides a non-intrusive floating UI similar to Grammarly

## Ollama Server Setup

A local Ollama server is needed for LLM inference. Download and install Ollama [here](https://ollama.ai/).

### Pull Model

```
ollama pull tinyllama
```
or
```
ollama pull deepseek-coder
```

### Start Server

```
OLLAMA_ORIGINS=chrome-extension://* ollama serve
```

Note: The environment variable `OLLAMA_ORIGINS` must be set to `chrome-extension://*` to allow requests originating from the Chrome extension.

### macOS

Run `launchctl setenv` to set `OLLAMA_ORIGINS`.
```
launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"
```

### Docker

The Ollama server can also be run in a Docker container:
```
docker run -e OLLAMA_ORIGINS="chrome-extension://*" -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

## Chrome Extension Setup

In the project directory, you can run:

### `npm test`

Launches the test runner.

### `npm run lint`

Runs `eslint` and `prettier` on `src` and `__tests__` files.

### `npm run build`

Builds the app for production to the `dist` folder.

### Load Unpacked Extension (Install)

Follow these steps to install the extension:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `dist` folder from this project

## Purgify Options

- **Ollama Model**: Select your desired model (e.g. `tinyllama` or `deepseek-coder`)
- **Ollama Host**: Select desired host (defaults to `http://localhost:11434`)
- **Prompt Templates**: Customize the prompts used for grammar fixing and rephrasing
