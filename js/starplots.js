//var dimensions = ["energy", "danceability", "acousticness", "liveness", "valence", "speechiness", "instrumentalness", "loudness", "tempo", "popularity"]; // Edit this for more histograms
var dimensions = ["energy", "danceability", "acousticness", "liveness", "valence", "speechiness", "instrumentalness"]; // Edit this for more histograms
const starCircleRadius = 50;
const starRadius = 120;
const spacing = 100;
//const labelMargin = 20;

var margin = {
    top: 80,
    left: 50
};

//var center_x = margin.left + starCircleRadius + starRadius;
//var center_y = margin.top + starCircleRadius + starRadius;

var dataArray = [];

var flag = 1;


class StarView {
    constructor (svg, data = []) {
        // @Shelly
        
        // init here
        d3.select('#star-view').selectAll('*').remove();
        /*d3.select('#star-view').remove();
        this.svg = d3.select('#star-view')
            .append('svg');*/
        this.svg = svg;
        this.data = data;
        console.log('init');

    }

    onDataChanged (newData) {
        this.data = newData;
        
        if (flag)
            dataArray.push(newData);
        else{
            dataArray.pop(newData);
            flag = 1;
        }
        //this.dataArray = [this.data[1], this.data[150]];
        console.log('onDataChanged');

        if(dataArray.length >= 1){
            console.log("dataArray", dataArray);
            this.redraw();
        }

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
        this.drawTitle();
        this.drawGuideLines();
        this.drawStarPath();
        this.drawLabel();

        this.drawCircle();

    }

    drawTitle() {
        var titles = this.svg.append('g')
            .selectAll('text')
            .data(dataArray)
            .enter();

        var titleLabel = titles.append('text')
            .attr('class', 'star-title')
            .attr('transform', function(d, i){
                var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                var center_y = 20;
                //console.log(d.name);
                return "translate(" + center_x + "," + center_y + ")";
            })
            .attr('text-anchor', 'middle')
            .text(d => d.name);

        // FIXME bug: if you pick more than one song and click 'x' to remove the first, the second one will be removed instead
        var cross = titles.append('text')
            .attr('class', 'star-remove')
            .attr('transform', function(d, i){
                var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 2) + spacing * i;
                var center_y = 20;
                return "translate(" + center_x + "," + center_y + ")";
            })
            .attr('text-anchor', 'end')
            .text('x')
            .on('click', function(d, i){
                flag = 0;
                new StarView(d3.select('svg#star-view'), [], dispatch).onDataChanged(d);
            });
    }

    drawCircle() {
        //create circle
        var defs = this.svg.append('defs');
        
        var imgPattern = defs.selectAll('pattern')
            .data(dataArray)
            .enter()
            .append('pattern')
            .attr('id', function(d, i){
                //console.log(d);
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
            .data(dataArray)
            .enter()
            .append("circle")
            .attr("cx", function(d, i){ 
                var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                return center_x; 
            })
            .attr("cy", function(d, i){ 
                var center_y = margin.top + starRadius + starCircleRadius;
                return center_y; 
            })
            .attr("r", starCircleRadius)
            //.style("fill", d => `url(#image${d.id})`)
            //.style('fill', d => 'url(#img_' + d.album.images[2].url )
            .style('fill', function(d, i){
                //console.log(d.album.images[2].url);
                return 'url(#img_' + i;
            })
            .style("stroke", 'white')
            //.on("click", this.playClip('mouseover'))
            .on("mouseover", this.playClip('mouseover'))
                /*for(var num = 0; num <= 360; num ++){
                    d3.select(this)
                    .transition()
                    .duration(2000)
                    .attr('transform', 'rotate(' + num + ')');
                }*/
                
            //})
            .on("mouseout", this.playClip('mouseout'));

    }

    playClip(action) {
        let _this = this;
        console.log("mouseover");
        if (action == 'mouseover') {

            return function (d, i) {
                //console.log("d", d);
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
                .data(dataArray)
                .enter()
                .append('line')
                .attr('class', 'star-axis')
                .attr('transform', function(d, i){
                    var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                    var center_y = margin.top + starRadius + starCircleRadius;
                    return 'translate(' + center_x + ',' + center_y + ')';
                })
                .attr('x1', x1)
                .attr('x2', x2)
                .attr('y1', y1)
                .attr('y2', y2);
                /*.on('mouseoever', function(d){
                    console.log("line mouseover");
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
                .data(dataArray)
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
                    var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                    var center_y = margin.top + starRadius + starCircleRadius;
                    return 'translate(' + (center_x + x) + ',' + (center_y + y) + ') rotate(' + angle + ')';
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
            .data(dataArray)
            .enter()
            .append('path')
            .attr('class', 'star-path')
            .attr('transform', function(d, i){
                var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                var center_y = margin.top + starRadius + starCircleRadius;
                return 'translate(' + center_x + ',' + center_y + ')';
            })
            .attr('d', function(d, i){
                return path(pathCalculate(d)) + 'Z';
            });

    }



    




}
