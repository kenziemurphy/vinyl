//var dimensions = ["energy", "danceability", "acousticness", "liveness", "valence", "speechiness", "instrumentalness", "loudness", "tempo", "popularity"]; // Edit this for more histograms
var dimensions = ["energy", "danceability", "acousticness", "liveness", "valence", "speechiness", "instrumentalness"]; // Edit this for more histograms
const starCircleRadius = 50;
const starRadius = 150;
const spacing = 30;
//const labelMargin = 20;

var margin = {
    top: 20,
    left: 50
};

var center_x = margin.left + starCircleRadius + starRadius;
var center_y = margin.top + starCircleRadius + starRadius;


class StarView {
    constructor (svg, data = []) {
        // @Shelly
        
        // init here
        this.svg = svg;
        this.data = data;


        //this.redraw(data[1]);

        /*Promise.all([
            // d3.json('../../data/Spotify.json'),
            // d3.json('../../data/Spotify_trackinfo.json'),
            //d3.json('data/slotmachine.json'),
            //d3.json('data/slotmachine_trackinfo.json'),
            d3.json('data/radiohead.json'),
            d3.json('data/radiohead_trackinfo.json'),
        ]).then(function (loadedData) {
            data = preprocessData(loadedData);    
            
        });

        this.redraw(data[1]);*/     

    }

    onDataChanged (newData) {
        this.data = newData;
        this.dataArray = [this.data[1], this.data[150]];
        console.log('onDataChanged');
        this.redraw();

    }

    onScreenSizeChanged () {
        console.log('onScreenSizeChanged');
    }

    onFilter (filterFunction) {
        this.filter = filterFunction;
        this.filteredData = this.data.filter(filterFunction);
        console.log('onFilter');
    }

    onHighlight(filterFunction) {
        this.highlight = filterFunction;
        console.log('onHighlight');
    }

    redraw() {
        
        this.drawGuideLines();
        this.drawStarPath();
        this.drawLabel();

        this.drawCircle();


        console.log("eng");

    }

    drawCircle() {
        //create circle
        var defs = this.svg.append('defs');
        
        var imgPattern = defs.selectAll('pattern')
            .data(this.dataArray)
            .enter()
            .append('pattern')
            .attr('id', function(d, i){
                console.log(d);
                return "img_" + i;
            })
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", starCircleRadius)
            .attr("height", starCircleRadius)
            .attr("patternUnits", "userSpaceOnUse")
            .append("svg:image")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", starCircleRadius)
            .attr("height", starCircleRadius)
            .attr("xlink:href", d => d.album.images[2].url)


        var circles = this.svg.append("g")
            .selectAll("circle")
            .data(this.dataArray)
            .enter()
            .append("circle")
            .attr("cx", center_x)
            .attr("cy", function(d, i){ return (2*i+1) * center_y + spacing; })
            .attr("r", starCircleRadius)
            //.style("fill", d => `url(#image${d.id})`)
            //.style('fill', d => 'url(#img_' + d.album.images[2].url )
            .style('fill', function(d, i){
                //console.log(d.album.images[2].url);
                return 'url(#img_' + i;
            })
            .style("stroke", 'white');
            //.on("mouseoever", this.playClip('mouseover'))
            //.on("mouseout", this.playClip('mouseout'));

    }

    playClip(action) {
        let _this = this;
        console.log("mouseover");
        if (action == 'mouseover') {
            
            return function (d, i) {
                console.log("d", d);
                if (!d.audio) {

                    d.audio = new Audio(d.preview_url);
                    d.audio.loop = true;
                }
                d.audio.playFadeIn();
            }

        }else if (action == 'mouseout') {
            return function (d, i) {
                if (!_this.selectionLocked) {
                    
                    d.audio.stopFadeOut();
            }
        }}

    }

    drawGuideLines() {
        var r = 0;
        var radians = 2 * Math.PI / dimensions.length;

        //dimensions.forEach(function(d, i){
        for(var i = 0; i < dimensions.length; i ++){
            var x1, x2, y1, y2;
            x1 = starCircleRadius * Math.cos(r);
            x2 = (starRadius + starCircleRadius) * Math.cos(r);
            y1 = starCircleRadius * Math.sin(r);
            y2 = (starRadius + starCircleRadius) * Math.sin(r);

            var lines = this.svg.append('g')
                .selectAll('line')
                .data(this.dataArray)
                .enter()
                .append('line')
                .attr('class', 'star-axis')
                .attr('transform', function(d, i){
                    return 'translate(' + center_x + ',' + ((2*i+1) * center_y + spacing) + ')';
                })
                .attr('x1', x1)
                .attr('x2', x2)
                .attr('y1', y1)
                .attr('y2', y2);
                /*.on('mouseoever', function(d){
                    this.svg.
                });*/

            r += radians;
        }
    }

    drawLabel() {
        var r = 0;
        var radians = 2 * Math.PI / dimensions.length;

        for(var num =0; num < dimensions.length; num ++){
            var l, x, y;
            l = starCircleRadius + starRadius;
            x = l * Math.cos(r);
            y = l * Math.sin(r);

            var texts = this.svg.append('g')
                .selectAll('text')
                .data(this.dataArray)
                .enter()
                .append('text')
                .attr('class', 'star-label')
                /*.attr('transform', function(d, i){
                    return 'translate(' + center_x + ',' + (2*i+1) * center_y + ')';
                })*/
                .attr('transform', function(d, i){
                    let angle = num / dimensions.length * 360 - 90;
                    /*let selfAngle = angle + 90;
                    if(selfAngle > 90 && selfAngle < 270){
                        selfAngle += 180;
                    }*/
                    if(angle > 90 && angle < 270) {
                        angle += 180;
                    }
                    //console.log("angle", selfAngle);
                    return 'translate(' + (center_x + x) + ',' + ((2*i+1) * center_y + y + spacing) + ') rotate(' + angle + ')';
                })
                .text(dimensions[num]);
            r += radians;
        }
        
    }

    drawStarPath() {
        var scale = d3.scaleLinear()
            .domain([0,1])
            .range([0, starRadius]);


        var pathData = [];
        var r = Math.PI / 2;
        var radians = 2 * Math.PI / dimensions.length;

        var path = d3.lineRadial()
            .angle(function(d) { return d[1]; })
            .radius(function(d) { return d[0]; });

        function pathCalculate(data){
            pathData = [];
            for(var num = 0; num < dimensions.length; num ++){
                //console.log("scale" + scale(data[dimensions[num]]));
                pathData.push([scale(data[dimensions[num]]) + starCircleRadius, r]);
                r += radians;
            }
            return pathData;
        }

        var stars = this.svg.append('g')
            .selectAll('path')
            .data(this.dataArray)
            .enter()
            .append('path')
            .attr('class', 'star-path')
            .attr('transform', function(d, i){
                return 'translate(' + center_x + ',' + ((2*i+1) * center_y + spacing) + ')';
            })
            .attr('d', function(d, i){
                return path(pathCalculate(d)) + 'Z';
            });

    }




}
