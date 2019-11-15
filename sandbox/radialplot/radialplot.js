// config
const TIME_SIG_AS_POLYGON = true;
const ENABLE_FORCE = true;
const NUM_RADIAL_GRID_LINES = 5;

// defaults
var RADIAL_MAPPING = 'tempo';
var DOT_RADIUS_MAPPING = 'popularity';
var SCALE_RADIAL_TYPE = 'linear';

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

// screen-dependent computed consts, will update when screen size is changed for responsive vis
var W, H;
var MIN_RADIAL_DIST;
var MAX_RADIAL_DIST;

function recomputeScreenConsts() {
    H = parseInt(svg.style("height"), 10);
    W = parseInt(svg.style("width"), 10);
    
    MIN_RADIAL_DIST = 120;
    MAX_RADIAL_DIST = Math.min(W, H) / 2 - 100;
}

// data-dependent computed consts, will update when data is loaded
var SCALE_RADIAL = x => x;
var SCALE_DOT_RADIUS = x => x;
var SCALE_DOT_COLOR = x => x;


function scaleSelector(type) {
    if (type == 'linear')
        return d3.scaleLinear()
    if (type == 'log')
        return d3.scaleLog()
}

function recomputeDataConsts () {
    SCALE_RADIAL = scaleSelector(SCALE_RADIAL_TYPE)
        // .domain([0, d3.max(data, d => d[RADIAL_MAPPING])])
        // .domain([0, 1])
        .domain(d3.extent(data, d => d[RADIAL_MAPPING]))
        .range([MIN_RADIAL_DIST, MAX_RADIAL_DIST]);

    console.log(d3.extent(data, d => d[DOT_RADIUS_MAPPING]));

    // TODO: how to make billboard data look good? dynamic sizing?
    SCALE_DOT_RADIUS = d3.scalePow()
        .exponent(0.5)
        .domain(d3.extent(data, d => d[DOT_RADIUS_MAPPING]))
        // .domain([0, 100])
        // .range([2, Math.sqrt(targetAreaUse / sumArea)]);
        .range([2, 20]);

    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }
    SCALE_DOT_COLOR = d3.scaleOrdinal(d3.schemePaired)
        .domain(data.map(x => x.album.name).filter(onlyUnique));
}



// core global stuffs
var data = [];
var svg;
var fileReady = false;
var songToolTip;

initialize();

window.addEventListener("resize", function () {
    initialize();
    
    if (fileReady) {
        d3.selectAll("svg > *").remove();
        draw(data);
    }
});

d3.json('temp.json').then(function (data) {
    console.log(data)
    console.log(data.items.map(d=>d.uri.replace('spotify:track:', '')).join(','));
});
Promise.all([
    // d3.json('../../data/Spotify.json'),
    // d3.json('../../data/Spotify_trackinfo.json'),
    // d3.json('slotmachine.json'),
    // d3.json('slotmachine_trackinfo.json'),
    d3.json('radiohead.json'),
    d3.json('radiohead_trackinfo.json'),
]).then(function (loadedData) {
    data = preprocessData(loadedData); 
    fileReady = true;
    console.log(data);

    recomputeDataConsts();
    
    draw(data);
});



function initialize () {
    svg = d3.select('.vis svg');

    svg.style("height", window.innerHeight);
    svg.style("width", window.innerWidth);

    recomputeScreenConsts();
    if (fileReady) {
        recomputeDataConsts();
    }
}

function draw (data) {
    drawGrid();
    drawDataPoints();

    if (ENABLE_FORCE) {
        initForce();
    }

    songToolTip = d3.tip()
        .attr("class", "d3-tip song-tooltip")
        .offset([-5, 0])
        .direction('n')
        .html(function(d) {
            console.log(d);
            return `
                <p>
                    <b>${d.name}</b>
                    <br>${d.artists ? d.artists.map(a => a.name) : 'Unknown Artist'}
                </p>
            `;
        });
    svg.call(songToolTip);
}




function initForce () {
    var force = d3.forceSimulation(data)
        .force('collision', d3.forceCollide().radius(d => SCALE_DOT_RADIUS(d[DOT_RADIUS_MAPPING]) + 1.5))
        .force('x', d3.forceX(d => W / 2 + angleDistanceToXy(SCALE_ANGLE(getKeyFromKeyId(d.key, d.mode)), SCALE_RADIAL(d[RADIAL_MAPPING]))[0]).strength(0.2))
        .force('y', d3.forceY(d => H / 2 + angleDistanceToXy(SCALE_ANGLE(getKeyFromKeyId(d.key, d.mode)), SCALE_RADIAL(d[RADIAL_MAPPING]))[1]).strength(0.2))
        // .force('center', d3.forceCenter().x(W / 2).y(H / 2))
        .on("tick", function tick(e) {
            svg.selectAll('g.song')
                .attr('transform', d => `translate(${d.x}, ${d.y})`);
        });
}




function preprocessData (files) {
    // outer join
    // var filesConcat = files[0].concat(files[1].tracks);
    // var data = d3.nest()
    //     .key(d => d.uri)
    //     .entries(filesConcat);
    // data = data.map(function (d) {
    //     return {...d.values[0], ...d.values[1]};
    // })
    // return data;

    // inner join
    var data = arrayJoin(files[0], files[1].tracks, 'uri');
    data.forEach(function (d) {
        d.x = W / 2;
        d.y = H / 2;
    });
    return data;

}

function drawGrid () {
    var minRadialData = SCALE_RADIAL.domain()[0];
    var maxRadialData = SCALE_RADIAL.domain()[1]; 
    var radialGridGap = (maxRadialData - minRadialData) / NUM_RADIAL_GRID_LINES;
    var radialGridInterval = d3.range(minRadialData, maxRadialData, radialGridGap);
    var angularGridInterval = d3.range(0, NUM_KEYS, 1);

    radialGridInterval.push(maxRadialData);

    var gridG = svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(${W / 2}, ${H / 2})`);

    var radialGrid = gridG.selectAll('circle.grid-line')
        .data(radialGridInterval)
        .enter()
        .append('circle')
        .attr('class', 'grid-line')
        .attr('r', d => SCALE_RADIAL(d))
        .attr('fill-opacity', '0')
        .attr('stroke-opacity', '0.2')
        .attr('stroke', '#ffffff')

    var angleGrid = gridG.selectAll('line.grid-line')
        .data(ALL_KEYS)
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', d => angleDistanceToXy(SCALE_ANGLE(d), MIN_RADIAL_DIST)[0])
        .attr('y1', d => angleDistanceToXy(SCALE_ANGLE(d), MIN_RADIAL_DIST)[1])
        .attr('x2', d => angleDistanceToXy(SCALE_ANGLE(d), MAX_RADIAL_DIST)[0])
        .attr('y2', d => angleDistanceToXy(SCALE_ANGLE(d), MAX_RADIAL_DIST)[1])

    // guides only show up when an item is hovers to help deal with offset position from force-directed chart
    var radialGuide = gridG.append('circle')
        .attr('class', 'guide-line radial hidden')
        .attr('r', SCALE_RADIAL(minRadialData))
        .attr('fill-opacity', '0')

    var angleGuide = gridG.append('line')
        .attr('class', 'guide-line angle hidden')
        .attr('x1', angleDistanceToXy(SCALE_ANGLE('C'), MIN_RADIAL_DIST)[0])
        .attr('y1', angleDistanceToXy(SCALE_ANGLE('C'), MIN_RADIAL_DIST)[1])
        .attr('x2', angleDistanceToXy(SCALE_ANGLE('C'), MAX_RADIAL_DIST)[0])
        .attr('y2', angleDistanceToXy(SCALE_ANGLE('C'), MAX_RADIAL_DIST)[1])

    var angleLabel = gridG.selectAll('text.label.label-angle')
        .data(ALL_KEYS)
        .enter()
        .append('text')
        .attr('class', 'label label-angle')
        .text(d => d)
        .attr('x', d => angleDistanceToXy(SCALE_ANGLE(d), MAX_RADIAL_DIST + 20)[0])
        .attr('y', d => angleDistanceToXy(SCALE_ANGLE(d), MAX_RADIAL_DIST + 20)[1])
        .attr('fill', '#ffffff')

    var radialLabelTop = gridG.selectAll('text.label.label-radial.top')
        .data(radialGridInterval)
        .enter()
        .append('text')
        .attr('class', 'label label-radial top')
        .text(d => round(d, 1))
        .attr('y', d => -SCALE_RADIAL(d))
        .attr('fill', '#ffffff')

    var radialTextLabelInnerTop = gridG.append('text')
        .attr('class', 'label label-axis-radial')
        .text(RADIAL_MAPPING.toUpperCase())
        .attr('y', -MIN_RADIAL_DIST + 30)
        .attr('font-weight', 'bold')
        .style('opacity', 0.7)
        .attr('fill', '#ffffff')

    var radialTextLabelOuterTop = gridG.append('text')
        .attr('class', 'label label-axis-radial')
        .text(RADIAL_MAPPING.toUpperCase())
        .attr('y', -MAX_RADIAL_DIST - 30)
        .attr('font-weight', 'bold')
        .style('opacity', 0.7)
        .attr('fill', '#ffffff')

    var radialLabelBottom = gridG.selectAll('text.tempo.label.bottom')
        .data(radialGridInterval)
        .enter()
        .append('text')
        .attr('class', 'label label-radial bottom')
        .text(d => round(d, 1))
        .attr('y', d => SCALE_RADIAL(d))
        .attr('fill', '#ffffff')

    var radialTextLabelInnerBottom = gridG.append('text')
        .attr('class', 'label label-axis-radial')
        .text(RADIAL_MAPPING.toUpperCase())
        .attr('y', MIN_RADIAL_DIST - 30)
        .attr('font-weight', 'bold')
        .style('opacity', 0.7)
        .attr('fill', '#ffffff')

    var radialTextLabelOuterBottom = gridG.append('text')
        .attr('class', 'label label-axis-radial')
        .text(RADIAL_MAPPING.toUpperCase())
        .attr('y', MAX_RADIAL_DIST + 30)
        .attr('font-weight', 'bold')
        .style('opacity', 0.7)
        .attr('fill', '#ffffff')

    // major/minor line
    // FIXME hardcoding
    var majorMinorLabelOffset = 60;
    var majorMinorLineLeft = gridG.append('line')
        .attr('class', 'grid-line-clear')
        .attr('x1', -MIN_RADIAL_DIST)
        .attr('y1', 0)
        .attr('x2', -MAX_RADIAL_DIST - majorMinorLabelOffset)
        .attr('y2', 0)

    var majorMinorLinRight = gridG.append('line')
        .attr('class', 'grid-line-clear')
        .attr('x1', MIN_RADIAL_DIST)
        .attr('y1', 0)
        .attr('x2', MAX_RADIAL_DIST + majorMinorLabelOffset)
        .attr('y2', 0)

    var majorLabelLeft = gridG.append('text')
        .text('MAJOR')
        .attr('fill', '#ffffff')
        .attr('x', -MAX_RADIAL_DIST - majorMinorLabelOffset)
        .attr('y', -7)
        .attr('aligment-baseline', 'baseline')
        .attr('text-anchor', 'start')
    
    var minorLabelLeft = gridG.append('text')
        .text('MINOR')
        .attr('fill', '#ffffff')
        .attr('x', -MAX_RADIAL_DIST - majorMinorLabelOffset)
        .attr('y', 7)
        .attr('alignment-baseline', 'hanging')
        .attr('text-anchor', 'start')
    
    var majorLabelRight = gridG.append('text')
        .text('MAJOR')
        .attr('fill', '#ffffff')
        .attr('x', MAX_RADIAL_DIST + majorMinorLabelOffset)
        .attr('y', -7)
        .attr('aligment-baseline', 'baseline')
        .attr('text-anchor', 'end')
    
    var minorLabelRight = gridG.append('text')
        .text('MINOR')
        .attr('fill', '#ffffff')
        .attr('x', MAX_RADIAL_DIST + majorMinorLabelOffset)
        .attr('y', 7)
        .attr('alignment-baseline', 'hanging')
        .attr('text-anchor', 'end')
}

function updateGrid () {
    var minRadialData = SCALE_RADIAL.domain()[0];
    var maxRadialData = SCALE_RADIAL.domain()[1]; 
    var radialGridGap = (maxRadialData - minRadialData) / NUM_RADIAL_GRID_LINES;
    var radialGridInterval = d3.range(minRadialData, maxRadialData, radialGridGap);
    var angularGridInterval = d3.range(0, NUM_KEYS, 1);

    radialGridInterval.push(maxRadialData);

    var gridG = svg.select('g.grid')
        
    var radialGrid = gridG.selectAll('circle.grid-line').data(radialGridInterval)

    var radialGridEnter = radialGrid.enter()
        .append('circle')
        .attr('class', 'grid-line')
    
    radialGrid.merge(radialGridEnter)
        .transition()
        .attr('r', d => SCALE_RADIAL(d))
        .attr('fill-opacity', '0')
        .attr('stroke-opacity', '0.2')
        .attr('stroke', '#ffffff')
    
    radialGrid.exit().remove();

    // var angleGrid = gridG.selectAll('line.grid-line')
    //     .data(ALL_KEYS)
    //     .enter()
    //     .append('line')
    //     .attr('class', 'grid-line')
    //     .attr('x1', d => angleDistanceToXy(SCALE_ANGLE(d), MIN_RADIAL_DIST)[0])
    //     .attr('y1', d => angleDistanceToXy(SCALE_ANGLE(d), MIN_RADIAL_DIST)[1])
    //     .attr('x2', d => angleDistanceToXy(SCALE_ANGLE(d), MAX_RADIAL_DIST)[0])
    //     .attr('y2', d => angleDistanceToXy(SCALE_ANGLE(d), MAX_RADIAL_DIST)[1])

    // var angleLabel = gridG.selectAll('text.label.label-angle')
    //     .data(ALL_KEYS)
    //     .enter()
    //     .append('text')
    //     .attr('class', 'label label-angle')
    //     .text(d => d)
    //     .attr('x', d => angleDistanceToXy(SCALE_ANGLE(d), MAX_RADIAL_DIST + 20)[0])
    //     .attr('y', d => angleDistanceToXy(SCALE_ANGLE(d), MAX_RADIAL_DIST + 20)[1])
    //     .attr('fill', '#ffffff')

    var radialLabelTop = gridG.selectAll('text.label.label-radial')
        .data(radialGridInterval)

    var radialLabelTopEnter = radialLabelTop
        .enter()
        .append('text')
        .attr('class', 'label label-radial top')
    
    radialLabelTop.merge(radialLabelTopEnter)
        .transition()
        .text(d => round(d, 1))
        .attr('y', d => -SCALE_RADIAL(d))
        .attr('fill', '#ffffff')
    
    radialLabelTop.exit().remove();

    var radialTextLabel = gridG.selectAll('text.label-axis-radial')
        .text(RADIAL_MAPPING.toUpperCase())
}

function drawDataPoints () {
    var songG = svg.selectAll('g.song').data(data)

    var songGEnter = songG.enter()
        .append('g')
        .attr('class', 'song');
        
    var songGEnterInner = songGEnter.append('g')
        .attr('class', d => `song-inner rotate-anim rotate-${d.time_signature}`)
        .style('animation-duration', d => `${60 / d.tempo * d.time_signature}s`)

    var defs = songGEnterInner.append('svg:defs');
    
    defs.append('svg:pattern')
        .attr('id', d => `image${d.id}`)
        .attr("width", d => 2 * SCALE_DOT_RADIUS(d[DOT_RADIUS_MAPPING]))
        .attr("height", d => 2 * SCALE_DOT_RADIUS(d[DOT_RADIUS_MAPPING]))
        .attr("x", d => -SCALE_DOT_RADIUS(d[DOT_RADIUS_MAPPING]))
        .attr("y", d => -SCALE_DOT_RADIUS(d[DOT_RADIUS_MAPPING]))
        .attr("patternUnits", "userSpaceOnUse")
        .append("svg:image")
        .attr("xlink:href", d => d.album.images[2].url)
        // .attr("xlink:href", 'https://upload.wikimedia.org/wikipedia/en/8/8b/Radiohead.bends.albumart.jpg')
        .attr("width", d => 2 * SCALE_DOT_RADIUS(d[DOT_RADIUS_MAPPING]))
        .attr("height", d => 2 * SCALE_DOT_RADIUS(d[DOT_RADIUS_MAPPING]));

    var polygonPoints = songGEnterInner
        .filter(d => TIME_SIG_AS_POLYGON ? d.time_signature > 2 : false)
        .append('polygon')
        .attr('class', 'dot pulse')
        .attr('points', function (d) {
            // draw regular polygons
            var points = [];
            
            var n = d.time_signature;
            
            var theta_offset_radial = SCALE_ANGLE(getKeyFromKeyId(d.key, d.mode));
            var theta_offset = 2 * Math.PI / d.time_signature / 2 + Math.PI + theta_offset_radial;
            
            var size = SCALE_DOT_RADIUS(d[DOT_RADIUS_MAPPING]);
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
        .attr('r', d => SCALE_DOT_RADIUS(d[DOT_RADIUS_MAPPING]))
        
    songGEnterInner.selectAll('.dot')
        .style('animation-duration', d => `${60 / d.tempo}s`)
        // .style('stroke-width', 2.5)
        // .style('stroke', d => SCALE_DOT_COLOR(d.artists[0].id))
        // .style('stroke-opacity', 1)
        .style('fill', '#fff')
        .style('fill', d => `url(#image${d.id})`)
        .style('fill-opacity', 1)
        .on("mouseover", function (d, i) {
            d.audio = new Audio(d.preview_url);
            d.audio.loop = true;
            // d.audio.volume = 0;
            d.audio.play();
            // FIXME fadeTo is still buggy.
            // d.audio.fadeTo(1);
            songToolTip.show(d, this);

            // highlight on grid
            d3.select('.guide-line.radial')
                .classed('hidden', false)
                .attr('r', SCALE_RADIAL(d[RADIAL_MAPPING]))
            d3.select('.guide-line.angle')
                .classed('hidden', false)
                .attr('x1', angleDistanceToXy(SCALE_ANGLE(getKeyFromKeyId(d.key, d.mode)), MIN_RADIAL_DIST)[0])
                .attr('y1', angleDistanceToXy(SCALE_ANGLE(getKeyFromKeyId(d.key, d.mode)), MIN_RADIAL_DIST)[1])
                .attr('x2', angleDistanceToXy(SCALE_ANGLE(getKeyFromKeyId(d.key, d.mode)), MAX_RADIAL_DIST)[0])
                .attr('y2', angleDistanceToXy(SCALE_ANGLE(getKeyFromKeyId(d.key, d.mode)), MAX_RADIAL_DIST)[1])
            d3.selectAll('.label-angle')
                .filter(k => k == getKeyFromKeyId(d.key, d.mode))
                .classed('highlight', true)
            d3.selectAll('.song')
                .filter(k => k.id != d.id)
                .classed('fade', true)
        })
        .on("click", function (d, i) {
            console.log(d.audio)
            if (!d.audio) {
                d.audio = new Audio(d.preview_url);
                d.audio.loop = true;
            }
            // d.audio.volume = 0;
            d.audio.play();
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
            songToolTip.hide(d, this);

            d3.selectAll('.guide-line')
                .classed('hidden', true)
                .transition()
            d3.selectAll('.label-angle')
                .classed('highlight', false)
            d3.selectAll('.song')
                .classed('fade', false)
        })


    // var songLabels = songG
    //     .append('text')
    //     .text(d => ``)
    //     .attr('class', 'song-label')
    //     .attr('x', 0)
    //     .attr('y', -30)
    //     .attr('fill', d => '#ffffff')

    songG.merge(songGEnter)
        .transition()
        .attr('transform', function (d) {
            let coord = angleDistanceToXy(SCALE_ANGLE(getKeyFromKeyId(d.key, d.mode)), SCALE_RADIAL(d[RADIAL_MAPPING]));
            let x = W / 2 + coord[0];
            let y = H / 2 + coord[1];
            return `translate(${x}, ${y})`
        });

    songG.exit().remove();
}



// helpers

function angleDistanceToXy (angle, distance) {
    return [
        Math.cos(angle) * distance,
        Math.sin(angle) * distance
    ]
}

function getKeyFromKeyId (key, mode = false) {
    if (mode === false) {
        mode = Math.ceil(key / 12);
        key = key % 12;
    }

    return ALL_KEYS[key + mode * 12];
    // return ALL_KEYS[key * 2 + mode];
}

function arrayJoin (a, b, key) {
    var bKeys = b.map(y => y[key]);
    var abJoined = a.map(function (x) {
        var bIndex = bKeys.indexOf(x[key])
        if (bIndex >= 0) {
            // console.log(x[key], b[bIndex].name);
            return {...x, ...b[bIndex]};
        } else {
            return false;
        }
    });
    
    return abJoined.filter(x => x !== false);
}

function round(value, decimals) {
   return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

d3.selectAll('button.radial-mapping-select')
    .on('click', function () {
        RADIAL_MAPPING = this.getAttribute('data-attr');
        SCALE_RADIAL_TYPE = this.getAttribute('data-scale-type')
        console.log(RADIAL_MAPPING)
        recomputeDataConsts();
        updateGrid();
        drawDataPoints();
        if (ENABLE_FORCE) {
            initForce();
        }
    });