const video = document.getElementById('video')

Promise.all([
	faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
	faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
	faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
	faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
	navigator.getUserMedia(
		{ video: {} },
		stream => video.srcObject = stream,
		err => console.error(err)
	)
}

const addButton = document.getElementById('add-button')

video.addEventListener('play', async () => {
	const canvas = faceapi.createCanvasFromMedia(video)
	document.body.append(canvas)
	const displaySize = { width: video.width, height: video.height }
	faceapi.matchDimensions(canvas, displaySize)

	addButton.addEventListener('click', async () => {
		const faceDescriptors = await getFaceDescriptors()
		const dataToSend = {
			username: 'ramasakti',
			descriptors: faceDescriptors[0], // Mengonversi deskriptor ke array
		}

		// Mengirim data dengan method POST ke API
		try {
			const response = await fetch('http://localhost:8080/add-face', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Origin': 'http://localhost:3000'
				},
				body: JSON.stringify(dataToSend)
			})
			const data = await response.json()

			if (response.ok) console.log(data)
		} catch (error) {
			console.error(error)
		}
	})

	setInterval(async () => {
		const detections = await faceapi
			.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
			.withFaceLandmarks()
		const resizedDetections = faceapi.resizeResults(detections, displaySize)
		canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
		faceapi.draw.drawDetections(canvas, resizedDetections)
		faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
	}, 100)
})

async function getFaceDescriptors() {
	const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()
	const resizedDetections = faceapi.resizeResults(detections, { width: 640, height: 480 })
	return resizedDetections.map(d => d.descriptor)
}