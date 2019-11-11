Audio.prototype.currentFadeInterval = 0;

Audio.prototype.fadeTo = function (target, time = 300, nSteps = 20) {

    _thisAudio = this;

    // FIXME
    // bug preventing fade-outs to work properly. 
    // Seems like the currentFadeInterval is global
    // how to I make those object-based variables?

    console.log(_thisAudio.currentFadeInterval);
    if (_thisAudio.currentFadeInterval) {
        clearInterval(_thisAudio.currentFadeInterval);
    }

    return new Promise(function (resolve, reject) {
        target = target.toFixed(2);
        var startingVolume = _thisAudio.volume;
        var fadeDirection = startingVolume < target ? 1 : -1;
        _thisAudio.currentFadeInterval = setInterval(function () {
            var volume = (_thisAudio.volume + fadeDirection / nSteps).toFixed(2);
            volume = Math.min(Math.max(volume, 0), 1);
            console.log(volume, target, _thisAudio.volume * fadeDirection >= target * fadeDirection)
            if (_thisAudio.volume * fadeDirection >= target * fadeDirection){
                console.log('!', _thisAudio.currentFadeInterval)
                _thisAudio.volume = target;
                clearInterval(_thisAudio.currentFadeInterval);
                resolve();
            } else {
                // console.log(volume)
                _thisAudio.volume = volume;
            }
            _thisAudio.isFading = true;
        }, time / nSteps);
    })
}