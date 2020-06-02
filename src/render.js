const { desktopCapturer, remote } = require('electron');
const { writeFile } = require('fs');
const { Menu } = remote;
const { dialog } = remote;

const videoElm = document.querySelector('video');
const startBtn = document.getElementById('startButton');
const stopBtn = document.getElementById('stopButton');
const videoSelectBtn = document.getElementById('videoSelectButton');

let mediaRecorder;
const recordedChunks = [];

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );
    videoOptionsMenu.popup();
}

async function selectSource(source) {
    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElm.srcObject = stream;
    videoElm.play();

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleOnStop;
}

async function handleOnStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });
    const buffer = Buffer.from(await blob.arrayBuffer());
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `video-${Date.now()}.webm`
    });

    writeFile(filePath, buffer, () => {
        console.log('Video saved succesfully!');
    });
}

function handleDataAvailable(e) {
    console.log('Video data available!');
    recordedChunks[0] = e.data;
}



videoSelectBtn.onclick = getVideoSources;

stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('btn-info');
    startBtn.innerText = 'Record';
};

startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('btn-info');
    startBtn.innerText = 'Recording';
};

