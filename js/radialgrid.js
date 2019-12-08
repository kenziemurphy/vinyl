function axisRadial (scaleAngle, scaleRadial, center, angleMappingLabel, radialMappingLabel) {

    const NUM_RADIAL_GRID_LINES = 5;
    const MID_LABEL_HORIZONTAL_OFFSET = 35;
    const MID_LABEL_VERTICAL_OFFSET = 7;
    const AXIS_LABELS_OFFSET = 25;

    var minRadialData = scaleRadial.domain()[0];
    var maxRadialData = scaleRadial.domain()[1]; 

    var minRadialDist = scaleRadial.range()[0];
    var maxRadialDist = scaleRadial.range()[1]; 

    minRadialData = isNaN(minRadialData) ? 0 : minRadialData;
    maxRadialData = isNaN(maxRadialData) ? 1 : maxRadialData;
    
    var radialGridGap = (maxRadialData - minRadialData) / NUM_RADIAL_GRID_LINES;
    var radialGridInterval = d3.range(minRadialData, maxRadialData, radialGridGap);
    var angularGridInterval = d3.range(0, scaleAngle.domain().length, 1);

    var radialGuide, angleGuide;
    
    var gridG;
    
    radialGridInterval.push(maxRadialData);

    function angleDistanceToXy (angle, distance) {
        return [
            Math.cos(angle) * distance,
            Math.sin(angle) * distance
        ]
    }

    var axis = function (context) {
        let selection = context.selection ? context.selection() : context
        
        gridG = selectAllOrCreateIfNotExist(selection, 'g.grid')
            // .attr('pointer-events', 'none')
            .style('z-index', '-1')
            .attr('transform', `translate(${center[0]}, ${center[1]})`);
        

        // radial grid enter-update-exit
        // console.log(gridG.selectAll('circle.grid-line').data(), radialGridInterval)
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
            .attr('y', maxRadialDist + AXIS_LABELS_OFFSET);
        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-radial.grid-axis-label.inner-bottom.hide-on-mini')
            .attr('y', minRadialDist - AXIS_LABELS_OFFSET);
        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-radial.grid-axis-label.outer-top')
            .attr('y', -maxRadialDist - AXIS_LABELS_OFFSET);
        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-radial.grid-axis-label.inner-top.hide-on-mini')
            .attr('y', -minRadialDist + AXIS_LABELS_OFFSET);
        selection.selectAll('text.label.label-axis-radial')
            .text(Utils.formatKeyLabel(radialMappingLabel))
            .call(addHelpTooltip(radialMappingLabel.toLowerCase()));

        // radial scale labels
        // top
        var radialLabelsTopG = selectAllOrCreateIfNotExist(gridG, 'g.labels-radial.top')
        var radialLabelsTop = radialLabelsTopG.selectAll('text.label.label-radial.top').data(radialGridInterval)
        var radialLabelsTopEnter = radialLabelsTop.enter()
            .append('text')
            .attr('class', 'label label-radial top')
        
        radialLabelsTop.merge(radialLabelsTopEnter)
            .transition()
            .text(d => d3.format('.1f')(d))
            .attr('y', d => -scaleRadial(d))
            .attr('fill', '#ffffff');

        radialLabelsTop.exit().remove();

        // bottom
        var radialLabelsBottomG = selectAllOrCreateIfNotExist(gridG, 'g.labels-radial.bottom')
        var radialLabelsBottom = radialLabelsBottomG.selectAll('text.label.label-radial.bottom').data(radialGridInterval)
        var radialLabelsBottomEnter = radialLabelsBottom.enter()
            .append('text')
            .attr('class', 'label label-radial bottom')
        
        radialLabelsBottom.merge(radialLabelsBottomEnter)
            .transition()
            .text(d => Utils.formatByKey(radialMappingLabel)(d))
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
            // .attr('stroke', d => {
            //     console.log(d, d.indexOf('♯') >= 0)
            //     return d.indexOf('♯') >= 0 ? '#000' : '#fff' })
        
        angleGrid.exit().remove();

        var angleLabel = gridG.selectAll('text.label.label-angle').data(scaleAngle.domain())
        var angleLabelEnter = angleLabel.enter()
            .append('text')
            .attr('class', 'label label-angle')
        
        angleLabel.merge(angleLabelEnter)
            .text(d => d)
            .attr('x', d => angleDistanceToXy(scaleAngle(d), maxRadialDist + 12)[0])
            .attr('y', d => angleDistanceToXy(scaleAngle(d), maxRadialDist + 12)[1])
            .attr('fill', '#ffffff')
        angleLabel.exit().remove();
        
        // angle axes label
        var angleLabelsG = selectAllOrCreateIfNotExist(gridG, 'g#labels-angle');
        var angleLabelLeft = selectAllOrCreateIfNotExist(angleLabelsG, 'text.label.grid-axis-label.label-axis-angle#label-axis-angle-left')
            .attr('x', 0)
            .attr('y', -maxRadialDist - AXIS_LABELS_OFFSET)
        var angleLabelRight= selectAllOrCreateIfNotExist(angleLabelsG, 'text.label.grid-axis-label.label-axis-angle#label-axis-angle-right')
            .attr('x', 0)
            .attr('y', -maxRadialDist - AXIS_LABELS_OFFSET)
            .attr('transform', 'rotate(180)');
        var angleArcLeft= selectAllOrCreateIfNotExist(angleLabelsG, 'path.grid-line.grid-line-clear#line-axis-left')
            .attr('d', d3.arc()
                .innerRadius(maxRadialDist + AXIS_LABELS_OFFSET)
                .outerRadius(maxRadialDist + AXIS_LABELS_OFFSET)
                .startAngle(Math.PI + Math.PI / 36)
                .endAngle(Math.PI + Math.PI / 10));
        var angleArcRight= selectAllOrCreateIfNotExist(angleLabelsG, 'path.grid-line.grid-line-clear#line-axis-right')
            .attr('d', d3.arc()
                .innerRadius(maxRadialDist + AXIS_LABELS_OFFSET)
                .outerRadius(maxRadialDist + AXIS_LABELS_OFFSET)
                .startAngle(Math.PI / 36)
                .endAngle(Math.PI / 10));
        var angleArrowHeadLeft = selectAllOrCreateIfNotExist(angleLabelsG, 'path.grid-line.grid-line-clear.arrow-head#arrow-head-axis-left')
            .attr('d', d3.symbol()
                .type(d3.symbolTriangle)
                .size(10))
            .attr('transform', `rotate(-72) translate(${-maxRadialDist - AXIS_LABELS_OFFSET})`);
        var angleArrowHeadRight = selectAllOrCreateIfNotExist(angleLabelsG, 'path.grid-line.grid-line-clear.arrow-head#arrow-head-axis-right')
            .attr('d', d3.symbol()
                .type(d3.symbolTriangle)
                .size(10))
            .attr('transform', `rotate(108) translate(${-maxRadialDist - AXIS_LABELS_OFFSET})`);    
        angleLabelsG.attr('transform', 'rotate(90)');
        angleLabelsG.selectAll('text.label.grid-axis-label.label-axis-angle')
            .text(Utils.formatKeyLabel(angleMappingLabel))
            .call(addHelpTooltip(angleMappingLabel.toLowerCase()));
        
        // major/minor line        
        var majorMinorLineRight = selectAllOrCreateIfNotExist(gridG, 'line#mid-line-right.grid-line-clear.grid-axis-label')
            .attr('x1', -minRadialDist)
            .attr('y1', 0)
            .attr('x2', -maxRadialDist)
            .attr('y2', 0)
    
        var majorMinorLineLeft = selectAllOrCreateIfNotExist(gridG, 'line#mid-line-left.grid-line-clear.grid-axis-label')
            .attr('x1', minRadialDist)
            .attr('y1', 0)
            .attr('x2', maxRadialDist)
            .attr('y2', 0)
    
        var majorLabelLeft = selectAllOrCreateIfNotExist(gridG, 'text.label#mid-label-top-left.grid-axis-label.hide-on-mini')
            .text('Major')
            .attr('x', -maxRadialDist)
            .attr('y', -MID_LABEL_VERTICAL_OFFSET)
            .style('aligment-baseline', 'baseline')
            .style('text-anchor', 'start')
            .call(addHelpTooltip('major'))
        
        var minorLabelLeft = selectAllOrCreateIfNotExist(gridG, 'text.label#mid-label-bottom-left.grid-axis-label.hide-on-mini')
            .text('Minor')
            .attr('x', -maxRadialDist)
            .attr('y', MID_LABEL_VERTICAL_OFFSET)
            .style('alignment-baseline', 'hanging')
            .style('text-anchor', 'start')
            .call(addHelpTooltip('minor'))
        
        var majorLabelRight = selectAllOrCreateIfNotExist(gridG, 'text.label#mid-label-top-right.grid-axis-label.hide-on-mini')
            .text('Major')
            .attr('x', maxRadialDist)
            .attr('y', -MID_LABEL_VERTICAL_OFFSET)
            .style('aligment-baseline', 'baseline')
            .style('text-anchor', 'end')
            .call(addHelpTooltip('major'));
        
        var minorLabelRight = selectAllOrCreateIfNotExist(gridG, 'text.label#mid-label-bottom-right.grid-axis-label.hide-on-mini')
            .text('Minor')
            .attr('x', maxRadialDist)
            .attr('y', MID_LABEL_VERTICAL_OFFSET)
            .style('alignment-baseline', 'hanging')
            .style('text-anchor', 'end')
            .call(addHelpTooltip('minor'));

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

    axis.update = function (_scaleRadial, _scaleAngle, _center, _angleMappingLabel, _radialMappingLabel) {
        scaleRadial = _scaleRadial;
        scaleAngle = _scaleAngle;
        center = _center;
        angleMappingLabel = _angleMappingLabel;
        radialMappingLabel = _radialMappingLabel;
        return axis;
    }

    axis.showGuide = function (angle, radial, stroke = '#fff') {
        gridG.select('.guide-line.radial')
            .classed('hidden', false)
            .attr('r', scaleRadial(radial))
            .attr('stroke', stroke);
        gridG.select('.guide-line.angle')
            .classed('hidden', false)
            .attr('x1', angleDistanceToXy(scaleAngle(angle), minRadialDist)[0])
            .attr('y1', angleDistanceToXy(scaleAngle(angle), minRadialDist)[1])
            .attr('x2', angleDistanceToXy(scaleAngle(angle), maxRadialDist)[0])
            .attr('y2', angleDistanceToXy(scaleAngle(angle), maxRadialDist)[1])
            .attr('stroke', stroke);
        gridG.selectAll('.label-angle')
            .filter(k => k == angle)
            .attr('fill', stroke)
            .classed('highlight', true);
    }

    axis.hideGuide = function () {
        gridG.selectAll('.guide-line')
            .classed('hidden', true)
            .transition();
        gridG.selectAll('.label-angle')
            .attr('fill', '#fff')
            .classed('highlight', false);
    }

    axis.scaleRadial = function (_) {
        return arguments.length ? (scaleRadial = _, axis) : scaleRadial;
    }

    return axis;    
}