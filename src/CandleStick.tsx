import * as d3 from "d3";
import { MutableRefObject, useEffect, useRef } from 'react';

interface size {
    width: number,
    height: number
}

interface CandleStickProps {
    size: size
}

function parseData(data: any) {
    let newData: any = [];
    data.forEach(function (val: any, index: any) {

        let obj: any = {}
        obj["openTime"] = val.time;
        obj["open"] = val.open;
        obj["high"] = val.high;
        obj["low"] = val.low
        obj["close"] = val.close
        obj["volume"] = val.volume
        newData.push(obj);
    })

    return newData;

}

function drawChart(props: CandleStickProps, chartRef: any, data: any) {

    data = parseData(data).reverse(); // parse and reverse data to get chronological order
    let dates = data.map(function (d: any) {
        return new Date(d['openTime']);
    });

    const margin = { top: 35, right: 65, bottom: 35, left: 65 };

    // setting width and height
    const width = props.size.width;
    const height = props.size.height;
    const svg = d3.select(chartRef.current)
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)

    // parent g is used to translate the whole chart within svg
    const parentG = svg.append("g")
                       .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                       .attr('pointer-events', 'none')

    // create x-axis group
    const xScaleForCandles = d3.scaleLinear()
                               .domain([0, dates.length])
                               .range([0, width])

    const xBand = d3.scaleBand().domain(dates).range([0, width])

    let timef: any = d3.timeFormat("%H:%M");
    const xAxis = d3.axisBottom(xBand) // use scale
                    .tickFormat(timef) // format label of ticks


    const xAxisG = parentG.append("g")
                          .attr("transform", `translate(0,${height})`)
                          .call(xAxis);

    // create y-axis group
    let minValue: any = d3.min(data, (d: any) => d.low);
    let maxValue: any = d3.max(data, (d: any) => d.high);
    const yScale = d3.scaleLinear() // scale linear
        .domain([minValue, maxValue]) // domain values from data min of Low and max of high
        .range([height, 0])  // map domain to this range
        .nice()

    const yAxis = d3.axisLeft(yScale) // use scale

    const yAxisG = parentG.append("g")
                          .call(yAxis)
                          .call(g => g.selectAll(".tick line").clone() // adding the tick lines
                                      .attr("stroke-opacity", 0.2)
                                      .attr("x2", width))
                          .call(g => g.select(".domain").remove()) // removing the y-axis line

    // candles
    const g = parentG.append("g")
                     .attr("class", "chartBody")

    const candles = g.selectAll()
                     .data(data)
                     .enter()
                     .append("rect") // create rect
                     .attr("x", (d, i) => xScaleForCandles(i) + xBand.bandwidth()/4) // position of x, depends on width of candles
                     .attr("y", (d: any) => yScale(Math.max(d.open, d.close)))
                     .attr("width", xBand.bandwidth()/2) // width of candles, affects the position x of candle
                     .attr("height", (d: any) => (d.open === d.close) ? 1 : (yScale(Math.min(d.open, d.close)) - yScale(Math.max(d.open, d.close))))
                     .attr("fill", (d: any) => (d.open === d.close) ? "silver" : (d.open > d.close) ? "red" : "green")

    // candle wicks
    const candleWicks = g.selectAll("g.line")
                         .data(data)
                         .enter()
                         .append("line")
                         .attr("x1", (d, i) => xScaleForCandles(i)+ xBand.bandwidth()/2)
                         .attr("x2", (d, i) => xScaleForCandles(i)+ xBand.bandwidth()/2)
                         .attr("y1", (d: any) => yScale(d.high))
                         .attr("y2", (d: any) => yScale(d.low))
                         .attr("stroke", (d: any) => (d.open === d.close) ? "white" : (d.open > d.close) ? "red" : "green");


    // mouse move function
    const mmove = (event: any) => {
        let m = d3.pointer(event);
        // set position and visiblity of line along y
        d3.select(".mouse-line-y").style("opacity", "1")
            .attr("x1", event.clientX - margin.left)
            .attr("y1", height)
            .attr("x2", event.clientX- margin.left)
            .attr("y2", "0")

        // set position and visiblity pf line along x
        d3.select(".mouse-line-x").style("opacity", "1")
        .attr("x1", width)
        .attr("y1", event.clientY - margin.top)
        .attr("x2", "0")
        .attr("y2", event.clientY - margin.top)

        // set position and visiblity of price value text
        const f = d3.format(".2f");
        d3.select(".price-value-y").style("opacity", "1")
        .attr("transform", `translate(-${margin.left},${event.clientY - margin.top})`)
        .text(f(yScale.invert(m[1])))
    }

    // mouse events
    const mouseG = parentG.append("g").attr("class", "mouse-events");
    // creating rect to capture mouse events.
    // <g> does not capture mouse events
    mouseG.append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr('pointer-events', 'all')
    .on('mousemove', mmove)
    .on('mouseout', () => {
        d3.select(".mouse-line-x").style("opacity", "0");
        d3.select(".mouse-line-y").style("opacity", "0");
        d3.select(".price-value-y").style("opacity", "0");
    });

    // creating the y line
    mouseG.append("line")
    .attr("class", "mouse-line-y")
    .attr("x1", "0")
    .attr("x2", "400")
    .attr("y1", "0")
    .attr("y2", "400")
    .style("opacity", "0")
    .style("stroke", "black")
    .style("stroke-dasharray", ("5"))

    // creating the x line and price value
    const mouseGX = mouseG.append("g").attr("class", "mouseGX");
    mouseGX.append("line")
    .attr("class", "mouse-line-x")
    .attr("x1", "0")
    .attr("x2", "400")
    .attr("y1", "0")
    .attr("y2", "400")
    .style("opacity", "0")
    .style("stroke", "black")
    .style("stroke-dasharray", ("5"))
    mouseGX.append("text")
    .attr("class", "price-value-y")
    .style("opacity", "0")
    .style("font-size", "10px")
}

function CandleStick(props: CandleStickProps) {
    const chartRef: MutableRefObject<null> = useRef(null);
    useEffect(() => {
        d3.json("/data/data.json")
            .then(function (data) {
                drawChart(props, chartRef, data);
            })
            .catch(function (error) {
                console.log(error);
            })
    });

    return <svg ref={chartRef}></svg>
}

export default CandleStick;