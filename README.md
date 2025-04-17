# Purgify

A Chrome extension for grammar fixing and rephrasing using local LLMs via Ollama.

## Overview

Purgify is a writing enhancement tool that uses local language models to help you fix grammar issues and rephrase text while preserving meaning and tone. It integrates with Ollama to provide these capabilities without sending your text to remote servers.

## Features

- ✅ **Grammar Fix** - Corrects grammar issues while preserving the original tone and meaning
- 🔁 **Rephrase** - Rewrites text with different wording while keeping the same meaning and tone
- 🏠 **Local Processing** - Uses Ollama for local LLM processing, ensuring your text never leaves your computer
- 🚀 **Floating Interface** - Provides a non-intrusive floating UI similar to Grammarly

## Quick Setup for New Users

### Automatic Setup (Recommended)

1. **Install the Extension**
   - Load the extension in Chrome from the `dist` folder (see installation instructions below)
   
2. **Run the Setup Assistant**
   - Click the Purgify extension icon in your browser toolbar
   - If Ollama is not connected, you'll see a "Run Setup Assistant" button
   - Click this button to open the setup guide which will help you:
     - Install Ollama if it's not already installed
     - Set up the OLLAMA_ORIGINS environment variable
     - Pull the TinyLlama model
     - Configure Ollama to run with Chrome extension support
     - Set up automatic startup (optional)
   
   The setup assistant provides platform-specific instructions for macOS, Linux, and Windows.

### Manual Setup

#### Prerequisites

- [Ollama](https://ollama.ai/) installed on your system
- TinyLlama model or another compatible model

#### Steps

1. **Set the OLLAMA_ORIGINS environment variable and start Ollama (macOS/Linux):**

   ```sh
   export OLLAMA_ORIGINS="chrome-extension://*"
   ollama serve
   ```

   This sets the variable for the current terminal session. If you close the terminal, you will need to run these commands again before starting Ollama.

2. **For Windows:**

   ```bat
   set OLLAMA_ORIGINS=chrome-extension://*
   ollama serve
   ```

2. **Pull the TinyLlama model**:
   ```
   ollama pull tinyllama
   ```

3. **Start Ollama**:
   ```
   ollama serve
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

## Troubleshooting

If you encounter a "403 Forbidden" error, it means that the OLLAMA_ORIGINS environment variable is not set correctly. Make sure:

1. Ollama is running
2. OLLAMA_ORIGINS is set to "chrome-extension://*"
3. You've restarted Ollama after setting the environment variable

The automated setup assistant can fix these issues for you.

## Purgify Options

- **Ollama Model**: Select your desired model (e.g. `tinyllama` or `deepseek-coder`)
- **Ollama Host**: Select desired host (defaults to `http://localhost:11434`)
- **Prompt Templates**: Customize the prompts used for grammar fixing and rephrasing
