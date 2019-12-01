//var dimensions = ["energy", "danceability", "acousticness", "liveness", "valence", "speechiness", "instrumentalness", "loudness", "tempo", "popularity"]; // Edit this for more histograms
var dimensions = ["energy", "danceability", "acousticness", "liveness", "valence", "speechiness", "instrumentalness", "popularity"]; // Edit this for more histograms
var categories = ["tempo", "loudness", "duration","key_signature", "time_signature"];
//const starCircleRadius = 50;
//const starRadius = 120;
//const spacing = 100;
//const labelMargin = 20;

var margin = {
    top: 80,
    left: 150,
    right: 150
};
const labelMargin = 20;

//var center_x = margin.left + starCircleRadius + starRadius;
//var center_y = margin.top + starCircleRadius + starRadius;

var dataArray = [];
var starCircleRadius, starRadius, spacing;

var flag = 1;
var removeIndex;


class StarView {
    constructor (svg, data, dispatch) {
        // @Shelly
        
        // init here
        d3.select('#star-view').selectAll('*').remove();
        /*d3.select('#star-view').remove();
        this.svg = d3.select('#star-view')
            .append('svg');*/
        this.svg = svg;
        this.data = data;
        this.dispatch = dispatch;
        console.log('init');
        

    }

    onDataChanged (newData) {
        this.data = newData;
        this.radiusCal(window.innerWidth);
        // console.log("starRadius", starRadius);
        // console.log("starCircleRadius", starCircleRadius);
        
        if (flag){
            if(dataArray.length < 4)
                dataArray.push(newData);
            else
                alert("4 songs is the maximum for comparison");
        }
            
            
        else{
            //dataArray.pop(newData);
            dataArray.splice(removeIndex, 1);
            flag = 1;
        }
        //this.dataArray = [this.data[1], this.data[150]];
        console.log('onDataChanged');
        this.titleUpdate();

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

    titleUpdate (){
        if(dataArray.length == 0)
            document.getElementById("starTitleLabel").innerHTML = "Drag a song here for more details";
        else if(dataArray.length >= 1 && dataArray.length < 4)
            document.getElementById("starTitleLabel").innerHTML = dataArray.length + " Songs in Comparison. Drag more songs here for more details";
        else
            document.getElementById("starTitleLabel").innerHTML = "4 Songs in Comparison";
        
    }

    radiusCal (width){
        //console.log(width);
        starCircleRadius = (width - margin.left - margin.right - 60) / 36;
        starRadius = starCircleRadius * 2;
        spacing = starCircleRadius * 4;

    }

    redraw() {
        this.preprocess();
        //this.initGrid();
        this.drawTitle();
        this.drawGuideLines();
        this.drawStarPath();
        this.drawLabel();
        this.drawCircle();

        //this.drawCategories();

    }

    preprocess() {
        dataArray.forEach(function(d, i){
            d.popularity = d.popularity / 100;
        })
    }

    drawTitle() {
        var texts = this.svg.append('g')
            .selectAll('text')
            .data(dataArray)
            .enter();

        var titleLabel = texts.append('text')
            .attr('class', 'star-title')
            .attr('transform', function(d, i){
                var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                var center_y = 20;
                //console.log(d.name);
                return "translate(" + center_x + "," + center_y + ")";
            })
            .attr('text-anchor', 'middle')
            .text(function(d){
                if(d.name.length > 25)
                    return d.name.substring(0,25) + "...";
                else
                    return d.name;
            });

        var cross = texts.append('text')
            .attr('class', 'star-remove')
            .attr('transform', function(d, i){
                var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 2) + spacing * i + 30;
                var center_y = 20;
                return "translate(" + center_x + "," + center_y + ")";
            })
            .attr('text-anchor', 'end')
            .text('x')
            .on('click', function(d, i){
                flag = 0;
                removeIndex = i;
                console.log("remove", i);
                new StarView(d3.select('svg#star-view'), [], dispatch).onDataChanged(d);
            });

        var category = texts.append('text')
            .attr('class', 'star-categories')
            .attr('transform', function(d, i){
                var center_x = margin.left + (starCircleRadius + starRadius) *(2*i + 1) + spacing * i;
                var center_y = margin.top + (starCircleRadius + starRadius) * 2 + 30;
                //console.log(d.name);
                return "translate(" + center_x + "," + center_y + ")";
            })
            .attr('text-anchor', 'middle');

        for (var num = 0; num < categories.length; num++){
            //console.log(num);
            category.append('svg:tspan')
                .attr('x', 0)
                .attr('dy', 20)
                .text(function(d){
                    //console.log(d[categories[num]]);
                    return categories[num] + ': ' + d[categories[num]];
                });
        }
            
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
            .attr("xlink:href", d => d.images[2].url)

        var circles = this.svg.append("g")
            .selectAll("circle")
            .data(dataArray)
            .enter();

        var circle_image = circles.append("circle")
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

        for(var num = 0; num < 5; num ++){
            circles.append("circle")
                .attr('class', 'star-grid')
                .attr("cx", function(d, i){ 
                    var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                    return center_x; 
                })
                .attr("cy", function(d, i){ 
                    var center_y = margin.top + starRadius + starCircleRadius;
                    return center_y; 
                })
                .attr("r", 7/5*starCircleRadius + 2*num*starCircleRadius/5);
        }

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
            // l = starCircleRadius + starRadius + 20;
            // x = l * Math.cos(r);
            // y = l * Math.sin(r);

            // var texts = this.svg.append('g')
            //     .selectAll('text')
            //     .data(dataArray)
            //     .enter()
            //     .append('text')
            //     .attr('class', 'star-label')
            //     /*.attr('transform', function(d, i){
            //         return 'translate(' + center_x + ',' + (2*i+1) * center_y + ')';
            //     })*/
            //     .attr('transform', function(d, i){
            //         let angle = num / dimensions.length * 360 - 90;
            //         let selfAngle = angle + 90;
            //         if(selfAngle > 90 && selfAngle < 270){
            //             selfAngle += 180;
            //         }
            //         if(angle > 90 && angle < 270) {
            //             angle += 180;
            //         }
            //         //console.log("angle", selfAngle);
            //         var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
            //         var center_y = margin.top + starRadius + starCircleRadius;
            //         return 'translate(' + (center_x + x) + ',' + (center_y + y) + ') rotate(' + angle + ')';
            //     })
            //     .text(dimensions[num]);

            l = starCircleRadius + starRadius;
            x = (l + labelMargin) * Math.cos(r);
            y = (l + labelMargin) * Math.sin(r);

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
                    // let angle = num / dimensions.length * 360 - 90;
                    /*let selfAngle = angle + 90;
                    if(selfAngle > 90 && selfAngle < 270){
                        selfAngle += 180;
                    }*/
                    // if(angle > 90 && angle < 270) {
                    //     angle += 180;
                    // }
                    //console.log("angle", selfAngle);
                    var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                    var center_y = margin.top + starRadius + starCircleRadius;
                    return 'translate(' + (center_x + x) + ',' + (center_y + y) + ')';
                })
                .text(dimensions[num])
                .style('text-anchor', 'middle')
                .style('dominant-baseline', 'central');

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
