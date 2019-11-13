// **** Example of how to create padding and spacing for trellis plot****
var svg = d3.select('svg');

// Hand code the svg dimensions, you can also use +svg.attr('width') or +svg.attr('height')
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

let fileNameArray = [];
let jsonDataArray = [];
let processedArray = [];
fileNameArray.push('../../python_scripts/billboard.json');
fileNameArray.push('../radialplot/radiohead.json')


    var x = d3.scaleLinear()
      .domain([0, 1])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
      .range([0, 700]);

      // console.log(x.domain());

  // set the parameters for the histogram
  var histogram = d3.histogram()
      .value(function(d) { return d.danceability; })   // I need to give the vector of value
      .domain(x.domain())  // then the domain of the graphic
      .thresholds(x.ticks(10)); // then the numbers of bins



  d3.json(fileNameArray[0]).then(function (data) {
    console.log(data);
    jsonDataArray.push(data);
    if (fileNameArray[1]){
      return d3.json(fileNameArray[1]);
    } else {
      return null;
    }
  }).then(function (data) {
    jsonDataArray.push(data);
    //stuff
   if (fileNameArray[2]){
      return d3.json(fileNameArray[2]);
    } else {
      return null;
    }
  }).then(function (data) {
    jsonDataArray.push(data);
    //stuff
   if (fileNameArray[3]){
      return d3.json(fileNameArray[3]);
    } else {
      return null;
    }
  }).then(function (data){
    jsonDataArray.push(data);

      data = jsonDataArray[0];
    var bins = histogram(data);

    for (i = 0; i < 11; i++) {
      processedArray.push({"bin": bins[i]['x0']})
    }

    for(let i = 0; i < jsonDataArray.length; i++) {

      if (jsonDataArray[i] != null) {

        data = jsonDataArray[i];
        var bins = histogram(data);

        for(let j = 0; j < bins.length; j++) {
          processedArray[j]["json" + i] = bins[j].length;
        }

        }

    }

    console.log(processedArray);

    var dataset = d3.stack()
    .keys(["json0", "json1"])(processedArray)

    // .map(function(fruit) {
    //   return processedArray.map(function(d) {
    //     return {x: d.bin, y: +d[fruit]};
    //   });
    // }));

    console.log(dataset);

  });


  // putStuff(0);
  // putStuff(1);
  // putStuff(2);
  // putStuff(3);



// for (index in jsonDataArray) {
//   if (jsonDataArray[index] != null) {

//   data = jsonDataArray[index];
//   var bins = histogram(data);

//   }
// }


function putStuff(index) {
  if (jsonDataArray[index] != null) {
    // And apply this function to data to get the bins
  data = jsonDataArray[index];
  console.log(data);
  var bins = histogram(data);
  processedArray
  console.log(bins)

  var y = d3.scaleLinear()
    .range([500, 0])
    .domain([0, d3.max(bins, function(d) { return d.length; })]);

// append the bar rectangles to the svg element
  svg.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", 69)
        .attr("height", function(d) { return 500 - y(d.length); })
        .style("fill", "#69b3a2")
  }
}

