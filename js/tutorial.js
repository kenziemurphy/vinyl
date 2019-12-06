var tutorialCalled = []
function callTutorial(selector, text, direction = 's') {
    let target = d3.select(selector);
    var boundingRect = target.node().getBoundingClientRect();
    
    if (tutorialCalled.indexOf(selector + ':' + text) >= 0) {
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
        })
        .style('left', function () {
            if (direction == 's' || direction == 'n')
                return (boundingRect.left + boundingRect.right) / 2 + 'px';
        })
        .style('bottom', function () {
            if (direction == 's')
                return '';
            else if (direction == 'n')
                return window.innerHeight - (boundingRect.top - 5 - 7) + 'px';
        })
        .classed('hide', false)
        .classed('dir-s', direction == 's')
        .classed('dir-n', direction == 'n')
        .select('p')
        .html(text);

    setTimeout(function () {
        d3.select('#tutorial').classed('ready', true)
    }, 300);

    tutorialCalled.push(selector + ':' + text);
}

d3.select('body').on('click.tutorial', function () {
    function equalToEventTarget() {
        return this == d3.event.target;
    }

    var outsideTutorial = d3.select('#tutorial').filter(equalToEventTarget).empty();
    
    if (outsideTutorial && d3.select('#tutorial').classed('ready')) {
        d3.select('#tutorial')
            .classed('hide', true)
            .classed('ready', false);
    }
});
