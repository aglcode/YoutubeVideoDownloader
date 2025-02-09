const express = require('express');
const axios = require('axios');
const cors = require('cors');  // Import the cors package
const app = express();
const port = 3000;

// Use CORS middleware to allow requests from different origins
app.use(cors()); // Allow all origins by default

app.use(express.json()); // Middleware for JSON parsing

app.post('/download', async (req, res) => {
    const videoUrl = req.body.url;
    console.log('Received video URL:', videoUrl);

    try {
        // Fetch the video stream
        const response = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream', // Ensure the response is a stream
        });

        // Check if the response is valid
        if (response.status !== 200) {
            throw new Error('Failed to fetch the video');
        }

        // Set the appropriate headers for video download
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
        
        // Pipe the video stream back to the client
        response.data.pipe(res);

        response.data.on('end', () => {
            console.log('Video streaming completed');
        });

        response.data.on('error', (error) => {
            console.error('Error while streaming video:', error);
            res.status(500).send('Error downloading video');
        });
    } catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).send('Error fetching video');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
