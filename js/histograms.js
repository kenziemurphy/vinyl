class HistogramView {
    constructor (svg, data, dispatch) {

        // init here
        this.svg = svg;
        this.data = data;
        this.dispatch = dispatch;
        this.brushHist;
        this.isBrushing = false;

        //var svg = d3.select('svg');
        // NOTE: I fixed this svgWidth/Height, it should work now -- Tae
        this.svgWidth = parseInt(this.svg.style("width"), 10);
        this.svgHeight = parseInt(this.svg.style("height"), 10);

        this.idsInBinBrush = [];


        // sets colors for the histogram rectangles
        this.colors = ['#F36293', '#81D0EF','#FCA981', '#6988F2'];
        //this.dimensions = ["energy", "danceability", "tempo", "loudness", "acousticness", "liveness", "valence", "speechiness", "instrumentalness", "release_year", "popularity"]; // Edit this for more histograms
        this.dimensions = ["popularity", "release_year", "duration", "tempo", "energy", "danceability", "valence", "acousticness", "liveness", "instrumentalness", "speechiness"];
        this.histWidth = parseInt(this.svgWidth);
        this.histHeight = parseInt((this.svgHeight) / this.dimensions.length);
        this.paddingLeft = 20;

        this.HistTop = 0;
        this.HistBottom = this.histHeight - 30;

        this.x = d3.scaleLinear()
          .domain([0, 1])
          .range([52, 285]);

        this.createAxes();

        let _this = this;

        this.brush = d3.brushX()
            .extent(function() {
                return [[20, _this.HistTop], [_this.histWidth + 2, _this.HistBottom]];
            })
            // .extent([[20, _this.HistTop], [_this.histWidth, _this.HistBottom]])
            .on("start",  function (histogram) {
                console.log("HERE IS E")
                _this.isBrushing = true;

                // Check if this g element is different than the previous brush
                if(_this.brushHist !== this) {


                // Clear the old brush
                 _this.brush.move(d3.select(_this.brushHist), null);

                // Save the state of this g element as having an active brush
                _this.brushHist = this;
            }
            })
            .on("brush", function (histogram) {
                        // Get the extent or bounding box of the brush event, this is a 2x2 array
                var e = d3.event.selection;
                clearTutorial();

                d3.selectAll('.selection').style("opacity", 1);

                let indexes = [];
                let ids = [];
                let _THIS = this;
                //console.log("HISTOGRAM");
                //console.log(this);

                let histID = this['id'];


                if(e) {

                    let tempArray = [];
                    // Select all .bin-rect, and add the "fade" class if the data for that circle
                    // lies outside of the brush-filter applied for this rectangle x and y attributes
                    d3.selectAll('#' + histID + ' .bin-rect')
                     .classed("", function(d){
                        if (+d3.select(this).attr("x") > e[0] && +d3.select(this).attr("x") + +d3.select(this).attr("width") < e[1]) {
                            indexes.push(this);


                            /* we gave each artist g an id in drawHistogram, use this to determine what artist this rectangle belongs to
                            and therefore what key to look at in d.data (i.e. ids0 or ids1 or ids2 etc) to find the songs in this bin */
                            let artistIndex = this.parentNode.id.slice(-1);

                            // get the Spotify id of the collection (artist)
                            let collectionId = _this.data[artistIndex].id;

                            // get a list of the id's in this bin
                            _this.idsInBinBrush = _this.idsInBinBrush.concat(d.data["ids" + artistIndex]); //_this.getAllIdsInBin(d);

                            // send a filtering function out to the other components to highlight the id's in this bin everywhere
                            _this.dispatch.call('highlight', this, (k) => _this.idsInBinBrush.includes(k.id));
                            console.log(_this.idsInBinBrush)
                        } else {

                            /* we gave each artist g an id in drawHistogram, use this to determine what artist this rectangle belongs to
                            and therefore what key to look at in d.data (i.e. ids0 or ids1 or ids2 etc) to find the songs in this bin */
                            let artistIndex = this.parentNode.id.slice(-1);

                            // get the Spotify id of the collection (artist)
                            let collectionId = _this.data[artistIndex].id;

                            let idsToDelete= d.data["ids" + artistIndex];

                            _this.idsInBinBrush = _this.idsInBinBrush.filter(function(id) {
                                if(idsToDelete.includes(id)) {
                                    return false;
                                }
                                return true;
                            });

                            _this.dispatch.call('highlight', this, (k) => _this.idsInBinBrush.includes(k.id));

                        }
                        console.log("INDEXES");
                    })
                }
            })
            .on("end", function() {
                // If there is no longer an extent or bounding box then the brush has been removed
                console.log("HERE WE ARE")
                console.log(d3.event.selection)
                if(!d3.event.selection) {
                    _this.isBrushing = false;
                    _this.idsInBinBrush = [];
                    // Bring back all faded elements
                    _this.dispatch.call('highlight', this, k => true);
                    // svg.selectAll('.fade').classed('fade', false);
                    // Return the state of the active brushHist to be undefined
                    this.brushHist = undefined;
                }
            });

                d3.select("body").on("click", () => {
                 _this.brush.move(d3.select(_this.brushHist), null);
                this.isBrushing = false;

            });

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
        .tickValues(domain));

    // 1. Add histogram to SVG

    let temp = [1]; // cheap trick to draw #hist{i} only if it does not exist
    let histogramG = this.svg.selectAll("#hist" + i).data(temp);
    let xAxisG = this.svg.selectAll("#hist" + i + "X").data(temp);
    let yAxisG = this.svg.selectAll("#hist" + i + "Y").data(temp);

    // enter
    let histogramGEnter = histogramG.enter()
        .append("g");

        histogramGEnter.attr("id", "hist" + i)
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
          .attr("x", (d, i) => _this.x(d.data.bin) + 2)
          .attr("width", (this.histWidth / 20) - 2)
          .attr("y", d => y(d[1]))
          .attr("height", d => y(d[0]) - y(d[1]))
          .on("mouseover", function(d) {
            console.log('MOUSEOVER')
            if (!_this.isBrushing) {
                /* we gave each artist g an id in drawHistogram, use this to determine what artist this rectangle belongs to
                and therefore what key to look at in d.data (i.e. ids0 or ids1 or ids2 etc) to find the songs in this bin */
            let artistIndex = this.parentNode.id.slice(-1);

            // get a list of all the id's in this bin
            let idsInBin = d.data["ids" + artistIndex];

            // send a filtering function out to the other components to highlight the id's in this bin everywhere
             _this.dispatch.call('highlight', this, (k) => idsInBin.includes(k.id));
              callTutorial('#hist0', 'You can also filter songs by attributes<br>by brushing over these histograms.', 'w')
            }
          })
          .on("mousedown", function(d) {
            console.log('mousedown')
            let brush_elm = _this.svg.select(".brush").node();
            let new_click_event = new Event('mousedown');
            new_click_event.pageX = d3.event.pageX;
            new_click_event.clientX = d3.event.clientX;
            new_click_event.pageY = d3.event.pageY;
            new_click_event.clientY = d3.event.clientY;
            brush_elm.dispatchEvent(new_click_event);
          })
          .on("mouseout", (d) => {
            if (!_this.isBrushing) {
                _this.dispatch.call('highlight', this, k => true);
            }
          });

    // update
    rectangles.transition(d3.transition().duration(750))
          .attr("x", (d, i) => _this.x(d.data.bin) + 2)
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
              .domain(d3.extent(flatData, (d) => d.release_year + 1))
              .range([this.paddingLeft, this.histWidth]);
            } else if (realDimensions[i] === "popularity") {
              _this.x = d3.scaleLinear()
              .domain([0, 100])
              .range([this.paddingLeft, this.histWidth]);
            } else if (realDimensions[i] === "duration") {
              _this.x = d3.scaleLinear()
              .domain(d3.extent(flatData, (d) => d.duration + 1))
              .range([this.paddingLeft, this.histWidth]);
            }
            else {
              _this.x = d3.scaleLinear()
              .domain([0, 1])
              .range([this.paddingLeft, this.histWidth]);
            }

          _this.drawHistogram(_this.stackData(realDimensions[i]), i);
        }
      }
    }
  }

    createAxes() {

        let _this = this;

          for(let i = 0; i < this.dimensions.length; i++) {
            let range = [i*this.histHeight + (this.histHeight-30), i*this.histHeight];
            if(this.dimensions[i] === "tempo") {
              this.x = d3.scaleLinear()
                .domain([0, 240])
                .range([0, this.histWidth]);
              } else if(this.dimensions[i] === "loudness") {
                this.x = d3.scaleLinear()
                .domain([-60, 0])
                .range([0, this.histWidth]);
              } else if(this.dimensions[i] === "release_year") {
              _this.x = d3.scaleLinear()
              .domain([1995, 2020])
              .range([0, this.histWidth]);
            } else if (this.dimensions[i] === "popularity") {
              _this.x = d3.scaleLinear()
              .domain([0, 100])
              .range([0, this.histWidth]);
            } else if (this.dimensions[i] === "duration") {
              _this.x = d3.scaleLinear()
              .domain([0, 420])
              .range([0, this.histWidth]);
            }else {
                this.x = d3.scaleLinear()
                .domain([0, 1])
                .range([0, this.histWidth]);
              }

        this.range = [i*this.histHeight + (this.histHeight-30), i*this.histHeight];
          this.domain = [0, this.yMax];

          this.y = d3.scaleLinear()
          .domain(this.domain)
          .range(this.range);

          // used for forcing x axis ticks to have specific values
          this.numTicks = 1; // <--- Adjust this value to force a different number of ticks on the axis
          this.start = this.x.domain()[0];
          this.end = this.x.domain()[1];
          this.step = (this.x.domain()[1] - this.x.domain()[0])/this.numTicks;

          this.xAxis = (g) => g
          .attr('class', 'x_axis')
          .attr("transform", 'translate(0,' + (this.range[0]+1) + ')')
          .call(d3.axisBottom(this.x).ticks(0));


          this.yAxis = (g) => g
          .attr('class', 'y_axis')
          .call(d3.axisLeft(this.y)
            .ticks(2));

           // console.log("RRRR", [0, this.yMax]);

              this.temp = [1];
              this.xAxisG = this.svg.selectAll("#hist" + i + "X").data(this.temp);
              this.yAxisG = this.svg.selectAll("#hist" + i + "Y").data(this.temp);

              this.xAxisGEnter = this.xAxisG.enter().append("g").attr("id", "hist" + i + "X").call(this.xAxis);
              this.yAxisGEnter = this.yAxisG.enter().append("g").attr("id", "hist" + i + "Y").call(this.yAxis);

              // calculate the center location of the histogram
    let centerPx = parseInt(this.x.range()[0] + (this.x.range()[1] - this.x.range()[0])/2);

    selectAllOrCreateIfNotExist(this.svg, `text.label.grid-axis-label.x_label#axis-label-${i}`)
        .attr("text-anchor", "middle")
        .attr('alignment-baseline', 'baseline')
        .text(Utils.formatKeyLabel(_this.dimensions[i]))
        .call(addHelpTooltip(_this.dimensions[i].toLowerCase()))
        .attr('transform', 'translate(' + centerPx + ',' + parseInt(range[0]+15) + ')');

          }


    }

    onDataChanged (newData) {
        this.data = newData;
        this.redraw();
        this.createAxes();
        console.log('onDataChanged: ' + this.data);
    }

    onScreenSizeChanged () {
        console.log('onScreenSizeChanged');
        // update the size
        this.svgWidth = parseInt(this.svg.style("width"), 10);
        this.svgHeight = parseInt(this.svg.style("height"), 10);
        // redraw
        this.createAxes();
        this.redraw();
    }



    onFilter (filterFunction) {
        this.filter = filterFunction;
        this.filteredData = this.data.filter(filterFunction);
        console.log('onFilter');
    }

    onHighlight(filterFunction) {
        let _this = this;
        console.log("IMPORTANT")
        console.log(_this.brush)
        this.highlight = filterFunction;
        //console.log(filterFunction);
        if ( this.highlight({k: -1}) === true) {
            console.log("REMOVE SELECTION", this.highlight);
        //d3.selectAll(".selection").call(_this.brush.move, null);
        //d3.selectAll(".brush").call(_this.brush.clear());
          // d3.select('.selection').remove();
        }


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
