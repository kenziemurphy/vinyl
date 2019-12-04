var tutorialCalled = []
function callTutorial(selector, text) {
    let target = d3.select(selector);
    var boundingRect = target.node().getBoundingClientRect();
    
    if (tutorialCalled.indexOf(selector + ':' + text) >= 0) {
        return;
    }

    d3.select('#tutorial')
        .style('top', boundingRect.bottom + 'px')
        .style('left', (boundingRect.left + boundingRect.right / 2) + 'px')
        .classed('hide', false)
        .select('p')
        .text(text)

    tutorialCalled.push(selector + ':' + text);
}

d3.select('body').on('click.tutorial', function () {
    function equalToEventTarget() {
        return this == d3.event.target;
    }

    console.log('!@!#!')
    var outsideTutorial = d3.select('#tutorial').filter(equalToEventTarget).empty();
    
    if (outsideTutorial) {
        d3.select('#tutorial').classed('hide', true);
    }
});
