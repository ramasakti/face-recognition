const video = document.getElementById('video');

Promise.all([
	faceapi.nets.tinyFaceDetector.loadFromUri('models'),
	faceapi.nets.faceLandmark68Net.loadFromUri('models'),
	faceapi.nets.faceRecognitionNet.loadFromUri('models'),
	faceapi.nets.faceExpressionNet.loadFromUri('models')
]).then(startVideo);

function startVideo() {
	navigator.mediaDevices.getUserMedia({ video: {} })
		.then(stream => video.srcObject = stream)
		.catch(err => console.error("Error:", err));
}

const addButton = document.getElementById('add-button');

video.addEventListener('play', async () => {
	const canvas = faceapi.createCanvasFromMedia(video);
	document.body.append(canvas);

	const displaySize = { width: video.width, height: video.height };
	faceapi.matchDimensions(canvas, displaySize);

	addButton.addEventListener('click', async () => {
		const faceName = document.getElementById('face').value;

		if (!faceName) {
			alert("Nama tidak boleh kosong!");
			return;
		}

		const trainingData = await captureTrainingData(10); // Ambil 10 gambar
		if (!trainingData.length) {
			alert("Wajah tidak terdeteksi, coba lagi!");
			return;
		}

		const dataToSend = {
			username: faceName,
			descriptors: trainingData.map(d => d.descriptor),
			images: trainingData.map(d => d.imageData)
		};

		const response = await fetch('http://localhost:3001/save-face', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dataToSend)
		});

		const data = await response.json();
		console.log("Response:", data);
		alert("Data berhasil disimpan!");
	});

	setInterval(async () => {
		const detections = await faceapi
			.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
			.withFaceLandmarks();
		const resizedDetections = faceapi.resizeResults(detections, displaySize);

		canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
		faceapi.draw.drawDetections(canvas, resizedDetections);
		faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
	}, 100);
});

async function captureTrainingData(totalImages) {
	const capturedData = [];

	for (let i = 0; i < totalImages; i++) {
		const detections = await faceapi.detectSingleFace(
			video,
			new faceapi.TinyFaceDetectorOptions()
		).withFaceLandmarks().withFaceDescriptor();

		if (detections) {
			const imageData = captureImageFromVideo(video);
			capturedData.push({
				descriptor: Array.from(detections.descriptor),
				imageData
			});
			console.log(`Gambar ${i + 1} ditangkap!`);
		} else {
			console.warn(`Wajah tidak terdeteksi pada gambar ${i + 1}`);
		}

		// Tambahkan delay agar wajah tidak terdeteksi berulang
		await delay(500); // Delay 500ms
	}
	return capturedData;
}

function captureImageFromVideo(video) {
	const canvas = document.createElement('canvas');
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	const ctx = canvas.getContext('2d');
	ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL('image/png');
}

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
