function axisRadial (scaleRadial, scaleAngle, center, radialMappingLabel) {

    const NUM_RADIAL_GRID_LINES = 5;
    const MID_LABEL_HORIZONTAL_OFFSET = 60;
    const MID_LABEL_VERTICAL_OFFSET = 7;

    var minRadialData = scaleRadial.domain()[0];
    var maxRadialData = scaleRadial.domain()[1]; 

    var minRadialDist = scaleRadial.range()[0];
    var maxRadialDist = scaleRadial.range()[1]; 

    minRadialData = isNaN(minRadialData) ? 0 : minRadialData;
    maxRadialData = isNaN(maxRadialData) ? 1 : maxRadialData;
    
    var radialGridGap = (maxRadialData - minRadialData) / NUM_RADIAL_GRID_LINES;
    var radialGridInterval = d3.range(minRadialData, maxRadialData, radialGridGap);
    var angularGridInterval = d3.range(0, NUM_KEYS, 1);

    var radialGuide, angleGuide;
    
    var gridG;
    
    radialGridInterval.push(maxRadialData);

    function angleDistanceToXy (angle, distance) {
        return [
            Math.cos(angle) * distance,
            Math.sin(angle) * distance
        ]
    }

    function round(value, decimals) {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    var axis = function (context) {
        let selection = context.selection ? context.selection() : context
        
        gridG = selectAllOrCreateIfNotExist(selection, 'g.grid')
            .attr('pointer-events', 'none')
            .style('z-index', '-1')
            .attr('transform', `translate(${center[0]}, ${center[1]})`);
        

        // radial grid enter-update-exit
        var radialGrid = gridG.selectAll('circle.grid-line').data(radialGridInterval);
        var radialGridEnter = radialGrid.enter()
            .append('circle')
            .attr('class', 'grid-line')
            .attr('fill-opacity', '0')
            .attr('stroke-opacity', '0.2')
            .attr('stroke', '#ffffff')
        
        radialGrid.merge(radialGridEnter)
            .transition()
            .attr('r', d => scaleRadial(d))

        radialGrid.exit().remove();

        // axis labels
        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-radial.grid-axis-label.outer-bottom')
            .attr('y', maxRadialDist + 30);
        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-radial.grid-axis-label.inner-bottom')
            .attr('y', minRadialDist - 30);
        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-radial.grid-axis-label.outer-top')
            .attr('y', -maxRadialDist - 30);
        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-radial.grid-axis-label.inner-top')
            .attr('y', -minRadialDist + 30);
        selection.selectAll('text.label.label-axis-radial').text(radialMappingLabel.toUpperCase());

        // radial scale labels
        // top
        var radialLabelsTop = gridG.selectAll('text.label.label-radial.top').data(radialGridInterval)
        var radialLabelsTopEnter = radialLabelsTop.enter()
            .append('text')
            .attr('class', 'label label-radial top')
        
        radialLabelsTop.merge(radialLabelsTopEnter)
            .transition()
            .text(d => round(d, 1))
            .attr('y', d => -scaleRadial(d))
            .attr('fill', '#ffffff');

        radialLabelsTop.exit().remove();

        // bottom
        var radialLabelsBottom = gridG.selectAll('text.label.label-radial.bottom').data(radialGridInterval)
        var radialLabelsBottomEnter = radialLabelsBottom.enter()
            .append('text')
            .attr('class', 'label label-radial bottom')
        
        radialLabelsBottom.merge(radialLabelsBottomEnter)
            .transition()
            .text(d => round(d, 1))
            .attr('y', d => scaleRadial(d))
            .attr('fill', '#ffffff');

        radialLabelsBottom.exit().remove();
        
        // angle grid
        var angleGrid = gridG.selectAll('line.grid-line').data(scaleAngle.domain())
        var angleGridEnter = angleGrid.enter()
            .append('line')
            .attr('class', 'grid-line')
        
        angleGrid.merge(angleGridEnter)
            .attr('x1', d => angleDistanceToXy(scaleAngle(d), minRadialDist)[0])
            .attr('y1', d => angleDistanceToXy(scaleAngle(d), minRadialDist)[1])
            .attr('x2', d => angleDistanceToXy(scaleAngle(d), maxRadialDist)[0])
            .attr('y2', d => angleDistanceToXy(scaleAngle(d), maxRadialDist)[1])
        
        angleGrid.exit().remove();

        var angleLabel = gridG.selectAll('text.label.label-angle').data(scaleAngle.domain())
        var angleLabelEnter = angleLabel.enter()
            .append('text')
            .attr('class', 'label label-angle')
        
        angleLabel.merge(angleLabelEnter)
            .text(d => d)
            .attr('x', d => angleDistanceToXy(scaleAngle(d), maxRadialDist + 20)[0])
            .attr('y', d => angleDistanceToXy(scaleAngle(d), maxRadialDist + 20)[1])
            .attr('fill', '#ffffff')
        angleLabel.exit().remove();
        
    
        // major/minor line        
        var majorMinorLinRight = selectAllOrCreateIfNotExist(gridG, 'line#mid-line-right.grid-line-clear.grid-axis-label')
            .attr('x1', -minRadialDist)
            .attr('y1', 0)
            .attr('x2', -maxRadialDist - MID_LABEL_HORIZONTAL_OFFSET)
            .attr('y2', 0)
    
        var majorMinorLinRight = selectAllOrCreateIfNotExist(gridG, 'line#mid-line-left.grid-line-clear.grid-axis-label')
            .attr('x1', minRadialDist)
            .attr('y1', 0)
            .attr('x2', maxRadialDist + MID_LABEL_HORIZONTAL_OFFSET)
            .attr('y2', 0)
    
        var majorLabelLeft = selectAllOrCreateIfNotExist(gridG, 'text#mid-label-top-left.grid-axis-label')
            .text('MAJOR')
            .attr('x', -maxRadialDist - MID_LABEL_HORIZONTAL_OFFSET)
            .attr('y', -MID_LABEL_VERTICAL_OFFSET)
            .attr('aligment-baseline', 'baseline')
            .attr('text-anchor', 'start')
        
        var minorLabelLeft = selectAllOrCreateIfNotExist(gridG, 'text#mid-label-bottom-left.grid-axis-label')
            .text('MINOR')
            .attr('x', -maxRadialDist - MID_LABEL_HORIZONTAL_OFFSET)
            .attr('y', MID_LABEL_VERTICAL_OFFSET)
            .attr('alignment-baseline', 'hanging')
            .attr('text-anchor', 'start')
        
        var majorLabelRight = selectAllOrCreateIfNotExist(gridG, 'text#mid-label-top-right.grid-axis-label')
            .text('MAJOR')
            .attr('x', maxRadialDist + MID_LABEL_HORIZONTAL_OFFSET)
            .attr('y', -MID_LABEL_VERTICAL_OFFSET)
            .attr('aligment-baseline', 'baseline')
            .attr('text-anchor', 'end')
        
        var minorLabelRight = selectAllOrCreateIfNotExist(gridG, 'text#mid-label-bottom-right.grid-axis-label')
            .text('MINOR')
            .attr('x', maxRadialDist + MID_LABEL_HORIZONTAL_OFFSET)
            .attr('y', MID_LABEL_VERTICAL_OFFSET)
            .attr('alignment-baseline', 'hanging')
            .attr('text-anchor', 'end');

        // guides only show up when an item is hovers to help deal with offset position from force-directed chart
        radialGuide = selectAllOrCreateIfNotExist(gridG, 'circle#radial-guide.guide-line.radial')
            .classed('hidden', true)
            .attr('r', scaleRadial(minRadialData))
            .attr('fill-opacity', '0');

        angleGuide = selectAllOrCreateIfNotExist(gridG, 'line#angle-guide.guide-line.angle')
            .classed('hidden', true)
            .attr('x1', angleDistanceToXy(scaleAngle(scaleAngle.domain()[0]), minRadialDist)[0])
            .attr('y1', angleDistanceToXy(scaleAngle(scaleAngle.domain()[0]), minRadialDist)[1])
            .attr('x2', angleDistanceToXy(scaleAngle(scaleAngle.domain()[0]), maxRadialDist)[0])
            .attr('y2', angleDistanceToXy(scaleAngle(scaleAngle.domain()[0]), maxRadialDist)[1]);
    }

    axis.update = function (_scaleRadial, _scaleAngle, _center, _radialMappingLabel) {
        scaleRadial = _scaleRadial;
        scaleAngle = _scaleAngle;
        center = _center;
        radialMappingLabel = _radialMappingLabel;
        return axis;
    }

    axis.showGuide = function (angle, radial) {
        gridG.select('.guide-line.radial')
            .classed('hidden', false)
            .attr('r', scaleRadial(radial));
        gridG.select('.guide-line.angle')
            .classed('hidden', false)
            .attr('x1', angleDistanceToXy(scaleAngle(angle), minRadialDist)[0])
            .attr('y1', angleDistanceToXy(scaleAngle(angle), minRadialDist)[1])
            .attr('x2', angleDistanceToXy(scaleAngle(angle), maxRadialDist)[0])
            .attr('y2', angleDistanceToXy(scaleAngle(angle), maxRadialDist)[1]);
        gridG.selectAll('.label-angle')
            .filter(k => k == angle)
            .classed('highlight', true);
    }

    axis.hideGuide = function () {
        gridG.selectAll('.guide-line')
            .classed('hidden', true)
            .transition();
        gridG.selectAll('.label-angle')
            .classed('highlight', false);
    }

    axis.scaleRadial = function (_) {
        return arguments.length ? (scaleRadial = _, axis) : scaleRadial;
    }

    return axis;    
}