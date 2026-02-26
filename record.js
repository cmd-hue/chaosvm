
var recbutton = document.getElementsByClassName("videorec")[0]

var screenshotvm = function() {

    function run() {
        var c = document.querySelector("canvas");
        if (!c) {
            requestAnimationFrame(run);
            return;
        }

        var link = document.createElement("a");
        link.download = "vm.png";
        link.href = c.toDataURL("image/png");
        link.click();
    }

    if (document.readyState === "complete") {
        run();
    } else {
        window.addEventListener("load", run);
    }

};

var videovm = function() {
    if (window.canvasRecorder) {
        cancelAnimationFrame(window._canvasRAF);
        clearInterval(window._frameInterval);

        if (window.canvasRecorder.state !== "inactive") {
            window.canvasRecorder.stop();
        }

        window.canvasRecorder = null;

        if (typeof recbutton !== "undefined") {
            recbutton.innerHTML = "Record VM Screen";
        }

        return;
    }

    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    if (typeof MediaRecorder === "undefined") {
        console.error("MediaRecorder not supported");
        return;
    }

    const filename = vm_recording;
    if (!filename) return;

    if (window._outCanvas) {
        window._outCanvas.remove();
    }

    const outCanvas = document.createElement("canvas");
    outCanvas.style.display = "none";
    document.body.appendChild(outCanvas);
    window._outCanvas = outCanvas;

    const ctx = outCanvas.getContext("2d");

    const stream = outCanvas.captureStream(0); // manual frame control
    const track = stream.getVideoTracks()[0];

    const FPS = 30;
    const FRAME_TIME = 1000 / FPS;

    const drawFrame = () => {
        if (outCanvas.width !== canvas.width || outCanvas.height !== canvas.height) {
            outCanvas.width = canvas.width;
            outCanvas.height = canvas.height;
        }

        ctx.drawImage(canvas, 0, 0);

        // 🔥 force frame into recorder
        if (track.requestFrame) {
            track.requestFrame();
        }
    };

    // run visual sync (smooth updates)
    const loop = () => {
        drawFrame();
        window._canvasRAF = requestAnimationFrame(loop);
    };
    loop();

    // force consistent FPS timing
    window._frameInterval = setInterval(() => {
        drawFrame();
    }, FRAME_TIME);

    const chunks = [];
    const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm"
    });

    recorder.ondataavailable = e => {
        if (e.data.size) chunks.push(e.data);
    };

    recorder.onstop = () => {
        clearInterval(window._frameInterval);

        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename + ".webm";
        a.click();

        URL.revokeObjectURL(url);
        outCanvas.remove();
        window._outCanvas = null;
    };

    recorder.start();
    window.canvasRecorder = recorder;

    if (typeof recbutton !== "undefined") {
        recbutton.innerHTML = "Recording...";
    }
};
