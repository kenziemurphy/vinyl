//var dimensions = ["energy", "danceability", "acousticness", "liveness", "valence", "speechiness", "instrumentalness", "loudness", "tempo", "popularity"]; // Edit this for more histograms
var dimensions = ["popularity", "energy", "danceability", "valence", "acousticness",  "liveness", "instrumentalness", "speechiness"]; // Edit this for more histograms
// var categories = ["tempo", "loudness", "duration","key_signature", "time_signature"];
var categories = [
    {
        key: "artist",
        label: "Artist",
        unit: "",
        needHelpTooltip: false
    },
    {
        key: "album_name",
        label: "Album",
        unit: "",
        needHelpTooltip: false
    },
    {
        key: "release_date",
        label: "Release Date",
        unit: "",
        needHelpTooltip: false
    },
    {
        key: "key_signature_full",
        label: "Key",
        unit: ""
    },
    {
        key: "time_signature",
        label: "Time Signature",
        unit: ""
    },
    {
        key: "loudness",
        label: "Loudness",
        unit: "dB"
    },
    {
        key: "duration",
        label: "Duration",
        unit: "",
        needHelpTooltip: false
    },
    {
        key: "tempo",
        label: "Tempo",
        unit: "BPM"
    },
];

//const starCircleRadius = 50;
//const starRadius = 120;
//const spacing = 100;
//const labelMargin = 20;

var margin = {
    top: 90,
    left: 100,
    right: 100
};
const labelMargin = 5;

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
        // console.log(data);
        // dataArray = [];
        // this.titleUpdate();
        

    }

    onDataChanged (newData) {
        this.data = newData;
        this.radiusCal(window.innerWidth);
        // console.log("starRadius", starRadius);
        // console.log("starCircleRadius", starCircleRadius);
        // console.log("newData", this.data);
        if(this.data == undefined){
            console.log("undefined");
            d3.select('#star-view').selectAll('*').remove();
            dataArray = [];
            SongInStarPlot = false;
        }
        else{
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
        }
        //this.dataArray = [this.data[1], this.data[150]];
        console.log('onDataChanged');
        this.titleUpdate();

        if(dataArray.length >= 1){
            console.log("dataArray", dataArray);    
            SongInStarPlot = true;   
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
        if(dataArray.length == 0){
            document.getElementById("starTitleLabel").innerHTML = "Drag a song here for more details.";
            document.getElementById("starClear").innerHTML = "";
        } 
        else if(dataArray.length >= 1 && dataArray.length < 4){
            document.getElementById("starTitleLabel").innerHTML = dataArray.length + " Song(s) in Comparison: Drag more songs here for more details.";
            document.getElementById("starClear").innerHTML = "Clear All";
        }
            
        else{
            document.getElementById("starTitleLabel").innerHTML = "4 Songs in Comparison";
            document.getElementById("starClear").innerHTML = "Clear All";
        }
            
        
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
        
        this.drawLabel();
        this.drawCircle();
        this.drawStarPath();
        this.drawGuideLines();

        //this.drawCategories();

    }

    preprocess() {
        dataArray.forEach(function(d, i){
            d.popularity = d.popularity / 100;
        })
    }

    drawTitle() {
        var texts = this.svg.selectAll('text')
            .data(dataArray)
            .enter();

        var titleLabel = texts.append('text')
            .attr('class', 'star-title')
            .attr('transform', function(d, i){
                var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                var center_y = 30;
                //console.log(d.name);
                return "translate(" + center_x + "," + center_y + ")";
            })
            .attr('text-anchor', 'middle')
            .text(function(d){
                if(d.name.length > 22)
                    return d.name.substring(0,22) + "...";
                else
                    return d.name;
            });

        var cross = texts.append('text')
            .attr('class', 'star-remove clickable')
            .attr('transform', function(d, i){
                var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 2) + spacing * i + 30;
                var center_y = 30;
                return "translate(" + center_x + "," + center_y + ")";
            })
            .attr('text-anchor', 'end')
            .html('&times;')
            .on('click', function(d, i){
                flag = 0;
                removeIndex = i;
                console.log("remove", i);
                new StarView(d3.select('svg#star-view'), [], dispatch).onDataChanged(d);
            });

        var category_title = texts.append('g')
            .attr('class', 'star-categories')
            .attr('transform', function(d, i){
                var center_x = margin.left + (starCircleRadius + starRadius) *(2*i + 1) + spacing * i;
                var center_y = margin.top + (starCircleRadius + starRadius) * 2 + 70;//40;
                //console.log(d.name);
                return "translate(" + (center_x - 10) + "," + center_y + ")";
            })
            .attr('text-anchor', 'end');

        var category_content = texts.append('g')
            .attr('class', 'star-categories')
            .attr('transform', function(d, i){
                var center_x = margin.left + (starCircleRadius + starRadius) *(2*i + 1) + spacing * i;
                var center_y = margin.top + (starCircleRadius + starRadius) * 2 + 70;//40;
                //console.log(d.name);
                return "translate(" + (center_x + 10) + "," + center_y + ")";
            })
            .attr('text-anchor', 'start');
            

        for (var num = 0; num < categories.length; num++){
            //console.log(num);
            category_title.append('text')
                .attr('transform', `translate(${0}, ${num * 20})`)
                // .attr('x', 0)
                // .attr('dy', 20)
                // .attr('font-weight', 'bold')
                .text(function(d){
                    //console.log(d[categories[num]]);
                    return categories[num].label + ' ';
                })
                .call(function (d, i, m) {
                    if(categories[num].needHelpTooltip !== false)
                        addHelpTooltip(categories[num].key)(d);
                });
            category_content.append('text')
                .attr('transform', `translate(${0}, ${num * 20})`)
                // .attr('x', 0)
                // .attr('dy', 20)
                .text(function(d){
                    //console.log(d[categories[num]]);
                    return Utils.formatByKey(categories[num].key)(d[categories[num].key]) + ' ' + categories[num].unit;
                    return round(d[categories[num].key], 1) + ' ' + categories[num].unit;
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
            .attr("x", -starCircleRadius)
            .attr("y", -starCircleRadius)
            .attr("width", 2 * starCircleRadius)
            .attr("height", 2 * starCircleRadius)
            .attr("patternUnits", "userSpaceOnUse")
            .append("svg:image")
            // .attr("x", 0)
            // .attr("y", 0)
            .attr("width", 2 * starCircleRadius)
            .attr("height", 2 * starCircleRadius)
            .attr("xlink:href", d => d.images[2].url)

        var circles = this.svg.append('g')
            .selectAll("circle")
            .data(dataArray)
            .enter();

        var circlesInner = selectAllOrCreateIfNotExist(circles, 'g.circles-inner-star')
            .attr('transform', function (d, i) {
                var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                var center_y = margin.top + starRadius + starCircleRadius;
                return `translate(${center_x}, ${center_y})`;
            });

        var circle_bg = circlesInner.append('circle')
            .attr('r', 3*starCircleRadius)
            .style('fill', '#111111');


        var circle_image = circlesInner.append("circle")
            // .attr("cx", function(d, i){ 
            //     var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
            //     return center_x; 
            // })
            // .attr("cy", function(d, i){ 
            //     var center_y = margin.top + starRadius + starCircleRadius;
            //     return center_y; 
            // })
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

        var circle_inner = circlesInner.append('circle')
            .attr('r', starCircleRadius / 10)
            .style('fill', '#37364D');


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
        //console.log("play");
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
        for(var num = 0; num < dimensions.length; num ++){
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
                .attr('id', function(d, i){
                    return 'grid_' + i + '_' + num;
                })
                .attr('class', 'star-axis')
                .attr('transform', function(d, i){
                    var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                    var center_y = margin.top + starRadius + starCircleRadius;
                    return 'translate(' + center_x + ',' + center_y + ')';
                })
                // .attr('stroke-opacity', 0.1)
                .attr('x1', x1)
                .attr('x2', x2)
                .attr('y1', y1)
                .attr('y2', y2);
                // .on('mouseover',function(d, i){
                //     console.log("mouseover", d);
                //     // console.log(dimensions[num]);
                //     d3.select(this)
                //         .attr("stroke-opacity", 1);
                //     // d3.select('#grid_' + i + '_' + num)
                //     //     .attr({stroke-opacity: 1});
                //         //.style('stroke-opacity', 1);
                //     //d3.select(this).attr({'stroke-opacity': 1});

                //     // d3.select('.star-label')
                //     // // d3.select('#label_' + i + '_' + num)
                //     //     .attr('fill-opacity', 1)
                //     //     .text(dimensions[num] + ": " + d[dimensions[num]]);


                // })
                // .on('mouseout', function(d, i){
                //     // d3.select(this).attr({
                //     //     stroke-opacity: 0.1;
                //     // })
                //     // d3.select('#grid_' + i + '_' + num)
                //     //     .style('stroke-opacity', 0.1);
                //     d3.select(this)
                //         .attr('stroke-opacity', 0.1);
                // });

                // var interaction = wrapper.selectAll('.interaction')
                //     .style('display', 'none');

                //   svg.selectAll('.star-interaction')
                //     .on('mouseover', function(d) {
                //       svg.selectAll('.star-label')
                //         .style('display', 'none')

                //       interaction
                //         .style('display', 'block')

                //       circle
                //         .attr('cx', d.x)
                //         .attr('cy', d.y)

                //       $interactionLabel = $(interactionLabel.node());
                //       interactionLabel
                //         .text(d.key + ': ' + d.datum[d.key])
                //         .style('left', d.xExtent - ($interactionLabel.width() / 2))
                //         .style('top', d.yExtent - ($interactionLabel.height() / 2))
                //     })
                //     .on('mouseout', function(d) {
                //       interaction
                //         .style('display', 'none')

                //       svg.selectAll('.star-label')
                //         .style('display', 'block')
                //     })

            r += radians;
        }
    }

    // handleMouseOver() {
    //     console.log("mouseover", d);
    //     //d3.select(#)
    // }



    drawLabel() {
        var r = 0;
        var radians = 2 * Math.PI / dimensions.length;

        for(var num = 0; num < dimensions.length; num ++){
            var l, x, y;

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
                    let angle = num / dimensions.length * 360 - 90;
                    if(angle >= 90 && angle <= 270) {
                        angle += 180;
                    }
                    console.log("angle", angle);
                    var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
                    var center_y = margin.top + starRadius + starCircleRadius;
                    // return 'translate(' + (center_x + x) + ',' + (center_y + y) + ')';
                    return 'translate(' + (center_x + x) + ',' + (center_y + y) + ') rotate(' + angle + ')';
                })
                .attr('id', function(d, i){
                    return "label_" + i + "_" + num;
                })
                .attr('fill-opacity', 0.5)
                .text(Utils.formatKeyLabel(dimensions[num]))
                .style('text-anchor', function () {
                    let angle = num / dimensions.length * 360 - 90;
                    return angle >= 90 && angle <= 270 ? 'start' : 'end';
                })
                .style('alignment-baseline', function () {
                    let angle = num / dimensions.length * 360 - 90;
                    return angle >= 90 && angle <= 270 ? 'baseline' : 'hanging';
                })
                // .attr('alignment-baseline', 'baseline')
                //.style('dominant-baseline', 'central')
                .call(addHelpTooltip(dimensions[num]));
            // console.log("something", `text.label.grid-axis-label.${dimensions[num]}#axis-label-${num}`);

            // selectAllOrCreateIfNotExist(this.svg.data(dataArray).enter(), `text.label.grid-axis-label.dimensions[num]#axis-label-${num}`)
            //     .attr('text-anchor', 'middle')
            //     .attr('alignment-baseline', 'baseline')
            //     .attr('dominant-baseline', 'central')
            //     .attr('transform', function(d, i){
            //         var center_x = margin.left + (starCircleRadius + starRadius) * (2*i + 1) + spacing * i;
            //         var center_y = margin.top + starRadius + starCircleRadius;
            //         return 'translate(' + (center_x + x) + ',' + (center_y + y) + ')';
            //     })
            //     .text(dimensions[num])
            //     .call(addHelpTooltip(dimensions[num]));

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

        var stars = this.svg.selectAll('path')
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
