// facts
const ALL_KEYS = [
    'Cm', 'C♯m/D♭m', 'Dm', 'D♯m/E♭', 'Em', 'Fm', 'F♯m/G♭m', 'Gm', 'G♯m/A♭m', 'Am', 'A♯m/B♭m', 'Bm',
    'C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B',
];

// computed consts
const NUM_KEYS = ALL_KEYS.length;
const ANGLE_TILT = Math.PI * 2 / NUM_KEYS / 2;    // can't draw the "0" upright, we want the major/minor line to be completely horizontal
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
        
        // default config
        this.config = {
            showAlbumArt: true,
            multiView: false,
            radialMapping: 'tempo',
            dotRadiusMapping:'popularity',
            scaleRadialType:'linear',
            scaleMinOverride: false,
            scaleMaxOverride: false,
            splits: 1
        }
        
        this.COLOR_SCHEME = ['#fca981', '#6988f2', '#f36293', '#81d0ef'];
        this.TIME_SIG_AS_POLYGON = true;
        this.ENABLE_FORCE = true;
        
        // data-dependent computed consts, will update when data is loaded
        this.SCALE_RADIAL = x => x;
        this.SCALE_DOT_RADIUS = x => x;
        this.SCALE_DOT_COLOR = x => x;

        this.filter = x => true;
        this.highlight = x => true;
        this.filteredData = this.data.filter(this.filter);

        this.shouldReinitGrid = true;
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
                _this.setConfig({
                    radialMapping: this.getAttribute('data-attr'),
                    scaleRadialType: this.getAttribute('data-scale-type'),
                    scaleMinOverride: this.getAttribute('data-scale-min') || false,
                    scaleMaxOverride: this.getAttribute('data-scale-max') || false
                });
                d3.selectAll('button.radial-mapping-select')
                    .classed('active', (d, i, l) => l[i].getAttribute('data-attr') == _this.config.radialMapping);
            });

        // // TODO stop music when clicking outside
        // d3.select('body').on('click', function () {
        //     var outside = d3.selectAll('.dot.active').filter(function () { this == d3.event.target; }).empty();
        //     if (outside) {
        //         console.log('!!!!!');
        //         _this.resetSelection();
        //     }
        // });
    }

    onDataChanged (newData) {
        let _this = this

        this.data = newData;
        this.data.forEach(function (d) {
            d.x = _this.W / 2;
            d.y = _this.H / 2;
        });
        this.filteredData = this.data.filter(this.filter)
        this.shouldReinitGrid = true;
        this.redraw();
    }

    onScreenSizeChanged () {
        this.redraw();
    }

    setConfig (config) {
        if (config.splits !== undefined && config.splits != this.config.splits) {
            this.svg.selectAll('g.grid').remove();
            this.shouldReinitGrid = true;
        }

        for (let i in config) {
            this.config[i] = config[i];
        }

        this.redraw();
    }

    initGrid () {
        this.grids = [];
        this.allGridsG = selectAllOrCreateIfNotExist(this.svg, 'g.grids-all');
        for (let i = 0 ; i < this.config.splits; i++) {
            let multiGridG = selectAllOrCreateIfNotExist(this.allGridsG, `g#grid-split-${i}`);
            let g = axisRadial(
                this.SCALE_RADIAL, 
                SCALE_ANGLE, 
                this.CENTER_BY_NUM_SPLITS[this.config.splits][i],
                this.config.radialMapping);
            this.grids.push(g);
            multiGridG.call(this.grids[i]);
        }
    }

    redraw () {
        this.recomputeConsts();

        // draw grid
        if (this.shouldReinitGrid) {
            this.initGrid();
        }
        
        for (let i in this.CENTER_BY_NUM_SPLITS[this.config.splits]) {
            let multiGridG = selectAllOrCreateIfNotExist(this.allGridsG, `g#grid-split-${i}`);
            this.grids[i].update(this.SCALE_RADIAL, 
                SCALE_ANGLE, 
                this.CENTER_BY_NUM_SPLITS[this.config.splits][i],
                this.config.radialMapping);
            multiGridG.call(this.grids[i]);
        }

        this.drawDataPoints();
        if (this.ENABLE_FORCE) {
            this.initForce();
        }

        // buttons
        let _this = this;
        let angle = d3.select('.radial-mapping-select.active').attr('data-angle');
        // d3.select('#radial-view-controls')
        //     .attr('data-angle', angle)
        //     .style('transform', `rotate(-${+angle + 90}deg)`)
        d3.selectAll('.radial-mapping-select')
            .style('position', 'absolute')
            .attr('data-angle', function (d, i) {
                return i / d3.selectAll('.radial-mapping-select').size() * 360;
            })
            .style('transform', function (d, i) {
                let parentAngle = d3.select('#radial-view-controls').attr('data-angle');
                let angle = i / d3.selectAll('.radial-mapping-select').size() * 360 - 90;
                let x = (_this.MAX_RADIAL_DIST + 70) * Math.cos(angle* Math.PI / 180);
                let y = (_this.MAX_RADIAL_DIST + 70) * Math.sin(angle* Math.PI / 180);
                let selfAngle = angle + 90;
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
        
        this.MIN_RADIAL_DIST = this.config.splits == 1 ? 
            Math.min(this.W, this.H) / 8 : 
            Math.min(this.W, this.H) / 20;
        this.MAX_RADIAL_DIST = this.config.splits == 1 ? 
            Math.min(this.W, this.H) / 2 - 100 : 
            Math.min(this.W, this.H) / 4 - 50;

        this.SCALE_RADIAL = this.scaleSelector(this.config.scaleRadialType)
            .domain(this.data.length == 0 ? [0, 1] :
                this.config.scaleMinOverride !== false ? 
                    [this.config.scaleMinOverride, this.config.scaleMaxOverride] : 
                    d3.extent(this.data, d => d[this.config.radialMapping]))
            .range([this.MIN_RADIAL_DIST, this.MAX_RADIAL_DIST]);
        
        if (this.filteredData) {
            let tempScale = d3.scalePow()
                .exponent(0.5)
                .domain(d3.extent(this.data, d => d[this.config.dotRadiusMapping]))
                .range([2, 10]);
            let dataByKey = d3.nest()
                .key(d => this.config.splits == 1 ? 
                    this.getKeyFromKeyId(d.key, d.mode) : 
                    `${this.getKeyFromKeyId(d.key, d.mode)} - ${d.artists[0].id}` )
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
                .range([2, drawingArea / (this.config.splits == 1 ? 700 : 1400) * Math.sqrt(1 / maxSumAreaSpoke)]);
        }
            
        this.SCALE_DOT_COLOR = d3.scaleOrdinal(this.COLOR_SCHEME);
        this.SCALE_DOT_CHART_INDEX = this.config.splits == 1 ?
            x => 0 :
            d3.scaleOrdinal(d3.range(0, this.config.splits, 1))
    }
    
    initForce () {
        let _this = this;
        if (!this.force) {
            this.force = d3.forceSimulation(this.filteredData)
                .force('collision', d3.forceCollide().radius(d => _this.SCALE_DOT_RADIUS(d[_this.config.dotRadiusMapping]) + 1.5))
                .force('x', d3.forceX().x(d => _this.CENTER_BY_NUM_SPLITS[_this.config.splits][_this.SCALE_DOT_CHART_INDEX(d.artists[0].id)][0] + _this.dataToXy(d)[0]).strength(0.2))
                .force('y', d3.forceY().y(d => _this.CENTER_BY_NUM_SPLITS[_this.config.splits][_this.SCALE_DOT_CHART_INDEX(d.artists[0].id)][1] + _this.dataToXy(d)[1]).strength(0.2))
                // // .alphaTarget(1)
                .on("tick", function tick(e) {
                    _this.svg.selectAll('g.song')
                    .attr('transform', d => `translate(${d.x}, ${d.y})`);
                });
        } else {            
            this.force.velocityDecay(0.5);
            this.force.nodes(this.filteredData);
            this.force.force('collision').radius(d => _this.SCALE_DOT_RADIUS(d[_this.config.dotRadiusMapping]) + 1.5);
            this.force.force('x').x(d => _this.CENTER_BY_NUM_SPLITS[_this.config.splits][_this.SCALE_DOT_CHART_INDEX(d.artists[0].id)][0] + _this.dataToXy(d)[0]).strength(0.2);
            this.force.force('y').y(d => _this.CENTER_BY_NUM_SPLITS[_this.config.splits][_this.SCALE_DOT_CHART_INDEX(d.artists[0].id)][1] + _this.dataToXy(d)[1]).strength(0.2);
            this.force.alphaTarget(0.7).restart()
        }
    }
    
    drawDataPoints () {
        let _this = this;
        var songG = this.svg.selectAll('g.song').data(this.filteredData, d => d.id);
    
        var songGEnter = songG.enter()
            .append('g')
            .attr('class', 'song');
            
        var songGEnterInner = songGEnter.append('g')
            .attr('class', d => `song-inner rotate-anim rotate-${d.time_signature}`)
            .style('animation-duration', d => `${60 / d.tempo * d.time_signature}s`)
    
        var defs = songGEnterInner.append('svg:defs');
        
        defs.append('svg:pattern')
            .attr('id', d => `image${d.id}`)
            // .attr("width", d => 2 * this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
            // .attr("height", d => 2 * this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
            // .attr("x", d => -this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
            // .attr("y", d => -this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
            .attr("patternUnits", "userSpaceOnUse")
            .append("svg:image")
            .attr("xlink:href", d => d.album.images[2].url)
            // .attr("width", d => 2 * this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
            // .attr("height", d => 2 * this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]));
    
        var polygonPoints = songGEnterInner
            .filter(d => this.TIME_SIG_AS_POLYGON ? d.time_signature > 2 : false)
            .append('polygon')
            .attr('class', 'dot pulse')
    
        var circlePoints = songGEnterInner
            .filter(d => this.TIME_SIG_AS_POLYGON ? d.time_signature <= 2 : true)
            .append('circle')
            .attr('class', 'dot pulse')
            
        songGEnterInner.selectAll('.dot')
            .on("mouseover", this.mouseActions('mouseover'))
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
            .classed('fade', d => !this.highlight(d))

        songG.merge(songGEnter)
            .selectAll('.dot')
            .style('animation-duration', d => `${60 / d.tempo}s`)
            .style('stroke', d => this.SCALE_DOT_COLOR(d.artists[0].id))
            .style('fill', d => this.config.showAlbumArt ? `url(#image${d.id})` : this.SCALE_DOT_COLOR(d.artists[0].id))

        songG.merge(songGEnter)
            .selectAll('polygon.dot.pulse')
            .attr('points', function (d) {
                // draw regular polygons
                var points = [];
                
                var n = d.time_signature;
                
                var theta_offset_radial = SCALE_ANGLE(_this.getKeyFromKeyId(d.key, d.mode));
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
            .selectAll('circle.dot.pulse')
            .attr('r', d => this.SCALE_DOT_RADIUS(d[this.config.dotRadiusMapping]))
    
        songG.exit().remove();
    }
    
    mouseActions (action) {
        let _this = this;
        if (action == 'mouseover') {
            return function (d, i) {
                // if (_this.currentPlayingMusic) {
                //     _this.currentPlayingMusic.stopFadeOut();
                //     d3.selectAll('.dot.pulse').classed('active', false);
                // }
                if (!d.audio) {
                    d.audio = new Audio(d.preview_url);
                    d.audio.loop = true;
                }
                d.audio.playFadeIn();
                
                _this.currentPlayingMusic = d.audio;
                _this.songToolTip.show(d, this);
                _this.grids.forEach(function (g) {
                    g.showGuide(_this.getKeyFromKeyId(d.key, d.mode), d[_this.config.radialMapping]);
                });

                // FIXME compute song similarity
                let n = 5;
                let similarSongs = [];
                for (let i = 0; i < n; i++) {
                    let index = Math.floor(Math.random() * _this.filteredData.length);
                    similarSongs.push(_this.filteredData[index]);
                }
                _this.svg.selectAll('line.similarity-link')
                    .data(similarSongs)
                    .enter()
                    .append('line')
                    .attr('class', 'similarity-link')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 2)
                    .attr('pointer-events', 'none')
                    .attr('opacity', d => Math.random() * 0.7 + 0.3)
                    .attr('x1', s => d.x)
                    .attr('y1', s => d.y)
                    .attr('x2', s => s.x)
                    .attr('y2', s => s.y)

                _this.dispatch.call('highlight', this, k => k.id == d.id || similarSongs.filter(x => x.id == k.id).length > 0);
            }
        } else if (action == 'click') {
            return function (d, i, m) {
                if (!d.audio) {
                    d.audio = new Audio(d.preview_url);
                    d.audio.loop = true;
                }
                console.log(_this)
                if (d.audio.paused)
                    d.audio.playFadeIn();
                _this.currentPlayingMusic = d.audio;
                _this.dispatch.call('highlight', this, k => k.id == d.id);
                // TODO lock selection when clicked
                // _this.selectionLocked = true;
                // m[i].classList.add('active');
            }
        } else if (action == 'mouseout') {
            return function (d, i) {
                if (!_this.selectionLocked) {
                    
                    d.audio.stopFadeOut();

                    _this.songToolTip.hide(d, this);
                    _this.grids.forEach(function (g) {
                        g.hideGuide();
                    });
        
                    _this.dispatch.call('highlight', this, k => true);
                }

                // TODO make it look better
                _this.svg.selectAll('line.similarity-link').remove();
            }
        }
    }

    resetSelection () {
        console.log('!', this, this.currentPlayingMusic);
        if (this.currentPlayingMusic) {
            this.currentPlayingMusic.stopFadeOut();
            d3.selectAll('.dot.pulse').classed('active', false);
            this.songToolTip.hide({}, this);
            this.grid.hideGuide();
            this.dispatch.call('highlight', this, k => true);
        }
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
        let distance = distanceOverride || this.SCALE_RADIAL(d[this.config.radialMapping]);
        return this.angleDistanceToXy(angle, distance);
    }
}