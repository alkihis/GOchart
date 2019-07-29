import { Component, Prop, Watch, Element, Event, EventEmitter, Method, h, Listen } from '@stencil/core';
import * as d3 from "d3";
import { GOChartData } from '../../utils';

@Component({
  tag: 'go-chart',
  styleUrl: 'go-chart.css',
  shadow: true
})
export class GOchart {
  @Element() protected element: HTMLElement;

  @Prop() data: GOChartData[] = []; 
  
  @Event({
    eventName: 'go-chart.select'
  }) goSelectEvent: EventEmitter<{ status: boolean, id: string, selected: GOChartData[] }>; 

  @Event({
    eventName: 'go-chart.hoveron'
  }) hoverOn: EventEmitter<{ selected: GOChartData[] }>; 

  @Event({
    eventName: 'go-chart.hoveroff'
  }) hoverOff: EventEmitter<void>; 

  outerWidth : number; 
  svg: d3.Selection<SVGSVGElement, GOChartData, null, undefined>; 

  @Listen('omega-prune.unselect-all', { target: 'window' })
  @Method()
  clearSelection() {
    this.svg.selectAll(".bar")
    .each(function() {
      d3.select(this).classed("active", false);
    });
  }

  @Method()
  async selected() : Promise<GOChartData[]> {
    return this._selected();
  }

  protected _selected() : GOChartData[] {
    const s = [];

    this.svg.selectAll(".bar")
    .each(function(d: GOChartData) {
      if (d3.select(this).classed("active")) {
        s.push(d);
      }
    });

    return s;
  }

  @Watch('data')
  buildChart() {  
    this.svg = d3.select(this.element.shadowRoot.querySelector('svg'));
    const tooltipElem = d3.select(this.element.shadowRoot.querySelector('.tooltip'));

    
    const data = this.data.sort(function (a:any, b:any) {
      return d3.ascending(a.value, b.value);
    });
    /*console.log('DD');
    console.dir(data);*/
    let maxWordLen = 0;
    this.data.forEach((d:any)=>{ maxWordLen = d.term.length > maxWordLen ? d.term.length : maxWordLen;})
    
    const height = this.data.length * 15;
    // set the dimensions and margins of the graph
    const margin = {top: 0, right: 20, bottom: 30, left: 75/*maxWordLen * 3.5*/};
    const width = 500 - margin.left - margin.right;
    //let height = 1200 - margin.top - margin.bottom;

    this.outerWidth = width + 20;

    // set the ranges
    let y = d3.scaleBand()
          .range([height, 0])
          .padding(0.1);

    let x = d3.scaleLinear()
          .range([7, width]);
    
    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    this.svg.selectAll("g").remove();
    const w =  width + margin.left + margin.right;
    const g = this.svg
      .attr("width", w)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    data.forEach(function(d:any) {
      d.value =+ d.value;
    });

    // Scale the range of the data in the domains
    x.domain([0, d3.max(data, function(d:any){ return d.value; })])
    y.domain(data.map(function(d:any) { return d.term; }));
    //y.domain([0, d3.max(data, function(d) { return d.sales; })]);

    const self = this;
    // append the rectangles for the bar chart

    const barBuffer = {};

    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      //.attr("x", function(d) { return x(d.sales); })
      .attr("width", function(d:any) {return x(d.value); } )
      .attr("y", function(d:any) { return y(d.term); })
      .attr("height", y.bandwidth())
      .each(function(d){ barBuffer[d.id] = this;})
      .on('click', function(d) {
        const barStatus =  d3.select(this).classed("active") ? false : true;
        d3.select(this).classed("active", barStatus);
        self.goSelectEvent.emit({'status': barStatus, 'id' : d.id, 'selected': self._selected()});
      })
      .on('mouseover', () => {
        self.hoverOn.emit({'selected': self._selected()});
      })
      .on("mouseout", () => {
        self.hoverOff.emit();
      });
    
    
    // append the text value
    g.append("g")
      .attr("fill", "white")
      .attr("text-anchor", "end")
      .style("font", "12px sans-serif")
      .style('cursor', 'pointer')
    .selectAll("text")
    .data(data)
    .enter().append("text")
      .attr("x", d => x(d.value) - 4)
      .attr("y", d => y(d.term) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .text(d => d.value)
      .each((d: any) => { 
        d._parentBar = barBuffer[d.id]; 
      })
      .on('click', function(d:any){
        const e = document.createEvent('HTMLEvents');
        e.initEvent('click', false, true);
        d._parentBar.dispatchEvent(e);
      });

    // add the x Axis
   
    /*   
    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
    */
    // add the y Axis
    g.append("g")
      .call(d3.axisLeft(y).tickSize(0));
      //.selectAll('path').style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '0px'});

    g.selectAll('path.domain').remove();//.style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '0px'});//.each(function(){console.log('One line')});

    g.selectAll('g.tick')
    .on('mouseover', function(){
      const text = d3.select(this).selectAll('text').text();
      tooltipElem
        .text(text)
        .style("display", "inherit");
    })
    .on('mouseout', function(){
      tooltipElem.style("display", "none");
    })

    //console.log(oldData);
  }

  render() {
    return (
      <div class="window">
        <div class="frame">
          <svg/>
        </div>
        <div class="tooltip" style={{"display": "none"}}/>
      </div>
    );
  }
}
