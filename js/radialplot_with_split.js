// facts
const MAX_SPLITS = 4;
const ALL_KEYS = [
    'Cm', 'C♯m/D♭m', 'Dm', 'D♯m/E♭', 'Em', 'Fm', 'F♯m/G♭m', 'Gm', 'G♯m/A♭m', 'Am', 'A♯m/B♭m', 'Bm',
    'C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B',
];

// computed consts
const ANGLE_TILT = Math.PI * 2 / ALL_KEYS.length / 2;    // can't draw the "0" upright, we want the major/minor line to be completely horizontal
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
        
        this.selectedSong = false;

        // default config
        this.config = {
            showAlbumArt: true,
            multiView: false,
            xMapping: {
                key: 'key_signature',
                scale: 'linear',
                minOverride: false,
                maxOverride: false,
                isRadial: true
            },
            yMapping: {
                key: 'tempo',
                scale: 'linear',
                minOverride: false,
                maxOverride: false,
                isRadial: false
            },
            // yMapping: 'tempo',
            dotRadiusMapping:'popularity',
            // yMapping.scale:'linear',
            // yMapping.minOverride: false,
            // yMapping.maxOverride: false,
            isSplitting: false,
            splits: 1,
            enableForce: true,
            splitKey: x => x.collection_id,
        }
        
        this.PADDING = 50;
        this.COLOR_SCHEME = ['#FCA981','#6988F2','#F36293', '#81D0EF'];//['#f36293', '#81d0ef', '#fca981', '#6988f2'];
        this.TIME_SIG_AS_POLYGON = true;
        this.RADIAL_KEYS = {
            'key_signature': 'x',
            'key': 'x'
        }
        
        // data-dependent computed consts, will update when data is loaded
        this.SCALE_X = x => x;
        this.SCALE_Y = x => x;
        this.SCALE_DOT_RADIUS = x => x;
        this.SCALE_DOT_COLOR = x => x;

        this.filter = x => true;
        this.highlight = x => true;
        this.filteredData = this.data.filter(this.filter);

        this.grids = [];
        this.shouldReinitGrid = true;
        
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
        d3.selectAll('#select-x-axis')
            .on('change', function () {
                let selectedOption = this.options[this.selectedIndex];
                _this.setConfig({
                    xMapping: {
                        key: selectedOption.value,
                        scaleType: selectedOption.getAttribute('data-scale-type'),
                        minOverride: selectedOption.getAttribute('data-scale-min') || false,
                        maxOverride: selectedOption.getAttribute('data-scale-max') || false,
                        isRadial: selectedOption.getAttribute('data-radial') || false
                    }
                });
            });
        d3.selectAll('#select-y-axis')
            .on('change', function () {
                let selectedOption = this.options[this.selectedIndex];
                _this.setConfig({
                    yMapping: {
                        key: selectedOption.value,
                        scaleType: selectedOption.getAttribute('data-scale-type'),
                        minOverride: selectedOption.getAttribute('data-scale-min') || false,
                        maxOverride: selectedOption.getAttribute('data-scale-max') || false,
                        isRadial: selectedOption.getAttribute('data-radial') || false
                    }
                });
            });

        // handler for clicking outside of a song
        // FIXME
        d3.select('body').on('click', function () {
            function equalToEventTarget() {
                return this == d3.event.target;
            }

            var outsideDot = d3.selectAll('.song.active .dot').filter(equalToEventTarget).empty();
            var outsideButton = d3.selectAll('.radial-mapping-select').filter(equalToEventTarget).empty();
            if (outsideDot && outsideButton) {
                _this.resetSelection();
                _this.selectionLocked = false;
            }
        });

        this.redraw();
    }

    /**
     * @desc updates vis according to new data
     * @param Array newData - new data to be drawn
     * @return void
    */
    onDataChanged (newData) {
        let _this = this

        // update split view
        if (new Set(this.data.map(d => this.config.splitKey(d))).size != newData.length) {
            this.svg.selectAll('g.grid').remove();
            this.shouldReinitGrid = true;
        }

        // preprocessing
        let newDataArr = []
        newData.forEach(function (d) {
            d.songs.forEach(function (s) {
                s.collection_id = d.id;
                s.collection_name = d.name;
            });
            newDataArr = newDataArr.concat(d.songs);
        });

        this.data = arrayMerge(this.data, newDataArr, 'id');

        // this.data = newData;
        this.data.forEach(function (d) {
            if (!d.x || !d.y) {
                d.x = _this.W / 2;
                d.y = _this.H / 2;
            }
            d.key_signature = _this.getKeyFromKeyId(d.key, d.mode);
        });

        this.filteredData = this.data.filter(this.filter)
        this.shouldReinitGrid = true;

        this.redraw();
    }

    /**
     * @desc redraws the vis when screen size is changed
     * @param void
     * @return void
    */
    onScreenSizeChanged () {
        this.redraw();
    }

    /**
     * @desc updates parameters of the vis, then redraw the vis
     * @param Object config - key-value of config parameters used in this vis
     * @return void
    */
    setConfig (config) {
        console.log('set config', config);

        let willBeRadial = false;
        willBeRadial = willBeRadial || config.xMapping !== undefined && config.xMapping.isRadial;
        willBeRadial = willBeRadial || config.yMapping !== undefined && config.yMapping.isRadial;

        if (
            (config.isSplitting !== undefined && config.isSplitting != this.config.isSplitting) ||
            (willBeRadial != this.useRadialScale())
            ) {
            this.svg.selectAll('g.grid').remove();
            this.shouldReinitGrid = true;
        }

        for (let i in config) {
            this.config[i] = config[i];
        }

        this.redraw();
    }

    /**
     * @desc draws grid in the back of the vis
     * @param void
     * @return void
    */
    initGrid () {
        this.grids = [];
        this.allGridsG = selectAllOrCreateIfNotExist(this.svg, 'g.grids-all');
        for (let i = 0 ; i < this.SPLITS; i++) {
            let multiGridG = selectAllOrCreateIfNotExist(this.allGridsG, `g#grid-split-${i}`);
            if (this.useRadialScale())
                this.grids.push(axisRadial(
                    this.SCALE_X, 
                    this.SCALE_Y, 
                    this.CENTER_BY_NUM_SPLITS[this.SPLITS][i],
                    this.config.xMapping.key,
                    this.config.yMapping.key));
            else{
                console.log('asdfasdf', this.SCALE_X.domain())
                this.grids.push(axisRect(
                    this.SCALE_X, 
                    this.SCALE_Y, 
                    this.CENTER_BY_NUM_SPLITS[this.SPLITS][i],
                    this.config.xMapping.key,
                    this.config.yMapping.key));
                }
            multiGridG.call(this.grids[i]);
        }
    }

    useRadialScale () {
        return this.config.xMapping.isRadial || this.config.yMapping.isRadial;
    }

    /**
     * @desc draws the whole vis if have not drawn, otherwise updates the vis
     * @param void
     * @return void
    */
    redraw () {
        this.recomputeConsts();

        // draw grid
        if (this.shouldReinitGrid) {
            this.initGrid();
        }

        // IF you want to actually draw a vinyl record...
        // FIXME z-index issues
        // d3.selectAll('g.vinyl').remove();
        // for (let i in this.CENTER_BY_NUM_SPLITS[this.SPLITS]) {
        //     let vinylG = selectAllOrCreateIfNotExist(this.svg, `g.vinyl#vinyl-${i}`)
        //         .attr('transform', `translate(${this.CENTER_BY_NUM_SPLITS[this.SPLITS][i].join(',')})`)
        //     let vinylOuter = selectAllOrCreateIfNotExist(vinylG, 'circle.vinyl-outer')
        //         .attr('r', this.SCALE_Y.range()[1])
        //         .style('fill', '#020202');
        //     let vinylCenter = selectAllOrCreateIfNotExist(vinylG, 'circle.vinyl-center')
        //         .attr('r', this.SCALE_Y.range()[0])
        //         .style('fill', this.COLOR_SCHEME[i]);
        //     let vinylHole = selectAllOrCreateIfNotExist(vinylG, 'circle.vinyl-hole')
        //         .attr('r', this.SCALE_Y.range()[0] / 20)
        //         .style('fill', '#212039');
        // }
        
        console.log('///', this.SPLITS);
        for (let i in this.CENTER_BY_NUM_SPLITS[this.SPLITS]) {
            let multiGridG = selectAllOrCreateIfNotExist(this.allGridsG, `g#grid-split-${i}`);
            this.grids[i].update(this.SCALE_Y, 
                this.SCALE_X, 
                this.CENTER_BY_NUM_SPLITS[this.SPLITS][i],
                this.config.xMapping.key,
                this.config.yMapping.key);
            multiGridG.call(this.grids[i]);

            if (this.selectedSong) {
                this.grids[i].showGuide(
                    this.selectedSong[this.config.xMapping.key], 
                    this.selectedSong[this.config.yMapping.key], 
                    this.SCALE_DOT_COLOR(this.config.splitKey(this.selectedSong))
                    );
            }
        }

        this.lineLayer = selectAllOrCreateIfNotExist(this.svg, 'g#line-layer')


        this.drawDataPoints();
        this.initForce();
        

        // buttons
        let _this = this;
        // let angle = d3.select('.radial-mapping-select.active').attr('data-angle');
        // d3.select('#radial-view-controls')
        //     .attr('data-angle', angle)
        //     .style('transform', `rotate(-${angle}deg)`)
        // d3.selectAll('.radial-mapping-select')
        //     .style('position', 'absolute')
        //     .attr('data-angle', function (d, i) {
        //         return i / d3.selectAll('.radial-mapping-select').size() * 360;
        //     })
        //     .style('transform', function (d, i) {
        //         let parentAngle = d3.select('#radial-view-controls').attr('data-angle');
        //         let angle = i / d3.selectAll('.radial-mapping-select').size() * 360 - 90;
        //         let x = (_this.MAX_RADIAL_DIST + 65) * Math.cos(angle * Math.PI / 180);
        //         let y = (_this.MAX_RADIAL_DIST + 65) * Math.sin(angle * Math.PI / 180);
        //         let selfAngle = angle + 90;
        //         if (selfAngle > 90 && selfAngle < 270) {
        //             selfAngle += 180;
        //         }
        //         return `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${selfAngle}deg)`
        //     });
    }

    /**
     * @desc change filter function for data, the data drawn in vis are only those that satisfies the filter
     * @param function filterFunction - boolean function for the filter
     * @return void
    */
    onFilter (filterFunction) {
        this.filter = filterFunction;
        this.filteredData = this.data.filter(filterFunction);
        // this.redraw();
        // FIXME force is not right when filtered
        this.drawDataPoints();
    }

    /**
     * @desc change highlighting function for data, the data that satisfies the function will be highlighted
     * @param function filterFunction - boolean function for the highlighting function
     * @return void
    */
    onHighlight(filterFunction) {
        this.highlight = filterFunction;
        d3.selectAll('.song')
            .classed('fade', d => !this.highlight(d));
        // this.redraw();
    }

    /**
     * @desc gives a little more flexibiliy in choosing the scale function
     * @param string type ('linear' | 'log') - type of desired scale
     * @return d3.scale with the type corresponding to the input
    */
    scaleSelector (type) {
        if (type == 'linear')
            return d3.scaleLinear()
        else if (type == 'log')
            return d3.scaleLog()
        else 
            return d3.scaleLinear()
    }

    /**
     * @desc recompute all computed constants for drawing the vis. The constants may be computed from the data or the screen size or both
     * @param void
     * @return void
    */
    recomputeConsts() {
        this.H = parseInt(this.svg.style("height"), 10);
        this.W = parseInt(this.svg.style("width"), 10);

        this.CENTER_BY_NUM_SPLITS = {
            1: [[this.W / 2, this.H / 2]],
            2: [
                [this.W / 4, this.H / 2],
                [this.W * 3 / 4, this.H / 2],    
            ],
            3: [
                [this.W / 4, this.H / 4],
                [this.W * 3 / 4, this.H / 4],
                [this.W / 2, this.H * 3 / 4],
            ],
            4: [
                [this.W / 4, this.H / 4],
                [this.W * 3 / 4, this.H / 4],
                [this.W / 4, this.H * 3 / 4],
                [this.W * 3 / 4, this.H * 3 / 4],
            ], 
        }

        let nGroups = d3.nest()
            .key(this.config.splitKey)
            .entries(this.filteredData)
            .length
        this.SPLITS = this.config.isSplitting ? Math.min(nGroups, MAX_SPLITS) : 1;
        
        this.MIN_RADIAL_DIST = this.SPLITS == 1 ? 
            Math.min(this.W, this.H) / 8 : 
            Math.min(this.W, this.H) / 16;
        this.MAX_RADIAL_DIST = this.SPLITS == 1 ? 
            Math.min(this.W, this.H) / 2 - this.PADDING:
            Math.min(this.W, this.H) / 4 - this.PADDING;

        console.log('>>>', this.useRadialScale());
        if (this.useRadialScale())
            this.SCALE_X = SCALE_ANGLE;
        else
            this.SCALE_X = this.scaleSelector(this.config.xMapping.scale)
                .domain(this.data.length == 0 ? [0, 1] :
                    [
                        this.config.xMapping.minOverride || d3.min(this.data, d => d[this.config.xMapping.key]), 
                        this.config.xMapping.maxOverride || d3.max(this.data, d => d[this.config.xMapping.key])
                    ] 
                )
                .range(this.SPLITS == 1 ? 
                    [-this.W / 2 + this.PADDING, this.W / 2 - this.PADDING] :
                    [-this.W / 4 + this.PADDING, this.W / 4 - this.PADDING]
                    );

        this.SCALE_Y = this.scaleSelector(this.config.yMapping.scale)
            .domain(this.data.length == 0 ? [0, 1] :
                [
                    this.config.yMapping.minOverride || d3.min(this.data, d => d[this.config.yMapping.key]), 
                    this.config.yMapping.maxOverride || d3.max(this.data, d => d[this.config.yMapping.key])
                ] 
            )
            .range(this.useRadialScale() ? 
                [this.MIN_RADIAL_DIST, this.MAX_RADIAL_DIST] :
                this.SPLITS == 1 ? 
                    [this.H / 2 - this.PADDING, -this.H / 2 + this.PADDING] :
                    [this.H / 4 - this.PADDING, -this.H / 4 + this.PADDING]);
        
        if (this.filteredData) {
            let tempScale = d3.scalePow()
                .exponent(0.5)
                .domain(d3.extent(this.data, d => d[this.config.dotRadiusMapping]))
                .range([2, 10]);
            let dataByKey = d3.nest()
                .key(d => this.SPLITS == 1 ? 
                    this.getKeyFromKeyId(d.key, d.mode) : 
                    `${this.getKeyFromKeyId(d.key, d.mode)} - ${this.config.splitKey(d)}` )
                .rollup(v => ({
                    sumArea: d3.sum(v, d => Math.PI * tempScale(d[this.config.dotRadiusMapping]) * tempScale(d[this.config.dotRadiusMapping])),
                    count: v.length
                }))
                .entries(this.filteredData);
            let maxSumAreaSpoke = d3.max(dataByKey, d => d.value.sumArea);
            let maxCount = d3.max(dataByKey, d => d.value.count);
            let drawingArea = Math.pow(Math.min(this.W, this.H), 2);
            this.SCALE_DOT_RADIUS = d3.scalePow()
                .exponent(0.5)
                .domain(d3.extent(this.data, d => d[this.config.dotRadiusMapping]))
                .range([2, drawingArea / (this.SPLITS == 1 ? 700 : 1400) * Math.sqrt(1 / maxSumAreaSpoke)]);
        }
            
        this.SCALE_DOT_COLOR = d3.scaleOrdinal(this.COLOR_SCHEME);
        this.SCALE_DOT_CHART_INDEX = this.SPLITS == 1 ?
            x => 0 :
            d3.scaleOrdinal(d3.range(0, this.SPLITS, 1))
    }
    
    /**
     * @desc initlize or update d3.forceSimulation
     * @param void
     * @return void
    */
    initForce () {
        let _this = this;
        if (!this.force) {
            this.force = d3.forceSimulation(this.filteredData)
                .force('collision', d3.forceCollide())
                .force('x', d3.forceX())
                .force('y', d3.forceY())
                // // .alphaTarget(1)
                .on("tick", function tick(e) {
                    _this.svg.selectAll('g.song')
                        .filter(d => d.x && d.y)
                        .attr('transform', d => `translate(${d.x}, ${d.y})`);

                    // FIXME transition animation is lost after the 1st time
                    let similarityLinks = _this.lineLayer.selectAll('line.similarity-link')
                        .attr('opacity', s => s.similarity)
                        .attr('x1', s => s.source.x)
                        .attr('y1', s => s.source.y)
                        .transition(d3.transition().duration(70))
                        .attr('x2', s => s.song.x)
                        .attr('y2', s => s.song.y)
                });
        }          

        this.force.velocityDecay(0.5);
        this.force.nodes(this.filteredData);
        if (this.config.enableForce)
            this.force.force('collision').radius(d => _this.SCALE_DOT_RADIUS(d[_this.config.dotRadiusMapping]) + 2);
        else
            this.force.force('collision').radius(0);
        this.force.force('x').x(d => _this.CENTER_BY_NUM_SPLITS[_this.SPLITS][_this.SCALE_DOT_CHART_INDEX(this.config.splitKey(d))][0] + _this.dataToXy(d, false, _this.useRadialScale())[0]).strength(0.2);
        this.force.force('y').y(d => _this.CENTER_BY_NUM_SPLITS[_this.SPLITS][_this.SCALE_DOT_CHART_INDEX(this.config.splitKey(d))][1] + _this.dataToXy(d, false, _this.useRadialScale())[1]).strength(0.2);
        this.force.alphaTarget(0.7).restart()
       
    }
    
    /**
     * @desc draw data points or updates if they already exists
     * @param void
     * @return void
    */
    drawDataPoints () {
        let _this = this;
        var songG = this.svg.selectAll('g.song').data(this.filteredData, d => d.id);
    
        var songGEnter = songG.enter()
            .append('g')
            .attr('class', 'song')
            .attr('id', d => `song-${d.id}`)
            .call(d3.drag()
                .on('drag', function (d) {
                    d.isDragging = true;
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                })
                .on('end', function (d, i, m) {
                    d.isDragging = false;
                    d.fx = null;
                    d.fy = null;
                    let dropTargetEl = document.elementFromPoint(d3.event.sourceEvent.clientX, d3.event.sourceEvent.clientY);
                    let dropTargetId = 'drop-area';
                    console.log(dropTargetEl)
                    while (dropTargetEl && dropTargetEl.id != dropTargetId) {
                        console.log(dropTargetEl)
                        dropTargetEl = dropTargetEl.parentNode;
                    }
                    let dropTarget = d3.select(dropTargetEl);
                    if (dropTarget != null && dropTarget.attr("id") == dropTargetId) {
                        let starViewDrawer = d3.select(dropTarget.node().parentNode);
                        starViewDrawer.classed('hide', false);
                        // if (this.parentNode.classList.contains('hide'))
                        //     this.parentNode.classList.remove('hide')
                        // else
                        //     this.parentNode.classList.add('hide')
                        //alert('TODO: detailed analysis');
                        new StarView(d3.select('svg#star-view'), [], dispatch).onDataChanged(d);
                    }
                }));
            
        var songGEnterInner = songGEnter.append('g')
            .attr('class', d => `song-inner rotate-anim rotate-${d.time_signature}`)
            .style('animation-duration', d => `${60 / d.tempo * d.time_signature}s`)
    
        var defs = songGEnterInner.append('svg:defs');
        
        defs.append('svg:pattern')
            .attr('id', d => `image${d.id}`)
            .attr("patternUnits", "userSpaceOnUse")
            .append("svg:image")
            // FIXME get album art once the api has been fixed
            .attr("xlink:href", d => d.album) //d.album.images[2].url)
    
        var polygonPoints = songGEnterInner
            .filter(d => this.TIME_SIG_AS_POLYGON ? d.time_signature > 2 : false)
            .append('polygon')
            .attr('class', 'dot pulse')
    
        var circlePoints = songGEnterInner
            .filter(d => this.TIME_SIG_AS_POLYGON ? d.time_signature <= 2 : true)
            .append('circle')
            .attr('class', 'dot pulse')
            
        songGEnter.on("mouseover", this.mouseActions('mouseover'))
            .on("click", this.mouseActions('click'))
            .on("mouseout", this.mouseActions('mouseout'));

        songG.merge(songGEnter)
            .selectAll('defs pattern')
            .attr("width", d => 2 * this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
            .attr("height", d => 2 * this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
            .attr("x", d => -this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
            .attr("y", d => -this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
            .selectAll("image")
            .attr("width", d => 2 * this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
            .attr("height", d => 2 * this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]));

        songG.merge(songGEnter)
            .classed('fade', d => !this.highlight(d));

        songG.merge(songGEnter)
            .selectAll('.dot')
            .style('animation-duration', d => `${60 / d.tempo}s`)
            .style('stroke', d => this.SCALE_DOT_COLOR(this.config.splitKey(d)))
            .style('fill', d => this.config.showAlbumArt ? `url(#image${d.id})` : this.SCALE_DOT_COLOR(this.config.splitKey(d)))
            .transition()
            .style('fill-opacity', d => this.config.enableForce ? 1 : 0.2)
            .style('stroke-opacity', d => this.config.enableForce ? 1 : 0.8)

        songG.merge(songGEnter)
            .selectAll('polygon.dot')
            .attr('points', function (d) {
                // draw regular polygons
                var points = [];
                
                var n = d.time_signature;
                
                var theta_offset_radial = _this.useRadialScale() ? SCALE_ANGLE(_this.getKeyFromKeyId(d.key, d.mode)) : -Math.PI / 2;
                var theta_offset = 2 * Math.PI / d.time_signature / 2 + Math.PI + theta_offset_radial;
                
                var size = _this.SCALE_DOT_RADIUS(d[_this.config.dotRadiusMapping]);
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

        songG.merge(songGEnter)
            .selectAll('circle.dot')
            .attr('r', d => this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
    
        songG.exit().remove();
    }
    
    /**
     * @desc mouse action function selector for each data point
     * @param string action ('mouseover' | 'click' | 'mouseout') - type of event
     * @return function for handling the specified mouse event
    */
    mouseActions (action) {
        let _this = this;
        if (action == 'mouseover') {
            return function (d, i) {
                if (d.isDragging) return;
                
                if (!_this.selectedSong) {
                    // d = d;
                    _this.selectSong(d);
                } else {
                    _this.dispatch.call('highlight', this, function (k) {
                        let isTheSong = k.id == d.id;
                        let isTheSelectedSong = k.id == _this.selectedSong.id;
                        // let isSimilarSong = _this.similarSongsToSelection.filter(x => x.song.id == k.id).length > 0;
                        return isTheSelectedSong || isTheSong// || isSimilarSong;
                    });
                }

                _this.songToolTip.show(d, this);
            }
        } else if (action == 'click') {
            return function (d, i, m) {
                if (!_this.selectedSong) {
                    _this.selectSong(d);
                    _this.songToolTip.show(d, this);
                }

                if (_this.selectionLocked) {
                    if (_this.selectedSong == d) {
                        _this.resetSelection();
                        _this.selectionLocked = false;
                    } else {
                        _this.resetSelection();
                        _this.selectSong(d);
                        _this.songToolTip.show(d, this);
                        m[i].closest('.song').classList.add('active');
                        _this.selectedSong = d;
                    }
                } else {
                    _this.selectionLocked = true;
                    m[i].closest('.song').classList.add('active');
                    _this.selectedSong = d;
                }
                
            }
        } else if (action == 'mouseout') {
            return function (d, i) {
                if (!_this.selectionLocked) {
                    _this.resetSelection();
                } else {
                    _this.songToolTip.hide({}, this);
                    _this.dispatch.call('highlight', this, function (k) {
                        let isTheSelectedSong = k.id == _this.selectedSong.id;
                        // let isSimilarSong = _this.similarSongsToSelection.filter(x => x.song.id == k.id).length > 0;
                        return isTheSelectedSong// || isSimilarSong;
                    });
                }
                // TODO make it look better
            }
        }
    }

    /**
     * @desc highlight, play, and show similar songs to a song on the vis
     * @param Object d - data of the selected point
     * @param int k - number of similar songs to be suggested
     * @return function for handling the specified mouse event
    */
    selectSong (d, k = 5) {
        this.selectedSong = d;
        if (!this.selectedSong.audio) {
            this.selectedSong.audio = new Audio(this.selectedSong.preview_url);
            this.selectedSong.audio.loop = true;
        }
        this.selectedSong.audio.playFadeIn();

        let similarSongs = this.getSimilarSongs(this.selectedSong, k);

        let _this = this;
        this.dispatch.call('highlight', this, s => s.id == d.id);
        // let isSimilarSong = _this.similarSongsToSelection.filter(x => x.song.id == k.id).length > 0;
    
        _this.grids.forEach(function (g, i) {
            g.showGuide(
                d[_this.config.xMapping.key], 
                d[_this.config.yMapping.key], 
                _this.SCALE_DOT_COLOR(_this.config.splitKey(d)));
            });

        let similarityLinks = _this.lineLayer.selectAll('line.similarity-link')
            .data(similarSongs)
            .enter()
            .append('line')
            .attr('class', 'similarity-link')
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .attr('pointer-events', 'none')
            .attr('opacity', s => s.similarity)
            .attr('x1', s => s.source.x)
            .attr('y1', s => s.source.y)
            .attr('x2', s => s.source.x)
            .attr('y2', s => s.source.y)
        
        _this.svg.selectAll('line.similarity-link')
            .transition()
            .attr('x2', s => s.song.x)
            .attr('y2', s => s.song.y)
        
        _this.svg.selectAll('.song')
            .filter(d => similarSongs.filter(x => x.song.id == d.id).length > 0)
            .classed('similar-highlight', true);
    }

    /**
     * @desc deselects everything in the vis, stops music playback
     * @param void
     * @return void
    */
    resetSelection () {
        let _this = this;
        
        if (this.selectedSong) {
            this.selectedSong.audio.stopFadeOut();
            this.selectedSong = false;
        }

        this.svg.selectAll('.song')
            .classed('active', false)
            .classed('similar-highlight', false);

        this.songToolTip.hide({}, this);
        this.grids.forEach(function (g) {
            g.hideGuide();
        });
        this.dispatch.call('highlight', this, k => true);

        this.svg.selectAll('line.similarity-link').remove();
    }

    /**
     * @desc suggests songs similar to a song from within the local data
     * @param Object d - data of the reference song
     * @param int k - number of similar songs to be suggested
     * @return array of Objects containing: the source song, suggested song, and similarity score in [0, 1] range
    */
    getSimilarSongs (d, k = 5) {
        // FIXME make this work
        let similarSongs = [];
        for (let i = 0; i < k; i++) {
            let index = Math.floor(Math.random() * this.filteredData.length);
            // please return in this format
            similarSongs.push({
                source: d,
                song: this.filteredData[index],
                similarity: Math.random() * 0.8 + 0.2 
            });
        }
        return similarSongs;
    }
    
    
    // helpers
    
    /**
     * @desc converts polar coordinates to x,y coordinates
     * @param float angle - angle in polar coordinates
     * @param float distance - distance from origin in polar coordinates
     * @return Array of [x, y] coordinates corresponding to the given polar coordinates
    */
    angleDistanceToXy (angle, distance) {
        return [
            Math.cos(angle) * distance,
            Math.sin(angle) * distance
        ]
    }

    /**
     * @desc converts spotify's key and mode attributes to key and mode in musical notation
     * @param int key - key in range of [0, 11] (C to A)
     * @param int mode - mode in range of [0, 1] (major/minor)
     * @return string - musical notation of the key
    */
    getKeyFromKeyId (key, mode = false) {
        if (mode === false) {
            mode = Math.ceil(key / 12);
            key = key % 12;
        }
    
        return ALL_KEYS[key + mode * 12];
        // return ALL_KEYS[key * 2 + mode];
    }
    
    /**
     * @desc round number to a certain decimal points
     * @param float value - the number to be rounded
     * @param int decimal - number of desired decimal points
     * @return float - rounded number
    */
    round(value, decimals) {
       return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    /**
     * @desc map a data point to its target x,y position
     * @param Object d - the data point
     * @param float distanceOverride (optional) - for radial coordinates: arbitrary distance from the origin
     * @param boolean isRadial (optional) - 
     *      true if you want the radial coordinates plot with key/mode as the angle axis
     *      false if you want x,y coordinates for a given pair of attibutes and scales (unfinished)
     * @return Array - [x, y] coordinates of the data point
    */
    dataToXy (d, distanceOverride, isRadial = true) {
        if (isRadial) {
            let angle = this.SCALE_X(this.getKeyFromKeyId(d.key, d.mode));
            let distance = distanceOverride || this.SCALE_Y(d[this.config.yMapping.key]);
            return this.angleDistanceToXy(angle, distance);
        } else {
            // temp
            
            let s = Math.min(this.W, this.H);
            let xScale = d3.scaleLinear()
                .domain(d3.extent(this.data, d => d[this.config.xMapping.key]))
                .range([-this.W / 2 + this.PADDING, this.W / 2 - this.PADDING]);

            // let yScale = this.scaleSelector(this.config.yMapping.scale)
            //     .domain(this.data.length == 0 ? [0, 1] :
            //         this.config.yMapping.minOverride !== false ? 
            //             [this.config.yMapping.minOverride, this.config.yMapping.maxOverride] : 
            //             d3.extent(this.data, d => d[this.config.yMapping.key]))
            //     .range([this.H / 2 - this.PADDING, -this.H / 2 + this.PADDING]);
            
            // xScale(d[this.config.xMapping.key])
            return [this.SCALE_X(d[this.config.xMapping.key]), this.SCALE_Y(d[this.config.yMapping.key])]
        }
    }
}