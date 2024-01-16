const video = document.getElementById('video')

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
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

const fetchFace = async () => {
    const response = await fetch('http://localhost:8080/get-face')
    const data = await response.json()

    const faceData = data.payload.map(item => {
        return {
            label: item.username,
            descriptors: item.descriptors
        }
    })

    return faceData
}

video.addEventListener('play', async () => {
    // Pengaturan video
    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)

    // Fetch data kemudian masukkan ke variabel labels dan descriptors
    // const faceData = await fetchFace()
    // let labels = []
    // let descriptors = []
    // faceData.map(item => {
    //     labels.push(item.label)
    //     descriptors.push(new Float32Array(item.descriptors))
    // })

    // Jadikan acuan pencocokan wajah
    const faceMatcher = new faceapi.FaceMatcher(x)

    // Show video
    setInterval(async () => {
        // Ambil wajah dari video
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors()

        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

        const result = resizedDetections.map(d => {
            return faceMatcher.findBestMatch(d.descriptor)
        })

        result.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: result,
            })
            drawBox.draw(canvas)
        })

    }, 100)
})

async function getFaceDescriptors() {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, { width: 640, height: 480 })
    return resizedDetections.map(d => d.descriptor)
}

function getLabeledFaceDescriptions() {
    const labels = ["rama", "aziz", "sulton"];
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 2; i++) {
                const img = await faceapi.fetchImage(`./labels/${label}/${i}.png`);
                const detections = await faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                descriptions.push(detections.descriptor);
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    );
}