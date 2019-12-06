class HistogramView {
    constructor (svg, data, dispatch) {

        // init here
        this.svg = svg;
        this.data = data;
        this.dispatch = dispatch;
        this.brushHist;

        //var svg = d3.select('svg');
        // NOTE: I fixed this svgWidth/Height, it should work now -- Tae
        this.svgWidth = parseInt(this.svg.style("width"), 10);
        this.svgHeight = parseInt(this.svg.style("height"), 10);



        // sets colors for the histogram rectangles
        this.colors = ['#FCA981','#6988F2','#F36293', '#81D0EF'];
        this.dimensions = ["energy", "danceability", "tempo", "loudness", "acousticness", "liveness", "valence", "speechiness", "instrumentalness", "release_year"]; // Edit this for more histograms

        this.histWidth = parseInt(this.svgWidth);
        this.histHeight = parseInt((this.svgHeight) / this.dimensions.length);
        this.paddingLeft = 20;

        this.HistTop = 0;
        this.HistBottom = this.histHeight - 30;

        this.x = d3.scaleLinear()
          .domain([0, 1])
          .range([52, 285]);

        let _this = this;

        this.brush = d3.brush()
            .extent(function() {
                return [[20, _this.HistTop], [_this.histWidth, _this.HistBottom]];
            })
            // .extent([[20, _this.HistTop], [_this.histWidth, _this.HistBottom]])
            .on("start",  function (histogram) {

                // Check if this g element is different than the previous brush
                if(_this.brushHist !== this) {


                // Clear the old brush
                 _this.brush.move(d3.select(_this.brushHist), null);

                // Update the global scales for the subsequent brushmove events
                // _this.x.domain(extentByAttribute[cell.x]);
                // _this.y.domain(extentByAttribute[cell.y]);

                // Save the state of this g element as having an active brush
                _this.brushHist = this;
            }
            })
            .on("brush", function (histogram) {
                        // Get the extent or bounding box of the brush event, this is a 2x2 array
                var e = d3.event.selection;

                if(e) {

                    // Select all .dot circles, and add the "hidden" class if the data for that circle
                    // lies outside of the brush-filter applied for this SplomCells x and y attributes
                    d3.selectAll('.bin-rect')
                     .classed("faded", function(d){
                        // console.log(d);
                        // return e[0][0] > _this.x(d[bin]) || _this.x(d[bin]) > e[1][0]
                        // || e[0][1] > _this.y(d[bin]) || _this.y(d[bin]) > e[1][1];
                        return true;
                    })
                    // .classed('fade', function(d) {

                    //     /* we gave each artist g an id in drawHistogram, use this to determine what artist this rectangle belongs to
                    //         and therefore what key to look at in d.data (i.e. ids0 or ids1 or ids2 etc) to find the songs in this bin */
                    //     let artistIndex = this.parentNode.id.slice(-1);

                    //     // get the Spotify id of the collection (artist)
                    //     let collectionId = _this.data[artistIndex].id;

                    //     // get a list of the id's in this bin
                    //     let idsInBin = d.data["ids" + artistIndex]; //_this.getAllIdsInBin(d);

                    //       The filtering function typically has format (d) => d.id == s.id where s.id is the magical song id we want to highlight.
                    //         Or (d) => d.collection_id == s.id where s.id is the id of a collection we want to highlight all the songs of
                    //         Get our id's array from the format [id1, id2, ...] into [{id: id1, collection_id: cid1}, {id: id2, collection_id: cid2}, ...]
                    //         so those filtering functions can operate on it.

                    //     idsInBin = idsInBin.map((d) => {
                    //         return {"id": d, collection_id: collectionId};
                    //     });

                    //     /* check if the filter function evaluates true for at least one id in this bin, i.e. if one id in this bin needs to be highlighted,
                    //     then highlight the whole bin */
                    //     for(let id of idsInBin) {
                    //         if(_this.highlight(id)) {
                    //             return false;
                    //         }
                    //     }

                    //     // otherwise, if the filteredIds is not empty then this bin does not contain the id we want to highlight -> fade it
                    //     return true;
                    // });
                }
            })
            .on("end", function() {
                        // If there is no longer an extent or bounding box then the brush has been removed
                if(!d3.event.selection) {
                    // Bring back all hidden .dot elements
                    svg.selectAll('.faded').classed('faded', false);
                    // Return the state of the active brushCell to be undefined
                    this.brushHist = undefined;
                }
            });

        this.redraw();

    }



  // Generates the data for one histogram by stacking the data of all the collections / artists for a single dimension (e.g. energy)
  stackData(dimension) {

    let processedArray = [];

    // used for forcing histogram bins to have specific values
    let start = this.x.domain()[0];
    let end = this.x.domain()[1];
    let step = (this.x.domain()[1] - this.x.domain()[0])/20;

    // set the parameters for the histogram
    var histogram = d3.histogram()
        .value((d) => d[dimension])   // I need to give the vector of value
        .domain(this.x.domain())  // then the domain of the graphic
        .thresholds(d3.range(start, end+step, step));

    // creates bins histogram array that we will use to fill our processedArray with correct format
    let artist_songs = this.data[0]["songs"];
    var bins = histogram(artist_songs);

    // put correct format from bins into processedArray
    // creates structure of for example
    // bin: 0, json0: 4, json1: 7
    // bin: 1, json0: 0, json1: 2
    // etc
    // bin is then followed with counts for each json below

    // Create bins
    for (var i = 0; i < 21; i++) {
      processedArray.push({"bin": bins[i]['x0']})
    }

    // Fill bins
    for(let i = 0; i < this.data.length; i++) {

      if (this.data[i] != null) {

        artist_songs = this.data[i]["songs"];
        var bins = histogram(artist_songs);

        for(let j = 0; j < processedArray.length; j++) {
          processedArray[j]["json" + i] = bins[j].length; // save the count in this bin
          processedArray[j]["ids" + i] = bins[j].map((d) => d.id); // save the id's of the songs in this bin
        }
      }
    }

    //stacks json groups for proper cumulative count formatting
    var keys = Object.keys(processedArray[0]).slice(1, processedArray[0].length).filter((d) => d.includes("json")); // [json0, json1, ... , jsonN]
    var stack = d3.stack().keys(keys);

    return stack(processedArray);
  }

  /* Accepts the stacked data representing a single histogram (as generated by stackData()) and draws it to the screen
     The parameter i specify that this histogram is the histogram of the dimension at dimensions[i]
  */
  drawHistogram(stackedData, i) {

    console.log("STACKED", stackedData);

    var _this = this;

    let histHeight = parseInt((this.svgHeight) / this.dimensions.length);

    //obtains max count from last json data group max
    let yMax = d3.max(stackedData[stackedData.length - 1], (d) => d[1]);

    // console.log(i*400);
    // console.log(i*400 + 50);

    let range = [i*histHeight + (histHeight-30), i*histHeight];
    let domain = [0, yMax];

    this.HistBottom = i*histHeight + (histHeight-30);
    this.HistTop = i*histHeight;

    let y = d3.scaleLinear()
    .domain(domain)
    .range(range);

    // used for forcing x axis ticks to have specific values
    let numTicks = 1; // <--- Adjust this value to force a different number of ticks on the axis
    let start = this.x.domain()[0];
    let end = this.x.domain()[1];
    let step = (this.x.domain()[1] - this.x.domain()[0])/numTicks;

    let xAxis = (g) => g
    .attr('class', 'x_axis')
    .attr("transform", 'translate(0,' + (range[0]+1) + ')')
    .call(d3.axisBottom(_this.x)
      .tickValues(d3.range(start, end+step, step))
      .tickFormat(Utils.formatByKey(_this.dimensions[i]))
      );

    let yAxis = (g) => g
    .attr('class', 'y_axis')
    .attr('transform', 'translate(' + this.paddingLeft + ',0)')
    .call(d3.axisLeft(y)
        .ticks(2));

    // 1. Add histogram to SVG

    let temp = [1]; // cheap trick to draw #hist{i} only if it does not exist
    let histogramG = this.svg.selectAll("#hist" + i).data(temp);
    let xAxisG = this.svg.selectAll("#hist" + i + "X").data(temp);
    let yAxisG = this.svg.selectAll("#hist" + i + "Y").data(temp);

    // enter
    let histogramGEnter = histogramG.enter()
        .append("g")
        .attr("id", "hist" + i)
        .attr('class', 'brush')
        .call(this.brush);

    let xAxisGEnter = xAxisG.enter().append("g").attr("id", "hist" + i + "X").call(xAxis);
    let yAxisGEnter = yAxisG.enter().append("g").attr("id", "hist" + i + "Y").call(yAxis);

    // calculate the center location of the histogram
    let centerPx = parseInt(this.x.range()[0] + (this.x.range()[1] - this.x.range()[0])/2);

    selectAllOrCreateIfNotExist(this.svg, `text.label.grid-axis-label.x_label#axis-label-${i}`)
        .attr("text-anchor", "middle")
        .attr('alignment-baseline', 'baseline')
        .text(Utils.formatKeyLabel(_this.dimensions[i]))
        .call(addHelpTooltip(_this.dimensions[i].toLowerCase()))
        .transition(d3.transition().duration(750))
        .attr('transform', 'translate(' + centerPx + ',' + parseInt(range[0]+15) + ')');

    // update
    xAxisG.transition(d3.transition().duration(750)).call(xAxis);
    yAxisG.transition(d3.transition().duration(750)).call(yAxis);

    histogramG = histogramG.merge(histogramGEnter);

    // exit
    histogramG.exit().remove();

    // 2. On the histogram draw a g for each collection / artist

    // enter
    let artistG = histogramG.selectAll("g").data(stackedData);
    let artistGEnter = artistG.enter().append("g")

    // exit
    artistG.exit().remove();

    // update
    artistG = artistG.merge(artistGEnter).attr("fill", function(d, index) { return _this.colors[index]; })
                                        .attr("id", (d,index) => "hist" + i + "artist" + index);
          // .style('stroke', function(d, i) { return colors[i]; })

    // 3. Draw the rectangles for the currently selected collection / artist

    // enter
    let rectangles = artistG.selectAll("rect").data(d => d);
    let rectanglesEnter = rectangles.enter().append("rect");

    rectanglesEnter.attr('class', "bin-rect")
          .attr("x", (d, i) => _this.x(d.data.bin))
          .attr("width", (this.histWidth / 20) - 2)
          .attr("y", d => y(d[1]))
          .attr("height", d => y(d[0]) - y(d[1]))
          .on("mouseover", function(d) {

            /* we gave each artist g an id in drawHistogram, use this to determine what artist this rectangle belongs to
                and therefore what key to look at in d.data (i.e. ids0 or ids1 or ids2 etc) to find the songs in this bin */
            let artistIndex = this.parentNode.id.slice(-1);

            // get a list of all the id's in this bin
            let idsInBin = d.data["ids" + artistIndex];

            // send a filtering function out to the other components to highlight the id's in this bin everywhere
             _this.dispatch.call('highlight', this, (k) => idsInBin.includes(k.id));

          }).on("mouseout", (d) => {
                _this.dispatch.call('highlight', this, k => true);
          });

    // update
    rectangles.transition(d3.transition().duration(750))
          .attr("x", (d, i) => _this.x(d.data.bin))
          .attr("y", d => y(d[1]))
          .attr("height", d => y(d[0]) - y(d[1]))
          .attr("width", (this.histWidth / 20) - 2);

    rectangles = rectangles.merge(rectanglesEnter);

    // exit
    rectangles.exit().remove();

      // .style("opacity", .2)

    // Create axis and their labels


        //console.log(parseInt((range[0] - range[1])/2)+range[1]);
    // this.svg.append('text')
    //     .attr('class', 'y_label')
    //     .attr("transform","translate(20," + (parseInt((range[0] - range[1])/2)+range[1]+22) + ")rotate(270)")
    //     .text('Count');
  }

  redraw() {


    if(this.data !== null && this.data !== undefined) {

      if(this.data.length == 0) {
        this.svg.selectAll("*").remove(); // clear old histograms from canvas
      } else {

        //this.svg.selectAll("*").remove(); // clear old histograms from canvas

        var realDimensions = this.dimensions;
        var _this = this;

        let histogramsDatasets = []; // has length = to the length of dimensions, each entry is a dataset for one histogram

        let flatData = [];
        for(let i = 0; i < this.data.length; i++) {
          flatData = flatData.concat(this.data[i].songs);
        }

        this.histWidth = parseInt(this.svgWidth);

        // for each dimension (e.g. energy) create stacked histogram data and draw a histogram
        for(let i = 0; i < realDimensions.length; i++) {

          if(realDimensions[i] === "tempo") {
            _this.x = d3.scaleLinear()
              .domain([0, 240])
              .range([this.paddingLeft, this.histWidth]);
            } else if(realDimensions[i] === "loudness") {
              _this.x = d3.scaleLinear()
              .domain([-60, 0])
              .range([this.paddingLeft, this.histWidth]);
            } else if(realDimensions[i] === "release_year") {
              _this.x = d3.scaleLinear()
              .domain(d3.extent(flatData, (d) => d.release_year))
              .range([this.paddingLeft, this.histWidth]);
            } else {
              _this.x = d3.scaleLinear()
              .domain([0, 1])
              .range([this.paddingLeft, this.histWidth]);
            }

          _this.drawHistogram(_this.stackData(realDimensions[i]), i);
        }
      }
    }
  }

    /**
     * @desc draws grid in the back of the vis
     * @param void
     * @return void
    */
    // initGrid () {
    //     this.grids = [];
    //     this.allGridsG = selectAllOrCreateIfNotExist(this.svg, 'g.grids-all');
    //     for (let i = 0 ; i < this.SPLITS; i++) {
    //         let multiGridG = selectAllOrCreateIfNotExist(this.allGridsG, `g.grid-split#grid-split-${i}`)
    //             .classed('mini', this.SPLITS > 1);
    //         if (this.useRadialScale())
    //             this.grids.push(axisRadial(
    //                 this.SCALE_X,
    //                 this.SCALE_Y,
    //                 this.CENTER_BY_NUM_SPLITS[this.SPLITS][i],
    //                 this.config.xMapping.key,
    //                 this.config.yMapping.key));
    //         else{
    //             this.grids.push(axisRect(
    //                 this.SCALE_X,
    //                 this.SCALE_Y,
    //                 this.CENTER_BY_NUM_SPLITS[this.SPLITS][i],
    //                 this.config.xMapping.key,
    //                 this.config.yMapping.key));
    //             }
    //         multiGridG.call(this.grids[i]);
    //     }
    // }

    onDataChanged (newData) {
        this.data = newData;
        this.redraw();
        console.log('onDataChanged: ' + this.data);
    }

    onScreenSizeChanged () {
        console.log('onScreenSizeChanged');
        // update the size
        this.svgWidth = parseInt(this.svg.style("width"), 10);
        this.svgHeight = parseInt(this.svg.style("height"), 10);
        // redraw
        this.redraw();
    }



    onFilter (filterFunction) {
        this.filter = filterFunction;
        this.filteredData = this.data.filter(filterFunction);
        console.log('onFilter');
    }

    onHighlight(filterFunction) {

        this.highlight = filterFunction;
        console.log(filterFunction);

        let _this = this;

        d3.selectAll('.bin-rect')
            .classed('fade', function(d) {

                /* we gave each artist g an id in drawHistogram, use this to determine what artist this rectangle belongs to
                    and therefore what key to look at in d.data (i.e. ids0 or ids1 or ids2 etc) to find the songs in this bin */
                let artistIndex = this.parentNode.id.slice(-1);

                // get the Spotify id of the collection (artist)
                let collectionId = _this.data[artistIndex].id;

                // get a list of the id's in this bin
                let idsInBin = d.data["ids" + artistIndex]; //_this.getAllIdsInBin(d);

                 /* The filtering function typically has format (d) => d.id == s.id where s.id is the magical song id we want to highlight.
                    Or (d) => d.collection_id == s.id where s.id is the id of a collection we want to highlight all the songs of
                    Get our id's array from the format [id1, id2, ...] into [{id: id1, collection_id: cid1}, {id: id2, collection_id: cid2}, ...]
                    so those filtering functions can operate on it.
                */
                idsInBin = idsInBin.map((d) => {
                    return {"id": d, collection_id: collectionId};
                });

                /* check if the filter function evaluates true for at least one id in this bin, i.e. if one id in this bin needs to be highlighted,
                then highlight the whole bin */
                for(let id of idsInBin) {
                    if(_this.highlight(id)) {
                        return false;
                    }
                }

                // otherwise, if the filteredIds is not empty then this bin does not contain the id we want to highlight -> fade it
                return true;
            });

        console.log('onHighlight');
    }
}
