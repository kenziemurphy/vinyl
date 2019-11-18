// config
const TIME_SIG_AS_POLYGON = true;
const ENABLE_FORCE = true;
const NUM_RADIAL_GRID_LINES = 5;

const COLOR_SCALE = ['#fca981', '#6988f2', '#f36293', '#81d0ef'];

// facts
const ALL_KEYS = [
    'Cm', 'C♯m/D♭m', 'Dm', 'D♯m/E♭', 'Em', 'Fm', 'F♯m/G♭m', 'Gm', 'G♯m/A♭m', 'Am', 'A♯m/B♭m', 'Bm',
    'C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B',
];

// computed consts
const NUM_KEYS = ALL_KEYS.length;
const ANGLE_TILT = Math.PI * 2 / NUM_KEYS / 2;    // can't draw the "0" upright, we want the major/minor line to be completely horizontal
const ALL_KEYS_RANGE = d3.range(0, NUM_KEYS, 1);
const SCALE_ANGLE = d3.scaleOrdinal()
    .domain(ALL_KEYS)
    .range(d3.range(
        ANGLE_TILT, 
        Math.PI * 2 + ANGLE_TILT,
        Math.PI * 2 / ALL_KEYS.length
    ));



class RadialView {
    constructor (svg, data = [], dispatch) {
        
        this.svg = svg;
        this.data = data;
        this.dispatch = dispatch;
        
        // defaults
        this.RADIAL_MAPPING = 'tempo';
        this.DOT_RADIUS_MAPPING = 'popularity';
        this.SCALE_RADIAL_TYPE = 'linear';
        
        // svg = d3.select('.vis svg#radial-plot');
    
        // screen-dependent computed consts, will update when screen size is changed for responsive vis
        // this.svg.style("height", window.innerHeight);
        // this.svg.style("width", window.innerWidth / 2);
        this.recomputeScreenConsts();
        
        // data-dependent computed consts, will update when data is loaded
        this.SCALE_RADIAL = x => x;
        this.SCALE_DOT_RADIUS = x => x;
        this.SCALE_DOT_COLOR = x => x;
        this.recomputeDataConsts();

        this.filter = x => true;
        this.highlight = x => true;
        this.filteredData = this.data.filter(this.filter);

        this.redraw();
        
        this.songToolTip = d3.tip()
            .attr("class", "d3-tip song-tooltip")
            .offset([-5, 0])
            .direction('n')
            .html(function(d) {
                return `
                    <p>
                        <b>${d.name}</b>
                        <br>${d.artists ? d.artists.map(a => a.name) : 'Unknown Artist'}
                    </p>
                `;
            });

        this.svg.call(this.songToolTip);

        let _this = this;
        d3.selectAll('button.radial-mapping-select')
            .on('click', function () {
                _this.RADIAL_MAPPING = this.getAttribute('data-attr');
                _this.SCALE_RADIAL_TYPE = this.getAttribute('data-scale-type');
                _this.recomputeDataConsts();
                _this.redraw();

                d3.selectAll('button.radial-mapping-select')
                    .classed('active', (d, i, l) => l[i].getAttribute('data-attr') ==_this.RADIAL_MAPPING)
                // d3.select('#radial-view-controls')
                //     .style('transform-origin', `50% 50%`)
                //     .style('transform', `rotate(${this.getAttribute('data-angle') * 180 / Math.PI}deg)`)
            });
    }

    // init () {
        
    // }

    onDataChanged (newData) {
        let _this = this

        this.data = newData;
        this.data.forEach(function (d) {
            d.x = _this.W / 2;
            d.y = _this.H / 2;
        });
        this.filteredData = this.data.filter(this.filter)
        this.recomputeDataConsts();
        this.redraw(true);
    }

    onScreenSizeChanged () {
        this.recomputeScreenConsts();
        this.redraw();
    }

    redraw (resetForce = true) {
        this.drawGrid();
        this.drawDataPoints();
        if (ENABLE_FORCE && resetForce) {
            this.initForce();
        }

        let _this = this;
        d3.selectAll('.radial-mapping-select')
            .style('position', 'absolute')
            .attr('data-angle', function (d, i) {
                return i / d3.selectAll('.radial-mapping-select').size() * Math.PI * 2 - Math.PI / 2;
            })
            .style('transform', function (d, i) {
                let angle = i / d3.selectAll('.radial-mapping-select').size() * Math.PI * 2 - Math.PI / 2;
                let x = _this.W / 2 + (_this.MAX_RADIAL_DIST + 70) * Math.cos(angle);
                let y = _this.H / 2 + (_this.MAX_RADIAL_DIST + 70) * Math.sin(angle);
                let selfAngle = angle * 180 / Math.PI + 90;
                if (selfAngle > 90 && selfAngle < 270) {
                    selfAngle += 180;
                }
                return `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${selfAngle}deg)`
            });
    }

    onFilter (filterFunction) {
        this.filter = filterFunction;
        this.filteredData = this.data.filter(filterFunction);
        // this.redraw();
        // FIXME force is not right when filtered
        this.drawDataPoints();
    }

    onHighlight(filterFunction) {
        this.highlight = filterFunction;
        d3.selectAll('.song')
            .classed('fade', d => !this.highlight(d));
        // this.redraw();
    }

    scaleSelector (type) {
        if (type == 'linear')
            return d3.scaleLinear()
        if (type == 'log')
            return d3.scaleLog()
    }

    recomputeScreenConsts() {
        this.H = parseInt(this.svg.style("height"), 10);
        this.W = parseInt(this.svg.style("width"), 10);
        
        this.MIN_RADIAL_DIST = Math.min(this.W, this.H) / 8;
        this.MAX_RADIAL_DIST = Math.min(this.W, this.H) / 2 - 100;

        this.SCALE_RADIAL = this.scaleSelector(this.SCALE_RADIAL_TYPE)
            // .domain([0, d3.max(data, d => d[RADIAL_MAPPING])])
            // .domain([0, 1])
            .domain(this.data.length > 0 ?
                d3.extent(this.data, d => d[this.RADIAL_MAPPING]) : [0, 1])
            .range([this.MIN_RADIAL_DIST, this.MAX_RADIAL_DIST]);
    }

    recomputeDataConsts () {
        
        this.SCALE_RADIAL = this.scaleSelector(this.SCALE_RADIAL_TYPE)
            // .domain([0, d3.max(data, d => d[RADIAL_MAPPING])])
            // .domain([0, 1])
            .domain(this.data.length > 0 ?
                d3.extent(this.data, d => d[this.RADIAL_MAPPING]) : [0, 1])
            .range([this.MIN_RADIAL_DIST, this.MAX_RADIAL_DIST]);
        
        // TODO: how to make billboard data look good? dynamic sizing?
        this.SCALE_DOT_RADIUS = d3.scalePow()
            .exponent(0.5)
            .domain(d3.extent(this.data, d => d[this.DOT_RADIUS_MAPPING]))
            // .domain([0, 100])
            // .range([2, Math.sqrt(targetAreaUse / sumArea)]);
            .range([2, 10])
            // .range([2, 20]);
    
        
        this.SCALE_DOT_COLOR = d3.scaleOrdinal(COLOR_SCALE)
            // .domain(this.data.map(x => x.album.name)
            // .filter(function (value, index, self) { 
            //     // unique filter
            //     return self.indexOf(value) === index;
            // }));
    }
    
    
    initForce () {
        let _this = this;
        if (!this.force) {
            this.force = d3.forceSimulation(this.filteredData)
                .force('collision', d3.forceCollide().radius(d => _this.SCALE_DOT_RADIUS(d[_this.DOT_RADIUS_MAPPING]) + 1.5))
                .force('x', d3.forceX().x(d => _this.W / 2 + _this.dataToXy(d)[0]).strength(0.2))
                .force('y', d3.forceY().y(d => _this.H / 2 + _this.dataToXy(d)[1]).strength(0.2))
                .alphaTarget(1)
                .on("tick", function tick(e) {
                    _this.svg.selectAll('g.song')
                        .attr('transform', d => `translate(${d.x}, ${d.y})`);
                });
            // this.force.restart();
        } else {
            console.log('update force', this.RADIAL_MAPPING)
            
            this.force.nodes(this.filteredData);
            this.force.force('collision').radius(d => _this.SCALE_DOT_RADIUS(d[_this.DOT_RADIUS_MAPPING]) + 1.5);
            this.force.force('x').x(d => _this.W / 2 + _this.dataToXy(d)[0]).strength(0.2);
            this.force.force('y').y(d => _this.H / 2 + _this.dataToXy(d)[1]).strength(0.2);
            // .on("tick", function tick(e) {
                //     _this.svg.selectAll('g.song')
                //         .attr('transform', d => `translate(${d.x}, ${d.y})`);
                // });
            this.force.restart();
            console.log(this.force.nodes().length);
        }
    }
    
    
    drawGrid () {

        // remove existing grid and start anew
        d3.selectAll('svg g.grid')
            .remove();

        var minRadialData = this.SCALE_RADIAL.domain()[0];
        var maxRadialData = this.SCALE_RADIAL.domain()[1]; 

        minRadialData = isNaN(minRadialData) ? 0 : minRadialData;
        maxRadialData = isNaN(maxRadialData) ? 1 : maxRadialData;

        var radialGridGap = (maxRadialData - minRadialData) / NUM_RADIAL_GRID_LINES;
        var radialGridInterval = d3.range(minRadialData, maxRadialData, radialGridGap);
        var angularGridInterval = d3.range(0, NUM_KEYS, 1);
    
        radialGridInterval.push(maxRadialData);
    
        var gridG = this.svg.append('g')
            .attr('class', 'grid')
            .attr('pointer-events', 'none')
            .style('z-index', '-1')
            .attr('transform', `translate(${this.W / 2}, ${this.H / 2})`);
    
        var radialGrid = gridG.selectAll('circle.grid-line')
            .data(radialGridInterval)
            .enter()
            .append('circle')
            .attr('class', 'grid-line')
            .attr('r', d => this.SCALE_RADIAL(d))
            .attr('fill-opacity', '0')
            .attr('stroke-opacity', '0.2')
            .attr('stroke', '#ffffff')
    
        var angleGrid = gridG.selectAll('line.grid-line')
            .data(ALL_KEYS)
            .enter()
            .append('line')
            .attr('class', 'grid-line')
            .attr('x1', d => this.angleDistanceToXy(SCALE_ANGLE(d), this.MIN_RADIAL_DIST)[0])
            .attr('y1', d => this.angleDistanceToXy(SCALE_ANGLE(d), this.MIN_RADIAL_DIST)[1])
            .attr('x2', d => this.angleDistanceToXy(SCALE_ANGLE(d), this.MAX_RADIAL_DIST)[0])
            .attr('y2', d => this.angleDistanceToXy(SCALE_ANGLE(d), this.MAX_RADIAL_DIST)[1])
    
        // guides only show up when an item is hovers to help deal with offset position from force-directed chart
        var radialGuide = gridG.append('circle')
            .attr('class', 'guide-line radial hidden')
            .attr('r', this.SCALE_RADIAL(minRadialData))
            .attr('fill-opacity', '0')
    
        var angleGuide = gridG.append('line')
            .attr('class', 'guide-line angle hidden')
            .attr('x1', this.angleDistanceToXy(SCALE_ANGLE('C'), this.MIN_RADIAL_DIST)[0])
            .attr('y1', this.angleDistanceToXy(SCALE_ANGLE('C'), this.MIN_RADIAL_DIST)[1])
            .attr('x2', this.angleDistanceToXy(SCALE_ANGLE('C'), this.MAX_RADIAL_DIST)[0])
            .attr('y2', this.angleDistanceToXy(SCALE_ANGLE('C'), this.MAX_RADIAL_DIST)[1])
    
        var angleLabel = gridG.selectAll('text.label.label-angle')
            .data(ALL_KEYS)
            .enter()
            .append('text')
            .attr('class', 'label label-angle')
            .text(d => d)
            .attr('x', d => this.angleDistanceToXy(SCALE_ANGLE(d), this.MAX_RADIAL_DIST + 20)[0])
            .attr('y', d => this.angleDistanceToXy(SCALE_ANGLE(d), this.MAX_RADIAL_DIST + 20)[1])
            .attr('fill', '#ffffff')
    
        var radialLabelTop = gridG.selectAll('text.label.label-radial.top')
            .data(radialGridInterval)
            .enter()
            .append('text')
            .attr('class', 'label label-radial top')
            .text(d => this.round(d, 1))
            .attr('y', d => -this.SCALE_RADIAL(d))
            .attr('fill', '#ffffff')
    
        var radialTextLabelInnerTop = gridG.append('text')
            .attr('class', 'label label-axis-radial')
            .text(this.RADIAL_MAPPING.toUpperCase())
            .attr('y', -this.MIN_RADIAL_DIST + 30)
            .attr('font-weight', 'bold')
            .style('opacity', 0.7)
            .attr('fill', '#ffffff')
    
        var radialTextLabelOuterTop = gridG.append('text')
            .attr('class', 'label label-axis-radial')
            .text(this.RADIAL_MAPPING.toUpperCase())
            .attr('y', -this.MAX_RADIAL_DIST - 30)
            .attr('font-weight', 'bold')
            .style('opacity', 0.7)
            .attr('fill', '#ffffff')
    
        var radialLabelBottom = gridG.selectAll('text.tempo.label.bottom')
            .data(radialGridInterval)
            .enter()
            .append('text')
            .attr('class', 'label label-radial bottom')
            .text(d => this.round(d, 1))
            .attr('y', d => this.SCALE_RADIAL(d))
            .attr('fill', '#ffffff')
    
        var radialTextLabelInnerBottom = gridG.append('text')
            .attr('class', 'label label-axis-radial')
            .text(this.RADIAL_MAPPING.toUpperCase())
            .attr('y', this.MIN_RADIAL_DIST - 30)
            .attr('font-weight', 'bold')
            .style('opacity', 0.7)
            .attr('fill', '#ffffff')
    
        var radialTextLabelOuterBottom = gridG.append('text')
            .attr('class', 'label label-axis-radial')
            .text(this.RADIAL_MAPPING.toUpperCase())
            .attr('y', this.MAX_RADIAL_DIST + 30)
            .attr('font-weight', 'bold')
            .style('opacity', 0.7)
            .attr('fill', '#ffffff')
    
        // major/minor line
        // FIXME hardcoding
        var majorMinorLabelOffset = 60;
        var majorMinorLineLeft = gridG.append('line')
            .attr('class', 'grid-line-clear')
            .attr('x1', -this.MIN_RADIAL_DIST)
            .attr('y1', 0)
            .attr('x2', -this.MAX_RADIAL_DIST - majorMinorLabelOffset)
            .attr('y2', 0)
    
        var majorMinorLinRight = gridG.append('line')
            .attr('class', 'grid-line-clear')
            .attr('x1', this.MIN_RADIAL_DIST)
            .attr('y1', 0)
            .attr('x2', this.MAX_RADIAL_DIST + majorMinorLabelOffset)
            .attr('y2', 0)
    
        var majorLabelLeft = gridG.append('text')
            .text('MAJOR')
            .attr('fill', '#ffffff')
            .attr('x', -this.MAX_RADIAL_DIST - majorMinorLabelOffset)
            .attr('y', -7)
            .attr('aligment-baseline', 'baseline')
            .attr('text-anchor', 'start')
        
        var minorLabelLeft = gridG.append('text')
            .text('MINOR')
            .attr('fill', '#ffffff')
            .attr('x', -this.MAX_RADIAL_DIST - majorMinorLabelOffset)
            .attr('y', 7)
            .attr('alignment-baseline', 'hanging')
            .attr('text-anchor', 'start')
        
        var majorLabelRight = gridG.append('text')
            .text('MAJOR')
            .attr('fill', '#ffffff')
            .attr('x', this.MAX_RADIAL_DIST + majorMinorLabelOffset)
            .attr('y', -7)
            .attr('aligment-baseline', 'baseline')
            .attr('text-anchor', 'end')
        
        var minorLabelRight = gridG.append('text')
            .text('MINOR')
            .attr('fill', '#ffffff')
            .attr('x', this.MAX_RADIAL_DIST + majorMinorLabelOffset)
            .attr('y', 7)
            .attr('alignment-baseline', 'hanging')
            .attr('text-anchor', 'end')
    }
    
    updateGrid () {
        var minRadialData = this.SCALE_RADIAL.domain()[0];
        var maxRadialData = this.SCALE_RADIAL.domain()[1]; 
        var radialGridGap = (maxRadialData - minRadialData) / NUM_RADIAL_GRID_LINES;
        var radialGridInterval = d3.range(minRadialData, maxRadialData, radialGridGap);
        var angularGridInterval = d3.range(0, NUM_KEYS, 1);
    
        radialGridInterval.push(maxRadialData);
    
        var gridG = this.svg.select('g.grid')
            
        var radialGrid = gridG.selectAll('circle.grid-line').data(radialGridInterval)
    
        var radialGridEnter = radialGrid.enter()
            .append('circle')
            .attr('class', 'grid-line')
        
        radialGrid.merge(radialGridEnter)
            .transition()
            .attr('r', d => this.SCALE_RADIAL(d))
            .attr('fill-opacity', '0')
            .attr('stroke-opacity', '0.2')
            .attr('stroke', '#ffffff')
        
        radialGrid.exit().remove();
    
        var radialLabelTop = gridG.selectAll('text.label.label-radial')
            .data(radialGridInterval)
    
        var radialLabelTopEnter = radialLabelTop
            .enter()
            .append('text')
            .attr('class', 'label label-radial top')
        
        radialLabelTop.merge(radialLabelTopEnter)
            .transition()
            .text(d => this.round(d, 1))
            .attr('y', d => -this.SCALE_RADIAL(d))
            .attr('fill', '#ffffff')
        
        radialLabelTop.exit().remove();
    
        var radialTextLabel = gridG.selectAll('text.label-axis-radial')
            .text(this.RADIAL_MAPPING.toUpperCase())
    }
    
    drawDataPoints () {
        let _this = this;
        var songG = this.svg.selectAll('g.song').data(this.filteredData, d => d.id)
    
        var songGEnter = songG.enter()
            .append('g')
            .attr('class', 'song');
            
        var songGEnterInner = songGEnter.append('g')
            .attr('class', d => `song-inner rotate-anim rotate-${d.time_signature}`)
            .style('animation-duration', d => `${60 / d.tempo * d.time_signature}s`)
    
        var defs = songGEnterInner.append('svg:defs');
        
        defs.append('svg:pattern')
            .attr('id', d => `image${d.id}`)
            .attr("width", d => 2 * this.SCALE_DOT_RADIUS(d[this.DOT_RADIUS_MAPPING]))
            .attr("height", d => 2 * this.SCALE_DOT_RADIUS(d[this.DOT_RADIUS_MAPPING]))
            .attr("x", d => -this.SCALE_DOT_RADIUS(d[this.DOT_RADIUS_MAPPING]))
            .attr("y", d => -this.SCALE_DOT_RADIUS(d[this.DOT_RADIUS_MAPPING]))
            .attr("patternUnits", "userSpaceOnUse")
            .append("svg:image")
            .attr("xlink:href", d => d.album.images[2].url)
            .attr("width", d => 2 * this.SCALE_DOT_RADIUS(d[this.DOT_RADIUS_MAPPING]))
            .attr("height", d => 2 * this.SCALE_DOT_RADIUS(d[this.DOT_RADIUS_MAPPING]));
    
        var polygonPoints = songGEnterInner
            .filter(d => TIME_SIG_AS_POLYGON ? d.time_signature > 2 : false)
            .append('polygon')
            .attr('class', 'dot pulse')
            .attr('points', function (d) {
                // draw regular polygons
                var points = [];
                
                var n = d.time_signature;
                
                var theta_offset_radial = SCALE_ANGLE(_this.getKeyFromKeyId(d.key, d.mode));
                var theta_offset = 2 * Math.PI / d.time_signature / 2 + Math.PI + theta_offset_radial;
                
                var size = _this.SCALE_DOT_RADIUS(d[_this.DOT_RADIUS_MAPPING]);
                var targetArea = Math.PI * size * size;
                var axesLength = Math.sqrt(targetArea / (n * Math.sin(Math.PI / n) * Math.cos(Math.PI / n)));
    
                for (var i = 0; i < d.time_signature; i++) {
                    var theta = i * 2 * Math.PI / d.time_signature;
    
                    var x = Math.cos(theta + theta_offset) * axesLength;
                    var y = Math.sin(theta + theta_offset) * axesLength;
                    points.push([x, y]);
                }
    
                return points.map(d => `${d[0]},${d[1]}`).join(' ');
            })
    
        var circlePoints = songGEnterInner
            .filter(d => TIME_SIG_AS_POLYGON ? d.time_signature <= 2 : true)
            .append('circle')
            .attr('class', 'dot pulse')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', d => this.SCALE_DOT_RADIUS(d[this.DOT_RADIUS_MAPPING]))
            
        songGEnterInner.selectAll('.dot')
            .style('animation-duration', d => `${60 / d.tempo}s`)
            // .style('stroke-width', 2.5)
            .style('stroke-opacity', 1)
            .style('stroke', d => this.SCALE_DOT_COLOR(d.artists[0].id))
            .style('fill', d => this.SCALE_DOT_COLOR(d.artists[0].id))
            .style('fill', d => `url(#image${d.id})`)
            .style('fill-opacity', 1)
            .on("mouseover", function (d, i) {
                d.audio = new Audio(d.preview_url);
                d.audio.loop = true;
                // d.audio.volume = 0;
                d.audio.play();
                // FIXME fadeTo is still buggy.
                // d.audio.fadeTo(1);
                _this.songToolTip.show(d, this);
    
                // highlight on grid
                d3.select('.guide-line.radial')
                    .classed('hidden', false)
                    .attr('r', _this.SCALE_RADIAL(d[_this.RADIAL_MAPPING]))
                d3.select('.guide-line.angle')
                    .classed('hidden', false)
                    .attr('x1', _this.dataToXy(d, _this.MIN_RADIAL_DIST)[0])
                    .attr('y1', _this.dataToXy(d, _this.MIN_RADIAL_DIST)[1])
                    .attr('x2', _this.dataToXy(d, _this.MAX_RADIAL_DIST)[0])
                    .attr('y2', _this.dataToXy(d, _this.MAX_RADIAL_DIST)[1])
                d3.selectAll('.label-angle')
                    .filter(k => k == _this.getKeyFromKeyId(d.key, d.mode))
                    .classed('highlight', true)
                // d3.selectAll('.song')
                //     // .filter(k => k.id != d.id)
                //     .classed('fade', k => k.id != d.id)

                dispatch.call('highlight', this, k => k.id == d.id);
            })
            .on("click", function (d, i) {
                console.log(d.audio)
                if (!d.audio) {
                    d.audio = new Audio(d.preview_url);
                    d.audio.loop = true;
                }
                // d.audio.volume = 0;
                d.audio.play();
                dispatch.call('highlight', this, k => k.id == d.id);
                // FIXME fadeTo is still buggy.
                // d.audio.fadeTo(1);
            })
            .on("mouseout", function (d, i) {
                // FIXME fadeTo is still buggy.
                // d.audio.fadeTo(0).then(function () {
                //     console.log('faded out');
                //     d.audio.pause();
                //     d.audio.currentTime = 0;
                // });
                d.audio.pause();
                d.audio.currentTime = 0;
                _this.songToolTip.hide(d, this);
    
                d3.selectAll('.guide-line')
                    .classed('hidden', true)
                    .transition()
                d3.selectAll('.label-angle')
                    .classed('highlight', false)
                // d3.selectAll('.song')
                //     .classed('fade', d => !_this.highlight(d));

                dispatch.call('highlight', this, k => true);
            });

        songG.merge(songGEnter)
            .classed('fade', d => !this.highlight(d))
            // .attr("cy", function(d) { return d.x; })
            // .transition()
            // .attr('transform', function (d) {
            //     let coord = _this.dataToXy(d);
            //     let x = _this.W / 2 + coord[0];
            //     let y = _this.H / 2 + coord[1];
            //     return `translate(${x}, ${y})`
            // })
    
        songG.exit().remove();
    }
    
    
    
    // helpers
    
    angleDistanceToXy (angle, distance) {
        return [
            Math.cos(angle) * distance,
            Math.sin(angle) * distance
        ]
    }
    
    getKeyFromKeyId (key, mode = false) {
        if (mode === false) {
            mode = Math.ceil(key / 12);
            key = key % 12;
        }
    
        return ALL_KEYS[key + mode * 12];
        // return ALL_KEYS[key * 2 + mode];
    }
    
    
    
    round(value, decimals) {
       return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    dataToXy (d, distanceOverride) {
        let angle = SCALE_ANGLE(this.getKeyFromKeyId(d.key, d.mode));
        let distance = distanceOverride || this.SCALE_RADIAL(d[this.RADIAL_MAPPING]);
        return this.angleDistanceToXy(angle, distance);
    }
}