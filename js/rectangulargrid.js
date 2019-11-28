function axisRect (xScale, yScale, center, xMappingLabel, yMappingLabel) {

    console.log('!!!!')
    const NUM_GRID_LINES = 5;
    const MID_LABEL_HORIZONTAL_OFFSET = 25;
    const MID_LABEL_VERTICAL_OFFSET = 7;
    const AXIS_LABEL_OFFSET = 20;

    var scaleX = xScale;
    var scaleY = yScale;

    var xGridGap = (scaleX.domain()[1] - scaleX.domain()[0]) / NUM_GRID_LINES;
    var yGridGap = (scaleY.domain()[1] - scaleY.domain()[0]) / NUM_GRID_LINES;

    var xGridInterval = d3.range(scaleX.domain()[0], scaleX.domain()[1], xGridGap);
    var yGridInterval = d3.range(scaleY.domain()[0], scaleY.domain()[1], yGridGap);

    xGridInterval.push(scaleX.domain()[1]);
    yGridInterval.push(scaleY.domain()[1]);

    var yGuide, xGuide;
    
    var gridG;

    var W = scaleX.range()[1] - scaleX.range()[0];
    var H = scaleY.range()[1] - scaleY.range()[0];

    var axisB = d3.axisBottom(scaleX)
        .tickValues(xGridInterval)
        .tickSize(H);
    var axisT = d3.axisTop(scaleX)
        .tickValues(xGridInterval)
        .tickSize(0);
    var axisL = d3.axisLeft(scaleY)
        .tickValues(yGridInterval)
        .tickSize(-W);
    var axisR = d3.axisRight(scaleY)
        .tickValues(yGridInterval)
        .tickSize(0);
    

    function round(value, decimals) {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    var axis = function (context) {
        console.log('domain', scaleX.domain(), scaleY.domain());
        let selection = context.selection ? context.selection() : context
        
        gridG = selectAllOrCreateIfNotExist(selection, 'g.grid')
            .style('z-index', '-1')
            .attr('transform', `translate(${center[0]}, ${center[1]})`);
        
        selectAllOrCreateIfNotExist(gridG, 'g.axis-rect.axis-b')
            .attr('transform', `translate(0, ${-H / 2})`)
            .call(axisB)
            .call(g => g.selectAll(".tick line")
                .attr("stroke-opacity", 0.2));
        selectAllOrCreateIfNotExist(gridG, 'g.axis-rect.axis-t')
            .attr('transform', `translate(0, ${H / 2})`)
            .call(axisT)
            .call(g => g.selectAll(".tick line")
                .attr("stroke-opacity", 0.2))
;
        selectAllOrCreateIfNotExist(gridG, 'g.axis-rect.axis-l')
            .attr('transform', `translate(${-W / 2}, 0)`)
            .call(axisL)
            .call(g => g.selectAll(".tick line")
                .attr("stroke-opacity", 0.2));
        selectAllOrCreateIfNotExist(gridG, 'g.axis-rect.axis-r')
            .attr('transform', `translate(${W / 2}, 0)`)
            .call(axisR)
            .call(g => g.selectAll(".tick line")
                .attr("stroke-opacity", 0.2));
        // selectAllOrCreateIfNotExist(gridG, 'g.axis-y')
        //     .call(axisY)
        //     .call(g => g.selectAll(".tick line")
        //         .attr("stroke-opacity", 0.2)
        //         .attr("transform", `translate(${W / 2}, 0)`));
        // gridG.call(axisY);

        // // y grid enter-update-exit
        // console.log('Y', yGridInterval)
        // var yGrid = gridG.selectAll('line.grid-line.y').data(yGridInterval);
        // var yGridEnter = yGrid.enter()
        //     .append('line')
        //     .attr('class', 'grid-line y')
        //     .attr('fill-opacity', '0')
        //     .attr('stroke-opacity', '0.2')
        //     .attr('stroke', '#ffffff')
            
        // yGrid.merge(yGridEnter)
        //     .transition()
        //     .attr('x1', d => W / 2)
        //     .attr('x2', d => -W / 2)
        //     .attr('y1', d => scaleY(d))
        //     .attr('y2', d => scaleY(d))

        // yGrid.exit().remove();

        // axis labels
        let yLabelRightG = selectAllOrCreateIfNotExist(gridG, 'g.label-axis-y-left-g')
            .attr('transform', `translate(${scaleX.range()[1] + AXIS_LABEL_OFFSET}, 0)`);
        selectAllOrCreateIfNotExist(yLabelRightG, 'text.label.label-axis-y.grid-axis-label.right')
            .attr('transform', 'rotate(90)');

        let yLabelLeftG = selectAllOrCreateIfNotExist(gridG, 'g.label-axis-y-right-g')
            .attr('transform', `translate(${scaleX.range()[0] - AXIS_LABEL_OFFSET}, 0)`);
        selectAllOrCreateIfNotExist(yLabelLeftG, 'text.label.label-axis-y.grid-axis-label.left')
            .attr('transform', 'rotate(-90)');

        selection.selectAll('text.label.label-axis-y')
            .text(yMappingLabel.toUpperCase())
            .call(addHelpTooltip(yMappingLabel.toLowerCase()));


        // // y scale labels
        // // top
        // var yLabelsTop = gridG.selectAll('text.label.label-y.top').data(yGridInterval)
        // var yLabelsTopEnter = yLabelsTop.enter()
        //     .append('text')
        //     .attr('class', 'label label-y top')
        
        // yLabelsTop.merge(yLabelsTopEnter)
        //     .transition()
        //     .text(d => round(d, 1))
        //     .attr('y', d => scaleY(d))
        //     .attr('fill', '#ffffff');

        // yLabelsTop.exit().remove();

        // // x grid enter-update-exit
        // var xGrid = gridG.selectAll('line.grid-line.x').data(xGridInterval);
        // var xGridEnter = xGrid.enter()
        //     .append('line')
        //     .attr('class', 'grid-line x')
        //     .attr('fill-opacitx', '0')
        //     .attr('stroke-opacitx', '0.2')
        //     .attr('stroke', '#ffffff')
        
        // xGrid.merge(xGridEnter)
        //     .transition()
        //     .attr('y1', d => -H / 2)
        //     .attr('y2', d => H / 2)
        //     .attr('x1', d => scaleX(d))
        //     .attr('x2', d => scaleX(d))

        // xGrid.exit().remove();

        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-x.grid-axis-label.top')
            .attr('y', scaleY.range()[1] - AXIS_LABEL_OFFSET);
        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-x.grid-axis-label.bottom')
            .attr('y', scaleY.range()[0] + AXIS_LABEL_OFFSET);
        selection.selectAll('text.label.label-axis-x')
            .text(xMappingLabel.toUpperCase())
            .call(addHelpTooltip(xMappingLabel.toLowerCase()));
        // // axis labels
        // // selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-x.grid-axis-label.outer-bottom')
        // //     .attr('x', maxYRange + 30);
        // // selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-x.grid-axis-label.inner-bottom')
        // //     .attr('x', minYRange - 30);
        // // selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-x.grid-axis-label.outer-top')
        // //     .attr('x', -maxYRange - 30);
        // // selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-x.grid-axis-label.inner-top')
        // //     .attr('x', -minYRange + 30);
        // // selection.selectAll('text.label.label-axis-x').text(xMappingLabel.toUpperCase());

        // // x scale labels
        // // top
        // var xLabelsTop = gridG.selectAll('text.label.label-x.top').data(xGridInterval)
        // var xLabelsTopEnter = xLabelsTop.enter()
        //     .append('text')
        //     .attr('class', 'label label-x top')
        
        // xLabelsTop.merge(xLabelsTopEnter)
        //     .transition()
        //     .text(d => round(d, 1))
        //     .attr('x', d => -scaleX(d))
        //     .attr('fill', '#ffffff');

        // xLabelsTop.exit().remove();
    


        // // central lines        
        // var majorMinorLinRight = selectAllOrCreateIfNotExist(gridG, 'line#mid-line-x.grid-line-clear.grid-axis-label')
        //     .attr('x1', -W / 2)
        //     .attr('y1', 0)
        //     .attr('x2', W / 2)
        //     .attr('y2', 0)
    
        // var majorMinorLinRight = selectAllOrCreateIfNotExist(gridG, 'line#mid-line-y.grid-line-clear.grid-axis-label')
        //     .attr('x1', 0)
        //     .attr('y1', -H / 2)
        //     .attr('x2', 0)
        //     .attr('y2', H / 2)
    
        // var majorLabelLeft = selectAllOrCreateIfNotExist(gridG, 'text#mid-label-top-left.grid-axis-label')
        //     .text('MAJOR')
        //     .attr('x', -maxYRange - MID_LABEL_HORIZONTAL_OFFSET)
        //     .attr('y', -MID_LABEL_VERTICAL_OFFSET)
        //     .attr('aligment-baseline', 'baseline')
        //     .attr('text-anchor', 'start')
        
        // var minorLabelLeft = selectAllOrCreateIfNotExist(gridG, 'text#mid-label-bottom-left.grid-axis-label')
        //     .text('MINOR')
        //     .attr('x', -maxYRange - MID_LABEL_HORIZONTAL_OFFSET)
        //     .attr('y', MID_LABEL_VERTICAL_OFFSET)
        //     .attr('alignment-baseline', 'hanging')
        //     .attr('text-anchor', 'start')
        
        // var majorLabelRight = selectAllOrCreateIfNotExist(gridG, 'text#mid-label-top-right.grid-axis-label')
        //     .text('MAJOR')
        //     .attr('x', maxYRange + MID_LABEL_HORIZONTAL_OFFSET)
        //     .attr('y', -MID_LABEL_VERTICAL_OFFSET)
        //     .attr('aligment-baseline', 'baseline')
        //     .attr('text-anchor', 'end')
        
        // var minorLabelRight = selectAllOrCreateIfNotExist(gridG, 'text#mid-label-bottom-right.grid-axis-label')
        //     .text('MINOR')
        //     .attr('x', maxYRange + MID_LABEL_HORIZONTAL_OFFSET)
        //     .attr('y', MID_LABEL_VERTICAL_OFFSET)
        //     .attr('alignment-baseline', 'hanging')
        //     .attr('text-anchor', 'end');

        // guides only show up when an item is hovers to help deal with offset position from force-directed chart
        yGuide = selectAllOrCreateIfNotExist(gridG, 'line#y-guide.guide-line.y')
            .classed('hidden', true)
            .attr('x1', scaleX.range()[0])
            .attr('y1', scaleY.range()[0])
            .attr('x2', scaleX.range()[1])
            .attr('y2', scaleY.range()[0]);

        xGuide = selectAllOrCreateIfNotExist(gridG, 'line#x-guide.guide-line.x')
            .classed('hidden', true)
            .attr('x1', scaleX.range()[0])
            .attr('y1', scaleY.range()[0])
            .attr('x2', scaleX.range()[0])
            .attr('y2', scaleY.range()[1]);
    }

    axis.update = function (_scaleY, _scaleX, _center, _xMappingLabel, _yMappingLabel) {
        scaleY = _scaleY;
        scaleX = _scaleX;
        center = _center;
        xMappingLabel = _xMappingLabel;
        yMappingLabel = _yMappingLabel;
        W = scaleX.range()[1] - scaleX.range()[0];
        H = scaleY.range()[1] - scaleY.range()[0];
        return axis;
    }

    axis.showGuide = function (x, y, stroke = '#fff') {
        gridG.select('.guide-line.y')
            .classed('hidden', false)
            .attr('x1', -W / 2)
            .attr('y1', scaleY(y))
            .attr('x2', W / 2)
            .attr('y2', scaleY(y))
            .attr('stroke', stroke);

        console.log('xxxxx', x, scaleX, scaleX(x))
        gridG.select('.guide-line.x')
            .classed('hidden', false)
            .attr('x1', scaleX(x))
            .attr('y1', -H / 2)
            .attr('x2', scaleX(x))
            .attr('y2', H / 2)
            .attr('stroke', stroke);
        // gridG.selectAll('.label-x')
        //     .filter(k => k == x)
        //     .attr('fill', stroke)
        //     .classed('highlight', true);
    }

    axis.hideGuide = function () {
        gridG.selectAll('.guide-line')
            .classed('hidden', true)
            .transition();
        // gridG.selectAll('.label-x')
        //     .attr('fill', '#fff')
        //     .classed('highlight', false);
    }

    axis.scaleX = function (_) {
        return arguments.length ? (scaleX = _, axis) : scaleX;
    }

    axis.scaleY = function (_) {
        return arguments.length ? (scaleY = _, axis) : scaleY;
    }

    return axis;    
}