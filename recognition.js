const video = document.getElementById('video');

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('models'),
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error("Error:", err));
}

// Tunggu video siap
video.addEventListener('loadeddata', async () => {
    // Muat deskriptor wajah dari backend
    const response = await fetch('descriptor.json');
    const labeledFaceDescriptorsData = await response.json();

    const labeledFaceDescriptors = labeledFaceDescriptorsData.map(data =>
        new faceapi.LabeledFaceDescriptors(
            data.label,
            data.descriptors.map(d => new Float32Array(d))
        )
    );

    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        resizedDetections.forEach((detection, i) => {
            const match = faceMatcher.findBestMatch(detection.descriptor);
            const box = detection.detection.box;

            const drawBox = new faceapi.draw.DrawBox(box, {
                label: match.toString(),
            });
            drawBox.draw(canvas);
        });
    }, 100);
});
