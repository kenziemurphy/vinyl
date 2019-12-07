function axisRect (xScale, yScale, center, xMappingLabel, yMappingLabel, showAxes = true) {

    const NUM_GRID_LINES = 5;
    const MID_LABEL_HORIZONTAL_OFFSET = 25;
    const MID_LABEL_VERTICAL_OFFSET = 7;
    const AXIS_LABEL_OFFSET = {
        x: 30,
        y: 20
    };

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
        .tickSize(H)
        .tickFormat(d3.format("f"));
    var axisT = d3.axisTop(scaleX)
        .tickValues(xGridInterval)
        .tickSize(0)
        .tickFormat(d3.format("f"));
    var axisL = d3.axisLeft(scaleY)
        .tickValues(yGridInterval)
        .tickSize(-W)
        .tickFormat(d3.format("f"));
    var axisR = d3.axisRight(scaleY)
        .tickValues(yGridInterval)
        .tickSize(0)
        .tickFormat(d3.format("f"));
    

    var axis = function (context) {
        console.log('domain', scaleX.domain(), scaleY.domain());
        let selection = context.selection ? context.selection() : context
        
        gridG = selectAllOrCreateIfNotExist(selection, 'g.grid')
            .style('z-index', '-1')
            .attr('transform', `translate(${center[0]}, ${center[1]})`);
        
        axisB.tickFormat(Utils.formatByKey(xMappingLabel));
        axisT.tickFormat(Utils.formatByKey(xMappingLabel));
        axisL.tickFormat(Utils.formatByKey(yMappingLabel));
        axisR.tickFormat(Utils.formatByKey(yMappingLabel));

        selectAllOrCreateIfNotExist(gridG, 'g.axis-rect.axis-b')
            .attr('transform', `translate(0, ${-H / 2})`)
            .call(axisB)
            .call(g => g.selectAll(".tick line")
                .attr("stroke-opacity", 0.2));

        selectAllOrCreateIfNotExist(gridG, 'g.axis-rect.axis-t')
            .attr('transform', `translate(0, ${H / 2})`)
            .call(axisT)
            .call(g => g.selectAll(".tick line")
                .attr("stroke-opacity", 0.2));

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

        // axis labels
        let yLabelRightG = selectAllOrCreateIfNotExist(gridG, 'g.label-axis-y-left-g')
            .attr('transform', `translate(${scaleX.range()[1] + AXIS_LABEL_OFFSET.x}, 0)`);
        selectAllOrCreateIfNotExist(yLabelRightG, 'text.label.label-axis-y.grid-axis-label.right')
            .attr('transform', 'rotate(90)');

        let yLabelLeftG = selectAllOrCreateIfNotExist(gridG, 'g.label-axis-y-right-g')
            .attr('transform', `translate(${scaleX.range()[0] - AXIS_LABEL_OFFSET.x}, 0)`);
        selectAllOrCreateIfNotExist(yLabelLeftG, 'text.label.label-axis-y.grid-axis-label.left')
            .attr('transform', 'rotate(-90)');

        selection.selectAll('text.label.label-axis-y')
            .text(Utils.formatKeyLabel(yMappingLabel))
            .call(addHelpTooltip(yMappingLabel.toLowerCase()));

        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-x.grid-axis-label.top')
            .attr('y', scaleY.range()[1] - AXIS_LABEL_OFFSET.y);
        selectAllOrCreateIfNotExist(gridG, 'text.label.label-axis-x.grid-axis-label.bottom')
            .attr('y', scaleY.range()[0] + AXIS_LABEL_OFFSET.y);
        selection.selectAll('text.label.label-axis-x')
            .text(Utils.formatKeyLabel(xMappingLabel))
            .call(addHelpTooltip(xMappingLabel.toLowerCase()));

        if (!showAxes) {
            gridG.selectAll("text").remove();
        }

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

    axis.update = function (_scaleY, _scaleX, _center, _xMappingLabel, _yMappingLabel, _showAxes = true) {
        scaleY = _scaleY;
        scaleX = _scaleX;
        center = _center;
        xMappingLabel = _xMappingLabel;
        yMappingLabel = _yMappingLabel;
        showAxes = _showAxes;
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