const API_KEY = "22039a77d1msh2977292f0f17da5p1f0597jsn6816ddcf60c6"; 

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('format').style.display = "none";
});

async function fetchVideo() {
    const videoUrl = document.getElementById("videoUrl").value;
    const selectedFormat = document.getElementById("format");
    const resultsDiv = document.getElementById("results");

    if (!videoUrl.trim()) {
        resultsDiv.innerHTML = `<p class="text-red-500">❌ Please enter a valid YouTube URL.</p>`;
        return;
    }

    resultsDiv.innerHTML = `<p class="text-yellow-400">⏳ Fetching video details...</p>`;

    // Extract video ID from URL
    const videoIdMatch = videoUrl.match(/v=([a-zA-Z0-9_-]{11})/);
    if (!videoIdMatch) {
        resultsDiv.innerHTML = `<p class="text-red-500">❌ Invalid YouTube URL. Please enter a valid one.</p>`;
        return;
    }
    const videoId = videoIdMatch[1];

    // API URL
    const apiUrl = `https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${videoId}`;

    try {
        const response = await fetch(apiUrl, {
            method: "GET", 
            headers: {
                "x-rapidapi-key": API_KEY,
                "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com"
            }
        });

        const data = await response.json();
        console.log("API Response:", data); 

        if (data?.videos?.items.length > 0 || data?.audios?.items.length > 0) {
            if (data && data.thumbnails && data.thumbnails.length > 0) {

                selectedFormat.dataset.videoUrl = data.videos?.items?.[0]?.url || "";
                selectedFormat.dataset.audioUrl = data.audios?.items?.[0]?.url || "";            

                selectedFormat.style.display = "block";
                selectedFormat.dataset.thumbnailUrl = data.thumbnails[0].url;
                selectedFormat.dataset.title = data.title;
                selectedFormat.dataset.duration = data.lengthSeconds;

                const currentFormat = selectedFormat.value;
                const initialDownloadUrl = currentFormat === 'mp4' ?
                      data.videos.items?.[0]?.url :
                      data.audios.items?.[0]?.url;

                resultsDiv.innerHTML = `
                    <div class="mt-4 bg-slate-800 shadow-lg rounded-xl py-5 px-6">
                        <img src="${data.thumbnails[0].url}" alt="Thumbnail" class="w-full rounded-lg shadow-lg">
                        <p class="mt-2 font-bold">${data.title}</p>
                        <p>Duration: ${data.lengthSeconds} seconds</p>

                        <div id="downloadSection">
                            <p class="mt-4">Download Ready:</p>
                            <a href="${initialDownloadUrl}" 
                            class="text-blue-400 underline" 
                            onclick="handleDownload(event, '${initialDownloadUrl}')">Download ${currentFormat.toUpperCase()}</a>
                            <button onclick="copyLink('${initialDownloadUrl}')" 
                                    class="bg-green-500 text-white px-4 py-2 ml-2 rounded">Copy Download Link</button>
                        </div>
                        
                    </div>
                `;

                updateDownloadLink();
            } else {
                resultsDiv.innerHTML = `<p class="text-red-500">Thumbnail not found.</p>`;
            }
        } else {
            resultsDiv.innerHTML = `<p class="text-red-500">No download link available.</p>`;
        }
    } catch (error) {
        console.log('Fetch error:', error);
        resultsDiv.innerHTML = `<p class="text-red-500">API Error. Please check your API key.</p>`;
    }
}

function updateDownloadLink() {
    const selectedFormat = document.getElementById("format");
    const downloadSection = document.getElementById("downloadSection");
    let formatType = selectedFormat.value;
    let downloadUrl = formatType === 'mp4' ? selectedFormat.dataset.videoUrl : selectedFormat.dataset.audioUrl;

    if (downloadUrl && downloadSection) {
        downloadSection.innerHTML = `
        <p class="mt-4">Download Ready:</p><br>
        <button onclick="handleDownload(event, '${downloadUrl}')" 
                class="bg-blue-500 text-white px-4 py-2 rounded">
            Download ${formatType.toUpperCase()}
        </button>
        <a href="#" onclick="copyLink('${downloadUrl}')" 
           class="text-green-500 underline ml-2">
            Copy Download Link
        </a>
        <div id="progressBarContainer" class="w-full bg-gray-300 rounded mt-4 hidden">
            <div id="progressBar" class="bg-blue-500 text-xs leading-none py-1 text-center text-white rounded" 
                 style="width: 0%;">0%</div>
        </div>
    `;
    
    } else {
        downloadSection.innerHTML = `<p class="text-red-500">No download link available for ${formatType.toUpperCase()}.</p>`;
    }
}


async function handleDownload(event, videoUrl) {
    event.preventDefault();

    const selectedFormat = document.getElementById("format");
    const formatType = selectedFormat.value;

    // Show the progress bar container and reset its state
    const progressBarContainer = document.getElementById("progressBarContainer");
    const progressBar = document.getElementById("progressBar");

    // Make the progress bar visible and reset to 0%
    progressBarContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.textContent = "Starting...";

    progressBar.classList.remove('bg-blue-500', 'bg-green-500'); // Reset color classes
    progressBar.classList.add('bg-blue-500'); // Start with blue

    // Simulate starting download immediately (start animation)
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5; // Increment by 5% every 300ms
        progressBar.style.width = progress + '%';
        progressBar.textContent = progress + '%';

        // Change color as progress increases
        if (progress < 50) {
            progressBar.classList.remove('bg-green-500');
            progressBar.classList.add('bg-blue-500');
        } else if (progress < 90) {
            progressBar.classList.remove('bg-blue-500');
            progressBar.classList.add('bg-yellow-500');
        } else {
            progressBar.classList.remove('bg-yellow-500');
            progressBar.classList.add('bg-green-500');
        }

        if (progress >= 100) {
            clearInterval(progressInterval);
            progressBar.textContent = 'Download Started!';
        }
    }, 300);

    try {
        console.log(`Downloading ${formatType} from URL:`, videoUrl);

        const response = await fetch('http://localhost:3000/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: videoUrl, format: formatType }),
        });

        if (response.ok) {
            // Assuming the download has started after the request is made
            // Once the download starts, stop the progress animation
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            progressBar.textContent = 'Download Started!';

            // Create a Blob from the response and trigger the download
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            
            // Create a link to download the file
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `download.${formatType}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
        } else {
            throw new Error('Failed to download video');
        }
    } catch (error) {
        console.error('Download error:', error);
        alert('Download failed: ' + error.message);
    }
}



function simulateProgress(progressBarContainer, downloadLink) {
    let progressBar = document.getElementById("progressBar");
    let width = 0;
    let interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            // Enable the download link once progress is complete
            downloadLink.textContent = 'Download Complete';
            downloadLink.style.pointerEvents = 'auto'; // Allow clicking once the download is ready
            downloadLink.classList.remove('text-blue-400');
            downloadLink.classList.add('text-green-400');
        } else {
            width += 10;
            progressBar.style.width = width + '%'; 
            progressBar.textContent = width + '%';  
        }
    }, 300);
}

function copyLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        alert('Link copied to the clipboard!');
    }).catch (err => {
        console.error('Error copying the link: ', err);
    });
}

function toggleDarkMode() {
    const body = document.body;
    const button = document.getElementById("darkModeBtn");

    body.classList.toggle("bg-gray-900");
    body.classList.toggle("bg-white");
    body.classList.toggle("text-black");
    body.classList.toggle("text-white");

    // Toggle button text between Light and Dark
    if (body.classList.contains("bg-gray-900")) {
        button.textContent = "Light"; // Set text to "Dark" when dark mode is active
    } else {
        button.textContent = "Dark"; // Set text to "Light" when light mode is active
    }
}
document.getElementById("format").addEventListener('change', updateDownloadLink);
