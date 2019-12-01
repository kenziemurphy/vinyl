class HistogramView {
    constructor (svg, data = []) {
        // init here
        this.svg = svg;
        this.data = data;

        //var svg = d3.select('svg');
        this.svgWidth = +this.svg.attr('width');
        this.svgHeight = +this.svg.attr('height');
        this.fileNameArray = []; // the filenames to load data from
        this.jsonDataArray = []; // the raw data as loaded from the json files

        // this.data.forEach(function (d) {
        //     console.log(d);
        //     this.fileNameArray.push(d);
        // });

        //adds files to the fileNameArray, eventually this will come from user input
        this.fileNameArray.push('../python_scripts/billboard.json');
        this.fileNameArray.push('../data/radiohead.json')
        this.fileNameArray.push('../data/slotmachine.json')
        this.fileNameArray.push('../data/radiohead.json')
        console.log(this.fileNameArray);
        // console.log(this.fileNameArray);
        // console.log(this.jsonDataArray);

        // sets colors for the histogram rectangles
        this.colors = ['#FCA981','#6988F2','#F36293', '#81D0EF'];
        this.dimensions = ["energy", "danceability", "valence", "speechiness", "instrumentalness", 'tempo', 'loudness'];
        //["energy", "danceability", "acousticness", "liveness", "valence", "speechiness", "instrumentalness", 'tempo', 'loudness']; // Edit this for more histograms

        this.x = d3.scaleLinear()
          .domain([0, 1])
          .range([52, 300]);


        this.redraw();



    }

    // Generates the data for one histogram by stacking the json data of all the files for a single dimension (e.g. energy)
stackData(dimension) {

  let processedArray = [];

   let thresholdArray = [ 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216, 228, 240];

  // set the parameters for the histogram
  var histogram = d3.histogram()
      .value((d) => +d[dimension])   // I need to give the vector of value
      .domain(this.x.domain())
      //.thresholds(d3.thresholdFreedmanDiaconis(thresholdArray, 0, 60)); // then the domain of the graphic
      .thresholds(20); // then the numbers of bins

  // creates bins histogram array that we will use to fill our processedArray with correct format
  data = this.jsonDataArray[0];
  // console.log("DATA: " + this.jsonDataArray[0]);
  var bins = histogram(data);
  console.log(data);
  console.log(bins);
  //console.log(processedArray);

        // bins.forEach(function (d) {
        //     console.log("bin" + d['x0'].toString());

        // });


  // put correct format from bins into processedArray
  // creates structure of for example
  // bin: 0, json0: 4, json1: 7
  // bin:1, json0: 0, json1: 2
  // etc
  // bin is then followed with counts for each json below
  for (var i = 0; i < 20; i++) {
    processedArray.push({"bin": bins[i]['x0']})
  }
  //console.log(processedArray);

  // here is where bins are updated from json data
  for(let i = 0; i < this.jsonDataArray.length; i++) {

    if (this.jsonDataArray[i] != null) {

      data = this.jsonDataArray[i];
      var bins = histogram(data);

      for(let j = 0; j < processedArray.length; j++) {
        //console.log(processedArray[j]);
        processedArray[j]["json" + i] = bins[j].length;
      }
    }
  }

  //console.log(processedArray);

  //stacks json groups for proper cumulative count formatting
  var keys = Object.keys(processedArray[0]).slice(1, processedArray[0].length); // [json0, json1, ... , jsonN]
  var stack = d3.stack().keys(keys);
  return stack(processedArray);
}

/* Accepts the stacked data representing a single histogram (as generated by stackData()) and draws it to the screen
  The parameter i specify that this histogram is the histogram of the dimension at dimensions[i]
*/
drawHistogram(stackedData, i) {

    var _this = this;

  //obtains max count from last json data group max
  let yMax = d3.max(stackedData[stackedData.length - 1], (d) => d[1]);

  // console.log(i*400);
  // console.log(i*400 + 50);

  let range = [i*100 + 50, i*100 + 10];
  let domain = [0, yMax];

  // console.log(range);

  let y = d3.scaleLinear()
  .domain(domain)
  .range(range);

  let xAxis = (g) => g
  .attr('class', 'x_axis')
  .attr("transform", 'translate(0,' + (range[0]+1) + ')')
  .call(d3.axisBottom(_this.x)
    .ticks(1));

  let yAxis = (g) => g
  .attr('class', 'y_axis')
  .attr("transform", 'translate(50,0)')
  .call(d3.axisLeft(y)
      .ticks(2));

  //adds to histogram to svg
  this.svg.append("g")
      .selectAll("g")
      .data(stackedData)
      .join("g")
        .attr("fill", function(d, i) { return _this.colors[i]; })
        // .style('stroke', function(d, i) { return colors[i]; })
      .selectAll("rect")
      .data(d => d)
      .join("rect")
        .attr('class', "bin-rectangle")
        .attr("x", (d, i) => _this.x(d.data.bin))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", 10);

    // .style("opacity", .2)

  // Create axis and their labels

  this.svg.append("g")
    .call(xAxis)
  this.svg.append("g")
      .call(yAxis)

  let xLabel = _this.dimensions[i].charAt(0).toUpperCase() +  _this.dimensions[i].slice(1);
  this.svg.append('text')
      .attr('class', 'x_label')
      .attr('transform', 'translate(150,' + parseInt(range[0]+20) + ')')
      // .attr('text-anchor', "middle")
      .text(xLabel);
      //console.log(parseInt((range[0] - range[1])/2)+range[1]);
  // this.svg.append('text')
  //     .attr('class', 'y_label')
  //     .attr("transform","translate(20," + (parseInt((range[0] - range[1])/2)+range[1]+22) + ")rotate(270)")
  //     .text('Count');
}

redraw() {

        var realJsonDataArray = this.jsonDataArray;
        var realFilenameArray = this.fileNameArray;
        var realDimensions = this.dimensions;
        var _this = this;

        // this.fileNameArray.length = 0;
        // this.jsonDataArray.length = 0;
        // this.data.forEach(function (d) {
        // console.log(d);
        // _this.fileNameArray.push(d);
        // });
        // console.log(_this.fileNameArray);


    // d3 loading of json files linked to get data and put in jsonData array
        d3.json(this.fileNameArray[0]).then(function (data) {
        //console.log("LOUDNESS: " + data.map((d)=>d.loudness));
        // Data source 1 load completed

          //console.log(data);
          realJsonDataArray.push(data);
          if (realFilenameArray[1]){
            return d3.json(realFilenameArray[1]);
          } else {
            return null;
          }

        }).then(function (data) {

          // Data source 2 load completed

          realJsonDataArray.push(data);
          //stuff
         if (realFilenameArray[2]){
            return d3.json(realFilenameArray[2]);
          } else {
            return null;
          }

        }).then(function (data) {

          // Data source 3 load completed

          realJsonDataArray.push(data);
          //stuff
         if (realFilenameArray[3]){
            return d3.json(realFilenameArray[3]);
          } else {
            return null;
          }

        }).then(function (data){

          // Data source 4 load completed

          realJsonDataArray.push(data);

          ////////////////////////////// PROCESS DATA INTO STACKED HISTOGRAM FORMAT AND PLOT ///////////////////////////////

          let histogramsDatasets = []; // has length = to the length of dimensions, each entry is a dataset for one histogram

          // for each dimension (e.g. energy) create stacked histogram data and draw a histogram
          for(let i = 0; i < realDimensions.length; i++) {
            if (realDimensions[i] === 'loudness') {
            _this.x = d3.scaleLinear()
                .domain([-40, 0])
                .range([52, 300]);
            } else if (realDimensions[i] === 'tempo') {
                _this.x = d3.scaleLinear()
                .domain([0, 200])
                .range([52, 300]);
            } else {
                _this.x = d3.scaleLinear()
                .domain([0, 1])
                .range([52, 300]);
            }
            _this.drawHistogram(_this.stackData(realDimensions[i]), i);
          }

        });
}

    onDataChanged (newData) {
        this.data = newData;
        // this.redraw();
        console.log('onDataChanged');
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
        console.log(this.highlight);
        d3.selectAll('.bin-rectangle')
            .classed('faded', d =>!this.highlight(d));
        console.log('onHighlight');
    }
}
