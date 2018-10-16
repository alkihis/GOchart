import { Component, Prop, Watch, Element, Event, EventEmitter } from '@stencil/core';
import * as d3 from "d3";


let defData = [{"term":"Bob","value":33},{"term":"Robin","value":12},{"term":"Anne","value":41},{"term":"Mark","value":16},{"term":"Joe","value":59},{"term":"Eve","value":38},{"term":"Karen","value":21},{"term":"Kirsty","value":25},{"term":"Chris","value":30},{"term":"Lisa","value":47},{"term":"Tom","value":5},{"term":"Stacy","value":20},{"term":"Charles","value":13},{"term":"Mary","value":29}];



@Component({
  tag: 'go-chart',
  styleUrl: 'go-chart.css',
  shadow: true
})
export class GOchart {
  @Element() private element: HTMLElement;

  @Prop() first: string;
  @Prop() middle: string;
  @Prop() last: string;
  @Prop() data: object[] = defData;
  
  @Event() goSelectEvent: EventEmitter;

  outerWidth : number;
  svg: any;

  @Watch('data')
  buildChart(newData: object[]/*, oldData: undefined|object*/){

    console.log('Receiving');
    console.dir(newData);

    //let frame = d3.select(this.element.shadowRoot.querySelector('.frame'));
    this.svg = d3.select(this.element.shadowRoot.querySelector('svg'));
    let tooltipElem = d3.select(this.element.shadowRoot.querySelector('.tooltip'));
    console.log(this.svg)

    
    let data = this.data.sort(function (a:any, b:any) {
      return d3.ascending(a.value, b.value);
    });
    /*console.log('DD');
    console.dir(data);*/
    let maxWordLen = 0;
    this.data.forEach((d:any)=>{ maxWordLen = d.term.length > maxWordLen ? d.term.length : maxWordLen;})
    
    let height = this.data.length * 15;
  // set the dimensions and margins of the graph
    let margin = {top: 0, right: 20, bottom: 30, left: 75/*maxWordLen * 3.5*/};
    let width = 500 - margin.left - margin.right;
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
    let w =  width + margin.left + margin.right;
    let g = this.svg
    .attr("width", w)
    .attr("height", height + margin.top + margin.bottom)
   // .attr("viewport", "0 0 800 500")
    .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    data.forEach(function(d:any) {
      d.value =+ d.value;
    });

    // Scale the range of the data in the domains
    x.domain([0, d3.max(data, function(d:any){ return d.value; })])
    y.domain(data.map(function(d:any) { return d.term; }));
    //y.domain([0, d3.max(data, function(d) { return d.sales; })]);

    let self = this;
    // append the rectangles for the bar chart

    let barBuffer = {};


    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      //.attr("x", function(d) { return x(d.sales); })
      .attr("width", function(d:any) {return x(d.value); } )
      .attr("y", function(d:any) { return y(d.term); })
      .attr("height", y.bandwidth())
      .each(function(d){ barBuffer[d.id] = this;})
      .on('click', function(d:any){
        console.log(d);
        console.log(this);
        let barStatus =  d3.select(this).classed("active") ? false : true;
        d3.select(this).classed("active", barStatus);
        self.goSelectEvent.emit({'status' : barStatus, 'id' : d.id});
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
      .each((d:any) => { 
        d._parentBar = barBuffer[d.id]; 
      })
      .on('click', function(d:any){
        //console.log(this);
        //console.log(d);

        let e = document.createEvent('HTMLEvents');
        e.initEvent('click', false, true);
        d._parentBar.dispatchEvent(e);

      });

    // add the x Axis
   
 /*   g.append("g")
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
      let text = d3.select(this).selectAll('text').text();
      tooltipElem
      .text(text)
      .style("opacity", 1);
    })
    .on('mouseout', function(){
      tooltipElem.style("opacity", 0);
    })

    //console.log(oldData);
  }


  format(): string {
    return (
      (this.first || '') +
      (this.middle ? ` ${this.middle}` : '') +
      (this.last ? ` ${this.last}` : '')
    );
  }
  render() {
    /*
    let style = {'maxWidth' : this.outerWidth};
    console.log(style);
    */
    return (
            <div class="window">
                <div class="frame">
                  <svg/>
                </div>
                <div class="tooltip"/>
              </div>
            );
  }



  /**
   * The component is about to load and it has not
   * rendered yet.
   *
   * This is the best place to make any data updates
   * before the first render.
   *
   * componentWillLoad will only be called once.
   */
  componentWillLoad() {
    console.log('Component is about to be rendered');
  }

  /**
   * The component has loaded and has already rendered.
   *
   * Updating data in this method will cause the
   * component to re-render.
   *
   * componentDidLoad will only be called once.
   */
  componentDidLoad() {
    console.log('ComponentDidLoad');
    /*
    console.log(this.element.shadowRoot.querySelector('svg'))
    console.log(this.element.getElementsByTagName('div'));
    */
    
  }

  /**
   * The component is about to update and re-render.
   *
   * Called multiple times throughout the life of
   * the component as it updates.
   *
   * componentWillUpdate is not called on the first render.
   */
  componentWillUpdate() {
    console.log('Component will update and re-render');
  }

  /**
   * The component has just re-rendered.
   *
   * Called multiple times throughout the life of
   * the component as it updates.
   *
   * componentDidUpdate is not called on the
   * first render.
   */
  componentDidUpdate() {
    console.log('Component did update');
  }

  /**
   * The component did unload and the element
   * will be destroyed.
   */
  componentDidUnload() {
    console.log('Component removed from the DOM');
  }
}
