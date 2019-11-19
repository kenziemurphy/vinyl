// Audio.prototype.currentFadeInterval = 0;
Audio.prototype.fadeQueue = [];

Audio.prototype.playFadeIn = function (time = 300, nSteps = 20) {
    this.volume = 0;
    this.play();
    // FIXME fadeTo is still buggy.
    return this.fadeTo(1, time, nSteps);
}

Audio.prototype.stopFadeOut = function (time = 300, nSteps = 20) {
    // FIXME fadeTo is still buggy.
    let _thisAudio = this;
    return new Promise(function (resolve, reject) {
        _thisAudio.fadeTo(0).then(function () {
            _thisAudio.pause();
            _thisAudio.currentTime = 0;
            resolve();
        });
    });
}

Audio.prototype.fadeTo = function (target, time = 300, nSteps = 20) {

    _thisAudio = this;

    // FIXME
    // still a little buggy when the hovering keeps toggling back and forth really fast

    let promise = new Promise(function (resolve, reject) {
        target = target.toFixed(2);
        var startingVolume = _thisAudio.volume;
        var fadeDirection = startingVolume < target ? 1 : -1;
        let currentFadeInterval = setInterval(function () {
            var volume = (_thisAudio.volume + fadeDirection / nSteps).toFixed(2);
            volume = Math.min(Math.max(volume, 0), 1);
            // console.log(volume, target, _thisAudio.volume * fadeDirection >= target * fadeDirection, _thisAudio.fadeQueue)
            if (_thisAudio.fadeQueue.length > 1 || _thisAudio.volume * fadeDirection >= target * fadeDirection){
                // console.log('!', _thisAudio.currentFadeInterval, _thisAudio.fadeQueue);
                if (_thisAudio.volume * fadeDirection >= target * fadeDirection) {
                    _thisAudio.volume = target;
                }
                clearInterval(currentFadeInterval);
                _thisAudio.fadeQueue.shift();
                resolve();
            } else {
                _thisAudio.volume = volume;
            }
            _thisAudio.isFading = true;
        }, time / nSteps);
    })

    this.fadeQueue.push(promise);
    // console.log(this.fadeQueue)

    return promise;
}