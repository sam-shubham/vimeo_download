import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import cliProgress from "cli-progress";
import axios from "axios";
import { load } from "cheerio";

async function downloadHLSStream(
  m3u8Url,
  outputFilename,
  duration = 600,
  resolve,
  pre
) {
  // Ensure output directory exists
  const outputDir = path.dirname(outputFilename);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: `${
      pre || ""
    }{st} |{bar}| {percentage}% | Duration = {dur} | Size = {size}`,
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });

  // Start progress bar
  progressBar.start(100, 0, {
    st: "⇣ Downloading",
    size: "000000KiB",
    dur: "Syncing...",
  });

  try {
    fs.rmSync(outputFilename);
  } catch {}

  // FFmpeg command arguments
  const ffmpegArgs = [
    "-i",
    m3u8Url, // Input URL
    "-c",
    "copy", // Copy codec without re-encoding
    "-bsf:a",
    "aac_adtstoasc", // Convert ADTS to ASC for AAC audio (optional)
    outputFilename, // Output filename
  ];

  // Spawn FFmpeg process
  const ffmpeg = spawn("ffmpeg", ffmpegArgs);

  // Handle process completion
  ffmpeg.on("close", (code) => {
    if (code === 0) {
      progressBar.update(100, {
        st: "✅ Downloaded",
      });
      progressBar.stop();
      resolve(true);
    } else {
      progressBar.stop();
      console.error((pre || "") + `FFmpeg process exited with code ${code}`);
      resolve(false);
    }
  });

  ffmpeg.stderr.on("data", (data) => {
    const dataStr = data.toString();
    if (dataStr?.includes("st=video")) {
      // progressBar.update(Math.min(progressBar.value + 1, 98));
    } else if (dataStr?.includes("time=")) {
      let p = calculatePercentage(
        dataStr?.split("time=")[1].trim().split(" ")[0].trim(),
        duration || 600
      );

      progressBar.update(
        Math.min(
          p || progressBar.value > progressBar.value ? p : progressBar.value
        ),
        {
          dur: dataStr?.split("time=")[1].trim().split(" ")[0].trim(),
          size: dataStr?.split("size=")[1].trim().split(" ")[0].trim(),
        }
      );
    }
  });

  // Handle any spawning errors
  ffmpeg.on("error", (err) => {
    progressBar.stop();
    console.error((pre || "") + "Failed to start FFmpeg process:", err);
    resolve(false);
  });
}

async function extractVimeoPlayerConfig(url, domain) {
  try {
    // Fetch the HTML content
    const response = await axios.get(url, {
      headers: {
        Accept: "*/*",
        Referer: domain,
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
      },
    });
    if (!response) throw new Error("No response");
    const html = response.data;

    // Use cheerio to parse the HTML
    const $ = load(html);

    // Find the script tag containing playerConfig
    const playerConfigScript = $("script")
      .filter((i, el) => {
        return $(el).html().includes("window.playerConfig =");
      })
      .first();

    // Extract the JSON string
    const playerConfigString = playerConfigScript
      .html()
      .replace("window.playerConfig = ", "")
      .replace(/;$/, "");

    // Parse the JSON
    const playerConfig = JSON.parse(playerConfigString);

    // Extract key information
    return {
      videoId: playerConfig.video.id,
      title: playerConfig.video.title,
      duration: playerConfig.video.duration,
      width: playerConfig.video.width,
      height: playerConfig.video.height,
      thumbnails: playerConfig.video.thumbs,
      streamQualities: playerConfig.request.files.dash.streams.map(
        (stream) => stream.quality
      ),
      owner: {
        id: playerConfig.video.owner.id,
        name: playerConfig.video.owner.name,
      },
      streamUrls: {
        dash: {
          primary:
            playerConfig.request.files.dash.cdns.akfire_interconnect_quic
              .avc_url,
          alternate: playerConfig.request.files.dash.cdns.fastly_skyfire.url,
        },
        hls: {
          primary:
            playerConfig.request.files.hls.cdns.akfire_interconnect_quic
              .avc_url,
          alternate: playerConfig.request.files.hls.cdns.fastly_skyfire.avc_url,
        },
      },
    };
  } catch (error) {
    if (
      error?.response?.headers?.["set-cookie"] &&
      error?.response?.headers?.["set-cookie"].length > 0
    ) {
      axios.defaults.headers.common["Cookie"] =
        error?.response?.headers?.["set-cookie"].join("; ");
      console.log((pre || "") + "Video Security Error... Trying again...");
    } else {
      console.error(
        (pre || "") + "Error extracting Vimeo player config:",
        error
      );
    }
  }
}

async function downloadVimeoPrivateVideo(
  vimeoUrl,
  domain = "https://player.vimeo.com/",
  outputFilename,
  duration = 600,
  pre
) {
  console.log((pre || "") + "Downloading Vimeo video...");

  try {
    var playerConfig;
    while (!playerConfig) {
      try {
        playerConfig = await extractVimeoPlayerConfig(vimeoUrl, domain);
        if (playerConfig) break;
      } catch {}

      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log((pre || "") + "Retrying....");
    }
    const stream = playerConfig.streamUrls.hls.primary;

    // Optional: Remove existing file if it exists
    try {
      fs.rmSync(outputFilename || `${playerConfig.videoId}.mp4`);
    } catch {}

    await new Promise((resolve) => {
      downloadHLSStream(
        stream,
        outputFilename || `${playerConfig.videoId}.mp4`,
        duration || 600,
        resolve,
        pre
      );
    });
  } catch (error) {
    console.error(
      (pre || "") + "Failed to download Vimeo private video:",
      error
    );
  }
}

export {
  downloadVimeoPrivateVideo,
};

function convertToSeconds(timeStr) {
  // Split the time string into components (hours, minutes, seconds.milliseconds)
  const [hours, minutes, seconds] = timeStr.split(":");

  // Convert to total seconds
  return (
    parseInt(hours, 10) * 3600 +
    parseInt(minutes, 10) * 60 +
    parseFloat(seconds)
  );
}

function calculatePercentage(timeStr, x) {
  // console.log(timeStr, x);

  try {
    // Convert the time string to seconds
    const totalSeconds = convertToSeconds(timeStr);
    // console.log(" ",totalSeconds,timeStr, x);

    // Calculate the percentage (rounded to the nearest integer)
    return Math.round((totalSeconds / x) * 100);
  } catch {
    console.log(timeStr, x);

    console.log("Error in calculating percentage");

    return 0;
  }
}
