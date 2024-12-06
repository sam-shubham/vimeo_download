
# 🎬 Vimeo Private Video Downloader using Node.js 🚀

Welcome to the **Vimeo Private Video Downloader**! This project uses Node.js, axios, cheerio, and FFmpeg to download private Vimeo videos. Think of this repo as your treasure map to video-saving glory! 🏴‍☠️💾

## 🛠️ Requirements

Before you start, make sure you have the following installed:

- **Node.js** (v14 or later) - [Download Node.js](https://nodejs.org/)
- **FFmpeg** - A powerful tool for video and audio processing.

### How to Check if FFmpeg is Installed:

1. Open your terminal/command prompt.
2. Type the following command:

```bash
ffmpeg -version
```

If FFmpeg is installed, you'll see version details. 🎉

### Installing FFmpeg (If Not Already Installed):

- **Windows**: Download from the [official FFmpeg site](https://ffmpeg.org/download.html), extract the files, and add the `bin` folder to your system’s PATH.
- **MacOS**: Use Homebrew to install:

```bash
brew install ffmpeg
```

- **Linux**: Run this command:

```bash
sudo apt update && sudo apt install ffmpeg
```

Once installed, run `ffmpeg -version` again to verify everything’s working. 🚀

---

## ⚙️ Setup the Project

Follow these steps to set up the project folder and install dependencies:

1. Create a new project directory:

```bash
mkdir vimeo-downloader
cd vimeo-downloader
```

2. Initialize the Node.js project:

```bash
npm init -y
```

3. Install the required dependencies:

```bash
npm install axios cheerio cli-progress
```

These tools will be your map, compass, and flashlight for navigating Vimeo's hidden treasures. 🌌

---

## 🧙‍♂️ The Magic Script: `downloadVimeo.js`

This script will download private Vimeo videos by using a combination of axios (for HTTP requests), cheerio (for HTML parsing), and FFmpeg (for downloading the video stream).

### Code Breakdown:

#### 1. **Extract Vimeo Player Configuration** 🎥

We use `axios` to fetch the HTML page of the Vimeo video and `cheerio` to parse it. The function `extractVimeoPlayerConfig` grabs the important player configuration, including stream URLs and video details like title and duration.

```javascript
const response = await axios.get(url, {
  headers: { 
    "User-Agent": "Vimeo Downloader" 
  }
});
```

#### 2. **Downloading the Video Stream** ⬇️

Once we have the player configuration, the `downloadHLSStream` function uses **FFmpeg** to download the video stream. It tracks the download progress and updates it using the `cli-progress` library.

```javascript
const ffmpegArgs = [
  "-i", m3u8Url, 
  "-c", "copy", 
  "-bsf:a", "aac_adtstoasc", 
  outputFilename,
];
```

#### 3. **Main Downloader Function** 🎯

The `downloadVimeoPrivateVideo` function orchestrates the whole process. It extracts the video stream URL, invokes the download process, and saves the video as an MP4 file.

```javascript
await downloadHLSStream(stream, outputFilename);
```

---

## 🏃‍♂️ Running the Script

To start downloading your Vimeo private video, follow these steps:

1. Open `downloadVimeo.js` and replace the placeholder URL with the Vimeo video URL you want to download.
2. Run the script using the command:

```bash
node downloadVimeo.js
```

---

## 🛠️ Troubleshooting

If you're facing issues with FFmpeg or downloads, here are some things to check:

- **FFmpeg Not Found?** Make sure FFmpeg is installed and added to your system's PATH.
- **Video Not Downloading?** Check the video URL and ensure the video is accessible.
- **Permission Issues?** Run the script as an administrator or use `sudo` on Linux/MacOS.

---

## 📜 License

This project is for educational purposes and intended for personal use only. Make sure you have permission to download the content. Always respect copyrights! ⚖️

---

## 🎉 Happy Downloading! 🎬💻

Feel free to modify the script to suit your needs and add more cool features. This tool is your first step into video downloading wizardry! ✨
