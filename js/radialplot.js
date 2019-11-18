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
        this.SCALE_MIN_OVERRIDE = false;
        this.SCALE_MAX_OVERRIDE = false;
        this.recomputeScreenConsts();
        
        // data-dependent computed consts, will update when data is loaded
        this.SCALE_RADIAL = x => x;
        this.SCALE_DOT_RADIUS = x => x;
        this.SCALE_DOT_COLOR = x => x;

        this.filter = x => true;
        this.highlight = x => true;
        this.filteredData = this.data.filter(this.filter);

        this.recomputeDataConsts();
        
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
                        <br><small>Click to lock the selection</small>
                    </p>
                `;
            });

        this.svg.call(this.songToolTip);

        let _this = this;
        d3.selectAll('button.radial-mapping-select')
            .on('click', function () {
                _this.RADIAL_MAPPING = this.getAttribute('data-attr');
                _this.SCALE_RADIAL_TYPE = this.getAttribute('data-scale-type');
                _this.SCALE_MIN_OVERRIDE = this.getAttribute('data-scale-min') || false;
                _this.SCALE_MAX_OVERRIDE = this.getAttribute('data-scale-max') || false;
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
        this.grid = axisRadial(this.SCALE_RADIAL, SCALE_ANGLE, [this.W / 2, this.H / 2], this.RADIAL_MAPPING);
        this.svg.call(this.grid);

        // multiple grids
        // let gridCenters = [
        //     [this.W / 4, this.H / 4],
        //     [this.W / 4, 3 * this.H / 4],
        //     [3 * this.W / 4, this.H / 4],
        //     [3 * this.W / 4, 3 * this.H / 4]
        // ]
        // this.svg.selectAll('g.grid-small')
        //     .data(gridCenters)
        //     .enter()
        //     .append('g')
        //     .attr('class', 'grid-small')
        //     .attr('transform', d => `translate(${d[0]}, ${d[1]})`)
        //     .call(axisRadial(this.SCALE_RADIAL, SCALE_ANGLE, [0, 0], this.RADIAL_MAPPING))
        
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
            .domain(this.data.length == 0 ? [0, 1] :
                this.SCALE_MIN_OVERRIDE !== false ? 
                    [this.SCALE_MIN_OVERRIDE, this.SCALE_MAX_OVERRIDE] : 
                    d3.extent(this.data, d => d[this.RADIAL_MAPPING]))
            .range([this.MIN_RADIAL_DIST, this.MAX_RADIAL_DIST]);
        
        // if (this.filteredData) {
        //     let tempScale = d3.scalePow()
        //         .exponent(0.5)
        //         .domain(d3.extent(this.data, d => d[this.DOT_RADIUS_MAPPING]))
        //         .range([2, 10]);
        //     let dataByKey = d3.nest()
        //         .key(d => this.getKeyFromKeyId(d.key, d.mode))
        //         .rollup(v => ({
        //             sumArea: d3.sum(v, d => Math.PI * tempScale(d[this.DOT_RADIUS_MAPPING]) * tempScale(d[this.DOT_RADIUS_MAPPING])),
        //             count: v.length
        //         }))
        //         .entries(this.filteredData);
        //     let maxSumAreaSpoke = d3.max(dataByKey, d => d.value.sumArea);
        //     let maxCount = d3.max(dataByKey, d => d.value.count);
        //     let drawingArea = Math.pow(Math.min(this.W, this.H), 2);
        //     this.SCALE_DOT_RADIUS = d3.scalePow()
        //         .exponent(0.5)
        //         .domain(d3.extent(this.data, d => d[this.DOT_RADIUS_MAPPING]))
        //         .range([2, drawingArea / 700 * Math.sqrt(1 / maxSumAreaSpoke)]);
        // }
    }

    recomputeDataConsts () {
        
        this.SCALE_RADIAL = this.scaleSelector(this.SCALE_RADIAL_TYPE)
            // .domain([0, d3.max(data, d => d[RADIAL_MAPPING])])
            // .domain([0, 1])
            .domain(this.data.length == 0 ? [0, 1] :
                this.SCALE_MIN_OVERRIDE !== false ? 
                    [this.SCALE_MIN_OVERRIDE, this.SCALE_MAX_OVERRIDE] : 
                    d3.extent(this.data, d => d[this.RADIAL_MAPPING]))
            .range([this.MIN_RADIAL_DIST, this.MAX_RADIAL_DIST]);
        
        let tempScale = d3.scalePow()
            .exponent(0.5)
            .domain(d3.extent(this.data, d => d[this.DOT_RADIUS_MAPPING]))
            .range([2, 10]);
        let dataByKey = d3.nest()
            .key(d => this.getKeyFromKeyId(d.key, d.mode))
            .rollup(v => ({
                sumArea: d3.sum(v, d => Math.PI * tempScale(d[this.DOT_RADIUS_MAPPING]) * tempScale(d[this.DOT_RADIUS_MAPPING])),
                count: v.length
            }))
            .entries(this.filteredData);
        let maxSumAreaSpoke = d3.max(dataByKey, d => d.value.sumArea);
        let maxCount = d3.max(dataByKey, d => d.value.count);
        let drawingArea = Math.pow(Math.min(this.W, this.H), 2);
        this.SCALE_DOT_RADIUS = d3.scalePow()
            .exponent(0.5)
            .domain(d3.extent(this.data, d => d[this.DOT_RADIUS_MAPPING]))
            .range([2, drawingArea / 700 * Math.sqrt(1 / maxSumAreaSpoke)]);
            
        
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
                // deselect
                if (_this.selectionLocked) {
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

                    _this.dispatch.call('highlight', this, k => true);
                }

                if (!d.audio) {
                    d.audio = new Audio(d.preview_url);
                }
                d.audio.loop = true;
                // d.audio.volume = 0;
                d.audio.play();
                // FIXME fadeTo is still buggy.
                // d.audio.fadeTo(1);
                
                // highlight song
                _this.songToolTip.show(d, this);
                _this.grid.showGuide(_this.getKeyFromKeyId(d.key, d.mode), d[_this.RADIAL_MAPPING]);

                _this.dispatch.call('highlight', this, k => k.id == d.id);
            })
            .on("mousedown", function (d, i) {
                console.log('dragStart');
                d.isDragging = true;
            })
            .on("mousemove", function (d, i, m) {
                // console.log('mousemove', d, i, m[i]);
                // console.log(_this.svg);
                // let coordinates = d3.mouse(_this.svg);

                // console.log(coordinates);
                // d.fx = d.x + coordinates[0];
                // d.fy = d.y + coordinates[1];
                // d.isDragging = true;
            })
            .on("mouseup", function (d, i) {
                console.log('mousemove');
                d.isDragging = false;
            })
            .on("click", function (d, i) {
                // TODO: lock selection
                console.log(d.audio)
                if (!d.audio) {
                    d.audio = new Audio(d.preview_url);
                    d.audio.loop = true;
                    this.classed('active', true);
                }
                // d.audio.volume = 0;
                d.audio.play();
                _this.dispatch.call('highlight', this, k => k.id == d.id);
                // _this.selectionLocked = true;
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
                // if (!_this.selectionLocked) {
                    d.audio.pause();
                    d.audio.currentTime = 0;

                    _this.songToolTip.hide(d, this);
                    _this.grid.hideGuide();
        
                    _this.dispatch.call('highlight', this, k => true);
                // }
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