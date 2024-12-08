const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors())

// Middleware untuk mengurai JSON
app.use(bodyParser.json({ limit: '10mb' }));

// Route untuk menyimpan wajah dan gambar
app.post('/save-face', (req, res) => {
    const { username, descriptors, images } = req.body;

    if (!username || !descriptors || !images || !images.length) {
        return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    const labelsDir = path.join(__dirname, 'labels');

    // Buat direktori "labels" jika belum ada
    if (!fs.existsSync(labelsDir)) {
        fs.mkdirSync(labelsDir, { recursive: true });
    }

    // Simpan gambar-gambar dengan nama unik
    images.forEach((image, index) => {
        const base64Data = image.replace(/^data:image\/png;base64,/, '');
        const imagePath = path.join(labelsDir, `${username}_face_${Date.now()}_${index}.png`);

        fs.writeFile(imagePath, base64Data, 'base64', (err) => {
            if (err) {
                console.error(`Error saving image ${index}:`, err);
            }
        });
    });

    // Path file global descriptor.json
    const descriptorPath = path.join(__dirname, 'descriptor.json');
    let existingDescriptors = [];

    // Muat deskriptor yang ada jika file descriptor.json sudah ada
    if (fs.existsSync(descriptorPath)) {
        try {
            const rawData = fs.readFileSync(descriptorPath);
            existingDescriptors = JSON.parse(rawData);
        } catch (err) {
            console.error("Error reading existing descriptors:", err);
        }
    }

    // Tambahkan atau perbarui deskriptor
    const updatedDescriptors = [
        ...existingDescriptors.filter(d => d.label !== username),
        { label: username, descriptors: descriptors }
    ];

    // Tulis kembali ke descriptor.json
    fs.writeFile(descriptorPath, JSON.stringify(updatedDescriptors, null, 2), (err) => {
        if (err) {
            console.error("Error saving descriptors:", err);
            return res.status(500).json({ message: 'Gagal menyimpan deskriptor' });
        }
        res.json({ message: 'Data wajah berhasil disimpan!' });
    });
});

// Route untuk mendapatkan data pada direktori labels
app.get('/labeled-faces', (req, res) => {
    const labelsDir = path.join(__dirname, 'labels');

    const labeledFaces = fs.readdirSync(labelsDir).map(labelDir => {
        const labelPath = path.join(labelsDir, labelDir);
        const files = fs.readdirSync(labelPath);

        // Filter out descriptor.json and count the images
        const imageFiles = files.filter(file => file !== 'descriptor.json');

        return {
            label: labelDir,
            path: `./labels/${labelDir}/`,
            descriptorFile: 'descriptor.json',
            count: imageFiles.length
        };
    });

    res.json(labeledFaces);
});

// Jalankan server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
