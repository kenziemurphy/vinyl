var tutorialCalled = []
function callTutorial(selector, text, direction = 's') {
    let target = d3.select(selector);
    var boundingRect = target.node().getBoundingClientRect();
    
    if (tutorialCalled.indexOf(selector + ':' + text) >= 0) {
        console.warn('Already called that tutorial: ' + selector + ' - ' + text);
        return false;
    }

    console.log(boundingRect)

    d3.select('#tutorial')
        .classed('hide', true)
        .classed('ready', false);

    d3.select('#tutorial')
        .style('top', function () {
            if (direction == 's')
                return (boundingRect.bottom + 5) + 'px';
            else if (direction == 'n')
                return '';
            else
                return (boundingRect.top + boundingRect.bottom) / 2 + 'px';
        })
        .style('left', function () {
            if (direction == 's' || direction == 'n')
                return (boundingRect.left + boundingRect.right) / 2 + 'px';
            if (direction == 'w')
                return '';
            else return '';
        })
        .style('bottom', function () {
            if (direction == 's')
                return '';
            else if (direction == 'n')
                return window.innerHeight - (boundingRect.top - 5 - 7) + 'px';
            else
                return '';
        })
        .style('right', function () {
            if (direction == 'w')
                return window.innerWidth - (boundingRect.left - 5 - 7) + 'px';
            else
                return '';
        })
        .classed('hide', false)
        .classed('dir-s', direction == 's')
        .classed('dir-n', direction == 'n')
        .classed('dir-w', direction == 'w')
        .select('p')
        .html(text);

    setTimeout(function () {
        d3.select('#tutorial').classed('ready', true)
    }, 300);

    tutorialCalled.push(selector + ':' + text);
}

function clearTutorial () {
    d3.select('#tutorial')
        .classed('hide', true)
        .classed('ready', false);
}

d3.select('body').on('click.tutorial', function () {
    function equalToEventTarget() {
        return this == d3.event.target;
    }

    var outsideTutorial = d3.select('#tutorial').filter(equalToEventTarget).empty();
    
    if (outsideTutorial && d3.select('#tutorial').classed('ready')) {
        clearTutorial();
    }
});
