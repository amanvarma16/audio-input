
function getMaxVolume(analyser, fftBins) {
  let maxVolume = -Infinity;
  analyser.getFloatFrequencyData(fftBins);
  for (let i = 4; i < fftBins.length; i++) {
    if (fftBins[i] > maxVolume && fftBins[i] < 0) {
      maxVolume = fftBins[i];
    }
  }
  return maxVolume;
}

export default class Vad {
  constructor(stream) {
    const context = (this.context = new AudioContext());

    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.1;

    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    const processor = context.createScriptProcessor(1024, 0, 1);

    setInterval(() => {
      this.update();
      if (this.currentVolume == -Infinity && this.onProcess) {
        this.onProcess(0.5);
      }
    }, 1000);

    processor.onaudioprocess = () => {
      this.update();
      if (this.onProcess) {
        this.onProcess(this.currentVolume);
      }
    };
    processor.connect(context.destination);

    this.analyser = analyser;
    this.processor = processor;
    this.fftBins = new Float32Array(analyser.fftSize);
    this.source = source;
  }

  update() {
    let volumeDb = getMaxVolume(this.analyser, this.fftBins);
    this.currentVolume = (100 + volumeDb) / 100;
  }

  stop() {
    if (this.onProcess) {
      this.onProcess(0);
    }
    this.source.disconnect();
    this.processor.disconnect();
    this.context.close();
  }
}
