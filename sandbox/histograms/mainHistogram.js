// **** Example of how to create padding and spacing for trellis plot****
var svg = d3.select('svg');

// Hand code the svg dimensions, you can also use +svg.attr('width') or +svg.attr('height')
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

let fileNameArray = [];
let jsonDataArray = [];
let processedArray = [];
let yMax;
let y;

var x = d3.scaleLinear()
  .domain([0, 1])
  .range([52, 750]);

//adds files to the fileNameArray, eventually this will come from user input
fileNameArray.push('../../python_scripts/billboard.json');
fileNameArray.push('../radialplot/radiohead.json')
fileNameArray.push('../radialplot/slotmachine.json')

// sets colors for the histogram rectangles
var colors = ['#fbb4ae','#b3cde3','#ccebc5','#decbe4'];

// set the parameters for the histogram
var histogram = d3.histogram()
    .value(function(d) { return d.energy; })   // I need to give the vector of value
    .domain(x.domain())  // then the domain of the graphic
    .thresholds(x.ticks(10)); // then the numbers of bins

// d3 loading of json files linked to get data and put in jsonData array
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

// creates bins histogram array that we will use to fill our processedArray with correct format
data = jsonDataArray[0];
var bins = histogram(data);


// put correct format from bins into processedArray
// creates structure of for example
// bin: 0, json0: 4, json1: 7
// bin:1, json0: 0, json1: 2
// etc
// bin is then followed with counts for each json below
for (i = 0; i < 11; i++) {
  processedArray.push({"bin": bins[i]['x0']})
}


// here is where bins are updated from json data
for(let i = 0; i < jsonDataArray.length; i++) {
  if (jsonDataArray[i] != null) {
    data = jsonDataArray[i];
    var bins = histogram(data);
    for(let j = 0; j < bins.length; j++) {
      processedArray[j]["json" + i] = bins[j].length;
    }
  }
}

//stacks json groups for proper cumulative count formatting
var dataset = d3.stack()
.keys(["json0", "json1", "json2"])(processedArray)

//obtains max count from last json data group max
yMax = d3.max(dataset[dataset.length - 1], (d) => d[1])
console.log(yMax);

var y = d3.scaleLinear()
.domain([0, yMax])
.range([600,50])

let xAxis = (g) => g
.attr("transform", `translate(0,601)`)
.call(d3.axisBottom(x))

yAxis = (g) => g
.attr("transform", `translate(50,0)`)
.call(d3.axisLeft(y))
.append("text")
.text("Count");

//adds to histogram to svg
svg.append("g")
.selectAll("g")
.data(dataset)
.join("g")
  .attr("fill", function(d, i) { return colors[i]; })
.selectAll("rect")
.data(d => d)
.join("rect")
  .attr("x", (d, i) => x(d.data.bin))
  .attr("y", d => y(d[1]))
  .attr("height", d => y(d[0]) - y(d[1]))
  .attr("width", 69)

svg.append("g")
  .call(xAxis)

svg.append("g")
    .call(yAxis)

svg.append('text')
    .attr('class', 'x_label')
    .attr('transform', 'translate(356,635)')
    .text('Energy');

svg.append('text')
    .attr('class', 'y_label')
    .attr("transform","translate(20,307.5)rotate(270)")
    .text('Count');

});


