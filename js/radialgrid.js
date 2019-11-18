function axisRadial (scaleRadial, scaleAngle, center, radialMappingLabel) {

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

        // remove existing grid and start anew
        // TODO make grid dynamic
        selection.selectAll('g.grid')
            .remove();
        
        var gridG = selection.select('g.grid');
        if (gridG.size() <= 0) {
            gridG = selection.append('g')
                .attr('class', 'grid')
                .attr('pointer-events', 'none')
                .style('z-index', '-1')
                .attr('transform', `translate(${center[0]}, ${center[1]})`);
        }

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

        var axisLabels = selection.select('text.label.label-radial');
        if (axisLabels.size() <= 0) {
            var radialTextLabelInnerTop = gridG.append('text')
                .attr('class', 'label label-axis-radial grid-axis-label')
                .attr('y', -minRadialDist + 30)
        
            var radialTextLabelOuterTop = gridG.append('text')
                .attr('class', 'label label-axis-radial grid-axis-label')
                .attr('y', -maxRadialDist - 30)
        
            var radialTextLabelInnerBottom = gridG.append('text')
                .attr('class', 'label label-axis-radial grid-axis-label')
                .attr('y', minRadialDist - 30)
        
            var radialTextLabelOuterBottom = gridG.append('text')
                .attr('class', 'label label-axis-radial grid-axis-label')
                .attr('y', maxRadialDist + 30)

            axisLabels = d3.selectAll('text.label.label-axis-radial');
        } 
        axisLabels.text(radialMappingLabel.toUpperCase());

        var radialLabelTop = gridG.selectAll('text.label.label-radial.top')
            .data(radialGridInterval)
            .enter()
            .append('text')
            .attr('class', 'label label-radial top')
            .text(d => round(d, 1))
            .attr('y', d => -scaleRadial(d))
            .attr('fill', '#ffffff')

        var radialLabelBottom = gridG.selectAll('text.tempo.label.bottom')
            .data(radialGridInterval)
            .enter()
            .append('text')
            .attr('class', 'label label-radial bottom')
            .text(d => round(d, 1))
            .attr('y', d => scaleRadial(d))
            .attr('fill', '#ffffff');

        var angleGrid = gridG.selectAll('line.grid-line')
            .data(scaleAngle.domain())
            .enter()
            .append('line')
            .attr('class', 'grid-line')
            .attr('x1', d => angleDistanceToXy(scaleAngle(d), minRadialDist)[0])
            .attr('y1', d => angleDistanceToXy(scaleAngle(d), minRadialDist)[1])
            .attr('x2', d => angleDistanceToXy(scaleAngle(d), maxRadialDist)[0])
            .attr('y2', d => angleDistanceToXy(scaleAngle(d), maxRadialDist)[1])
        
        var angleLabel = gridG.selectAll('text.label.label-angle')
            .data(scaleAngle.domain())
            .enter()
            .append('text')
            .attr('class', 'label label-angle')
            .text(d => d)
            .attr('x', d => angleDistanceToXy(scaleAngle(d), maxRadialDist + 20)[0])
            .attr('y', d => angleDistanceToXy(scaleAngle(d), maxRadialDist + 20)[1])
            .attr('fill', '#ffffff')
    
        
    
        
    
        // major/minor line
        // FIXME hardcoding
        var majorMinorLabelOffset = 60;
        var majorMinorLineLeft = gridG.append('line')
            .attr('class', 'grid-line-clear')
            .attr('x1', -minRadialDist)
            .attr('y1', 0)
            .attr('x2', -maxRadialDist - majorMinorLabelOffset)
            .attr('y2', 0)
    
        var majorMinorLinRight = gridG.append('line')
            .attr('class', 'grid-line-clear')
            .attr('x1', minRadialDist)
            .attr('y1', 0)
            .attr('x2', maxRadialDist + majorMinorLabelOffset)
            .attr('y2', 0)
    
        var majorLabelLeft = gridG.append('text')
            .text('MAJOR')
            .attr('class', 'grid-axis-label')
            .attr('x', -maxRadialDist - majorMinorLabelOffset)
            .attr('y', -7)
            .attr('aligment-baseline', 'baseline')
            .attr('text-anchor', 'start')
        
        var minorLabelLeft = gridG.append('text')
            .text('MINOR')
            .attr('class', 'grid-axis-label')
            .attr('x', -maxRadialDist - majorMinorLabelOffset)
            .attr('y', 7)
            .attr('alignment-baseline', 'hanging')
            .attr('text-anchor', 'start')
        
        var majorLabelRight = gridG.append('text')
            .text('MAJOR')
            .attr('class', 'grid-axis-label')
            .attr('x', maxRadialDist + majorMinorLabelOffset)
            .attr('y', -7)
            .attr('aligment-baseline', 'baseline')
            .attr('text-anchor', 'end')
        
        var minorLabelRight = gridG.append('text')
            .text('MINOR')
            .attr('class', 'grid-axis-label')
            .attr('x', maxRadialDist + majorMinorLabelOffset)
            .attr('y', 7)
            .attr('alignment-baseline', 'hanging')
            .attr('text-anchor', 'end');

        // guides only show up when an item is hovers to help deal with offset position from force-directed chart
        radialGuide = gridG.append('circle')
            .attr('class', 'guide-line radial hidden')
            .attr('r', scaleRadial(minRadialData))
            .attr('fill-opacity', '0');

        angleGuide = gridG.append('line')
            .attr('class', 'guide-line angle hidden')
            .attr('x1', angleDistanceToXy(scaleAngle(scaleAngle.domain()[0]), minRadialDist)[0])
            .attr('y1', angleDistanceToXy(scaleAngle(scaleAngle.domain()[0]), minRadialDist)[1])
            .attr('x2', angleDistanceToXy(scaleAngle(scaleAngle.domain()[0]), maxRadialDist)[0])
            .attr('y2', angleDistanceToXy(scaleAngle(scaleAngle.domain()[0]), maxRadialDist)[1]);
    }

    axis.showGuide = function (angle, radial) {
        d3.select('.guide-line.radial')
            .classed('hidden', false)
            .attr('r', scaleRadial(radial));
        d3.select('.guide-line.angle')
            .classed('hidden', false)
            .attr('x1', angleDistanceToXy(scaleAngle(angle), minRadialDist)[0])
            .attr('y1', angleDistanceToXy(scaleAngle(angle), minRadialDist)[1])
            .attr('x2', angleDistanceToXy(scaleAngle(angle), maxRadialDist)[0])
            .attr('y2', angleDistanceToXy(scaleAngle(angle), maxRadialDist)[1]);
        d3.selectAll('.label-angle')
            .filter(k => k == angle)
            .classed('highlight', true);
    }

    axis.hideGuide = function () {
        d3.selectAll('.guide-line')
            .classed('hidden', true)
            .transition();
        d3.selectAll('.label-angle')
            .classed('highlight', false);
    }

    axis.scaleRadial = function (_) {
        return arguments.length ? (scaleRadial = _, axis) : scaleRadial;
    }

    return axis;    
}