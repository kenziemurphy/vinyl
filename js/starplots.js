class StarView {
    constructor (svg, data = []) {
        // @Shelly
        
        // init here   
        this.svg = svg;
        this.data = data; 

        // placeholder
        this.H = parseInt(this.svg.style("height"), 10);
        this.W = parseInt(this.svg.style("width"), 10);
        let n = 10;
        svg.selectAll('rect')
            .data(d3.range(0, 100, 100 / n))
            .enter()
            .append('rect')
            .attr('x', (d, i) => i * this.W / n)
            .attr('y', d => 100 - d)
            .attr('width', this.W / n - 2)
            .attr('height', d => d)
            .attr('fill', '#fff')

    }

    onDataChanged (newData) {
        this.data = newData;
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
        console.log('onHighlight');
    }
}