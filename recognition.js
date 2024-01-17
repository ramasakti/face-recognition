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
        stream => {
            video.srcObject = stream;

            // Panggil fungsi getLabeledFaceDescriptions untuk mendapatkan deskriptor referensi
            getLabeledFaceDescriptions().then((labeledFaceDescriptors) => {
                // Jadikan acuan pencocokan wajah
                faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

                // Panggil fungsi untuk menangani perubahan dalam video feed
                handleVideo();
            });
        },
        err => console.error(err)
    );
}

async function handleVideo() {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        // Ambil wajah dari video
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        if (faceMatcher) {
            const result = resizedDetections.map(d => {
                return faceMatcher.findBestMatch(d.descriptor);
            });

            // console.log(result[0]['_label']);

            result.forEach((result, i) => {
                const box = resizedDetections[i].detection.box;
                const drawBox = new faceapi.draw.DrawBox(box, {
                    label: result.toString(),
                });
                drawBox.draw(canvas);
            });
        }else{
            console.log('gak maatch');
        }

    }, 100);
}

async function getFaceDescriptors() {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, { width: 640, height: 480 })
    return resizedDetections.map(d => d.descriptor)
}

function getLabeledFaceDescriptions() {
    const labeledFaceDescriptors = [];

    // Ganti label dan path file gambar sesuai dengan keinginan Anda
    const labeledFaces = [
        { label: "rama", path: "./labels/rama/", count: 2 },
        { label: "aziz", path: "./labels/aziz/", count: 2 },
        { label: "sulton", path: "./labels/sulton/", count: 2 },
        // Tambahkan label dan path file gambar lainnya jika diperlukan
    ];

    return Promise.all(
        labeledFaces.map(async (labeledFace) => {
            const { label, path, count } = labeledFace;
            const descriptions = [];

            for (let i = 1; i <= count; i++) {
                const img = await faceapi.fetchImage(`${path}${i}.png`);
                const detections = await faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                descriptions.push(detections.descriptor);
            }

            const labeledFaceDescriptor = new faceapi.LabeledFaceDescriptors(label, descriptions);
            labeledFaceDescriptors.push(labeledFaceDescriptor);

            return labeledFaceDescriptor;
        })
    ).then(() => labeledFaceDescriptors);
}
