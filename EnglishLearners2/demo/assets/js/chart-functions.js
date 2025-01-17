// Sankey chart

function sankeyChart() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 650,
		marginTop = 20,
		marginLeft = 20,
		marginBottom = 20,
		barWidth = 15,
		animateTime = 1000,
		title = "Generic chart title. Update me using .title()!",
		altText = "Fill in alt text for screen readers!",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
				formatPercent = d3.format(",.1%"),
				color = d3.scale.category20();

		// margins; adjust width and height to account for margins

		var width = parseInt(d3.select("#" + sectionID).style("width"), 10);

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

		// chart title

		d3.select(this).append("div")
			.attr("class", "title")
			.text(title);

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID)
			.attr("width", width);

		var svg = dom.append("svg")
			.attr("class", "sankey-chart")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText);

			// tooltips using d3-tip

			var tipSegment = d3.tip()
				.attr("class", "d3-tip")
				.direction("n")
				.offset([-5, 0])
				.html(function(d) {

				return d.name + "<br/>" + formatNumber(d.value) + " students"/*)"*/;

			});

			var tipLink = d3.tip()
				.attr("class", "d3-tip")
				.direction("n")
				.offset(function() { return [this.getBBox().height / 2, 0] })
				.html(function(d) {

					if (d.source_abbr == "ELs") { return d.source_abbr + ": " + d.target.name + ", " + formatNumber(d.value) + " students<br/>" + formatPercent(d.pct) + " of " + d.source_abbr + " with disabilities<br/>" + formatPercent(d.pct_of_dis) + " of all students with " + d.target.name.toLowerCase(); }
					else if (d.source_abbr == "Non-ELs") { return d.source_abbr + ": " + d.target.name + ", " + formatNumber(d.value) + " students<br/>" + formatPercent(d.pct) + " of " + d.source_abbr[0].toLowerCase() + d.source_abbr.substring(1) + " with disabilities<br/>" + formatPercent(d.pct_of_dis) + " of all students with " + d.target.name.toLowerCase(); };

			});

			svg.call(tipSegment);
			svg.call(tipLink);

		// set sankey diagram properties

		var sankey = d3.sankey()
			.nodeWidth(10)
			.nodePadding(15)
			.size([widthAdj, heightAdj]);

		var path = sankey.link();

		// set up graph

		graph = {"nodes" : [], "links" : []};

			data.forEach(function(d) {
				graph.nodes.push({ "name": d.source });
				graph.nodes.push({ "name": d.target });
				graph.links.push({
					"source": d.source,
					"target": d.target,
					"value": +d.value,
					"pct": +d.pct,
					"pct_of_dis": +d.pct_of_dis,
					"source_abbr": d.source_abbr
				});
			});

			// return distinct/unique nodes

			graph.nodes = d3.keys(d3.nest()
				.key(function(d) { return d.name; })
				.map(graph.nodes));

					// loop through each link replacing the text with its index from node
		      graph.links.forEach(function (d, i) {
		        graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
		        graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
		      });

		      //now loop through each nodes to make nodes an array of objects
		      // rather than an array of strings
		      graph.nodes.forEach(function (d, i) {
		        graph.nodes[i] = { "name": d };
		      });

		   sankey
		     .nodes(graph.nodes)
		     .links(graph.links)
		     .layout(32);

		 // add in the links
		   var link = svg.append("g").selectAll(".link")
		       .data(graph.links)
		     .enter().append("path")
		       .attr("class", "link")
		       .attr("d", path)
		       .style("stroke-width", function(d) { return Math.max(1, d.dy); })
		       .sort(function(a, b) { return b.dy - a.dy; })
					 .on("mouseover", tipLink.show)
					 .on("mouseout", tipLink.hide);;

		 // add the link titles
		   /*link.append("title")
		         .text(function(d) {
		     		return d.source.name + " → " +
		                 d.target.name + "\n" + formatNumber(d.value); });*/

		 // add in the nodes
		   var node = svg.append("g").selectAll(".node")
		       .data(graph.nodes)
		     .enter().append("g")
		       .attr("class", "node")
		       .attr("transform", function(d) {
		 		  return "translate(" + d.x + "," + d.y + ")"; })
		     .call(d3.behavior.drag()
		       .origin(function(d) { return d; })
		       .on("dragstart", function() {
		 		  this.parentNode.appendChild(this); })
		       .on("drag", dragmove));

		 // add the rectangles for the nodes
		   node.append("rect")
		       .attr("height", function(d) { return d.dy; })
		       .attr("width", sankey.nodeWidth())
		       .style("fill", function(d) {
		 		  return d.color = color(d.name.replace(/ .*/, "")); })
		       .style("stroke", function(d) {
		 		  return d3.rgb(d.color).darker(2); })
					.on("mouseover", tipSegment.show)
					.on("mouseout", tipSegment.hide);

		 // add in the title for the nodes
		   node.append("text")
		       .attr("x", -6)
		       .attr("y", function(d) { return d.dy / 2; })
		       .attr("dy", ".25em")
		       .attr("text-anchor", "end")
		       .attr("transform", null)
		       .text(function(d) { return d.name; })
		     .filter(function(d) { return d.x < width / 2; })
		       .attr("x", 6 + sankey.nodeWidth())
		       .attr("text-anchor", "start");

		 // the function for moving the nodes
		   function dragmove(d) {
		     d3.select(this).attr("transform",
		         "translate(" + d.x + "," + (
		                 d.y = Math.max(0, Math.min(heightAdj - d.dy, d3.event.y))
		             ) + ")");
		     sankey.relayout();
		     link.attr("d", path);
		   }

			 // add text

			 svg.append("text")
	 			.attr("class", "x axis")
	 			.attr("x", widthAdj)
	 			//.attr("dx", "0.5em")
	 			.attr("y", heightAdj)
	 			.attr("dy", "1.5em")
	 			.attr("text-anchor", "end")
	 			.attr("aria-hidden", "true")
	 			.text("STUDENTS WITH DISABILITIES IN 2014–15");

				// notes and sources

				function writeNotes() {
					if (!notes) {}
					else {

						d3.select("#"+ sectionID).append("div")
								.attr("id", "notes" + chartID)
								.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

					};
				};

				writeNotes();

				function writeSource() {
					if (!source) {}
					else {
						d3.select("#"+ sectionID).append("div")
							.attr("id", "notes" + chartID)
							.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
					};
				};

				writeSource();

			 // resize

			window.addEventListener("resize", function() {

				// update width

				width = parseInt(d3.select("#" + sectionID).style("width"), 10);
				widthAdj = width - marginLeft - margin.right;

				// resize chart

				d3.select("#" + sectionID)
					.classed("activated", null)

				dom.selectAll(".sankey-chart")
					.attr("width", width);

				dom.select("text.x.axis")
					.attr("x", widthAdj)
					.attr("dx", "0.5em");

				// move nodes

			  sankey.size([widthAdj, heightAdj])
					.nodes(graph.nodes)
				 	.links(graph.links)
					.layout(32);

				svg.selectAll(".node")
					.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

				svg.selectAll(".link")
					.attr("d", path);

			});

		 });

	};

  chart.height = function(value) {

      if (!arguments.length) return height;
      height = value;
      return chart;

  };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.barWidth = function(value) {

		if (!arguments.length) return barWidth;
		barWidth = value;
		return chart;

	};

	chart.title = function(value) {

		if (!arguments.length) return title;
		title = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.notes = function(value) {

		if (!arguments.length) return notes;
		notes = value;
		return chart;

	};

	chart.source = function(value) {

		if (!arguments.length) return source;
		source = value;
		return chart;

	};

	chart.caption = function(value) {

		if (!arguments.length) return caption;
		caption = value;
		return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		width = parseInt(d3.select("#" + sectionID).style("width"), 10);
		return chart;

	};

  chart.data = function(value) {

      if (!arguments.length) return data;
      data = value;
      return chart;

  };

	return chart;

};

// Counter function

function counter() {

	// Options accessible to the caller
	// These are the default values

	var	animateTime = 1000,
		caption = "Fill in caption using .caption().",
		altText = "Fill in alt text using .altText().",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
			formatPercent = d3.format(",%");

		// First half

		var counterDiv = d3.select("#counter");

		counterDiv.append("div")
			.style("text-align", "left")
			.html("<h2 id='overCount'>OVER </h2>");

		counterDiv.append("div")
			.html("<hr style='opacity: 0'>");

		/* Second half */

		var counterDiv2 = counterDiv.append("div")
			.style("text-align", "left")
			.style("display", "table-row");

		counterDiv2.append("div")
			.style("width", "200px")
			.style("height", "200px")
			.style("display", "inline-block")
			.append("div")
				.attr("id", "cd2_left")
				.style("width", "200px")
				.style("height", "200px")
				.style("display", "table-row");

		counterDiv2.append("div")
			.style("width", "70%")
			.style("height", "200px")
			.style("display", "inline-block")
			.style("margin-left", "10px")
			.append("div")
				.attr("id", "cd2_right")
				//.style("width", "600px")
				.style("height", "200px")
				.style("display", "table-row");

		var donut = d3.select("#cd2_left")
			.append("div")
				.attr("id", "donut")
				.attr("overflow", "hidden")
				.style("display", "table-cell")
				.style("vertical-align", "middle")
				.style("width", "200px")
				.style("height", "200px")
				//.style("display", "inline-block");

		var width = parseInt(d3.select("#donut").style("width"), 10),
			height = width;

		var margin = {top: 0, right: 20, bottom: 0, left: 0},
			widthAdj = width - margin.right - margin.left,
			heightAdj = height - margin.top - margin.bottom;

		var svg = donut.append("svg")
			.attr("class", "donut")
				.attr("width", width)
				.attr("height", height)
				.attr("aria-label", altText)
				.append("g")
					.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

		var radius = Math.min(widthAdj/2, heightAdj/2);

		var arc = d3.svg.arc()
			.outerRadius(radius - 0)
			.innerRadius(radius/1.5)
			.startAngle(function(d) { return d.startAngle + Math.PI*2;	})
			.endAngle(function(d) { return d.endAngle + Math.PI*2; });

		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d) { return d.pct; });

		var arc1 = d3.svg.arc()
			.outerRadius(radius - 0)
			.innerRadius(radius/1.5);

		// draw arcs

		var donutText = d3.select("#cd2_right")
			.append("div")
			.data(data)
				.attr("id", "donutText")
				.style("display", "table-cell")
				.style("vertical-align", "middle")
				.style("margin-left", "0px")
				.style("width", "70%")
				.style("height", "200px")
				.style("text-align", "left")
				.style("opacity", 0)
				//.style("display", "inline-block");

		donutText.append("text")
			.html("<p style='font-size: 18px;'>ELs represent</p><h2></h2>");

		donutText.select("h2")
			.append("text")
			.html(function(d) { return formatPercent(d.pct) + " of the total K–12 student population.<sup style='font-size: 13px; vertical-align:top;'>a, b</sup></div>"; })

		// counter function

		var counterValue = 0;

		counterDiv.select("h2")
			.append("text")
				.text(counterValue);

		$("#overCount").append("<br><span>English learners (ELs) were enrolled in schools in 2014–15.<sup>a</sup></span>");

		function countUp(text, duration) {
			text.transition()
				.duration(duration)
				.ease("linear")
				.tween("text", function() {

					var	formatNumber = d3.format(",f");
					var i = d3.interpolate(counterValue, 4800000);

					return function(t) {
						d3.select(this).text(formatNumber(i(t)));
						counterValue = i(t);
					};

				})
				.each("end", function() {
					counterDiv.select("hr")
						.transition()
							.duration(animateTime)
							.style("opacity", 1)
							.each("end", function() {

								svg.append("circle")
									.attr("r", radius)
									.attr("stroke", "white")
									.attr("stroke-width", "1.5px")
									.attr("fill", "none")
									.style("opacity", 0);

								svg.append("circle")
									.attr("r", radius/1.5)
									.attr("stroke", "white")
									.attr("stroke-width", "1.5px")
									.attr("fill", "none")
									.style("opacity", 0);

								svg.selectAll("circle")
									.transition()
										.duration(animateTime)
										.style("opacity", 1)
										.each("end", function(d) {
											svg.selectAll(".arc")
												.data(pie(data))
												.enter()
													.append("g")
														.attr("class", function(d, i) { return "arc segment" + i; })
														.append("path")
															.transition()
																.duration(animateTime)
																.delay(function(d, i) { return i * animateTime; })
																.attrTween("d", function(d) {

																	var i = d3.interpolate(d.startAngle, d.endAngle);
																	return function(t) { d.endAngle = i(t); return arc(d); }

																})
																.each("end", function() {

																	d3.select("#donutText")
																		.transition()
																			.duration(animateTime)
																			.style("opacity", 1);
																});
										});
							});
					});
		};

		// activate on scroll

		var gs = graphScroll()
			.container(d3.select("#intro_chart"))
			.graph(d3.selectAll("#counter"))
			.sections(d3.selectAll("#intro_sections > div"))
			.on("active", function() {

				if (document.getElementById("counter_pre").className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById("counter_pre").className.indexOf("graph-scroll") >= 0) {

				d3.select("#counter")
					.classed("activated", "true");

				d3.select("#counter > div > h2")
					.selectAll("text")
					.call(countUp, 2.5 * animateTime);

			}});


		});

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.caption = function(value) {

		if (!arguments.length) return caption;
		caption = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		width = parseInt(d3.select("#" + sectionID).style("width"), 10);
		return chart;

	};

    chart.data = function(value) {

        if (!arguments.length) return data;
        data = value;
        return chart;

    };

	return chart;

};

// Bar chart function

function barChart() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 650,
		marginTop = 20,
		marginLeft = 100,
		marginBottom = 45,
		barWidth = 15,
		animateTime = 1000,
		title = "Generic chart title. Update me using .title()!",
		altText = "Fill in alt text for screen readers!",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
			formatPercent = d3.format(",.1%");

		// margins; adjust width and height to account for margins

		var width = parseInt(d3.select("#" + sectionID).style("width"), 10);

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

		// chart title

		d3.select(this).append("div")
			.attr("class", "title")
			.text(title);

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID)
			.attr("width", width);

		var svg = dom.append("svg")
			.attr("class", "bar-chart")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText);

		// tooltips using d3-tip

		var tipBar = d3.tip()
			.attr("class", "d3-tip")
			.direction("e")
			.offset([0, 10])
			.html(function(d) {

			return formatPercent(d.pct) + " (" + formatNumber(d.num) + " students)";


		});

		svg.call(tipBar);

		// axis scales

		var xScale = d3.scale.linear().range([0, widthAdj]),
			yScale = d3.scale.ordinal().range([heightAdj, 0]).rangeRoundBands([0, heightAdj], 0.5);

		// domains

		function xDomain() {
			if (window.innerWidth <= 736) { xScale.domain([0, d3.max(data, function(d) { return d.pct; })]).nice() }
			else { xScale.domain([0, 1]); }
		};
		xDomain();
		yScale.domain(data.map(function(d) { return d.group; }));

		// axes

		function formatValueAxis(d) {

			var TickValue = formatNumber(d * 100);

			return TickValue;

		};

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(formatValueAxis).tickSize(-1 * heightAdj).ticks(Math.max(widthAdj/100, 2)),
			yAxis = d3.svg.axis().scale(yScale).orient("left").outerTickSize(0);

		// draw x-axis below bars

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)

		svg.append("text")
			.attr("class", "x axis")
			.attr("x", widthAdj)
			.attr("dx", "0.5em")
			.attr("y", heightAdj)
			.attr("dy", "3.1em")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.text("% OF ENGLISH LEARNERS IN 2014–15");

		// draw bars

		var bars = svg.selectAll("rect.bar")
			.data(data);

		bars.enter()
			.append("g")
				.attr("transform", "translate(0,0)")
				.append("rect")
					.attr("class", function(d) {
						if (d.group == "Overall") { return "overallBar"; }
						else { return "bar"; }
					})
					.attr("x", 0)
					.attr("width", 0)
					.attr("y", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2) - (barWidth/2); })
					.attr("height", barWidth)
					.on("mouseover", tipBar.show)
					.on("mouseout", tipBar.hide)
					.append("aria-label")
						.text(function(d) { return "In 2014–15, " + formatPercent(d.pct) + ", or " + formatNumber(d.num) + " of preschool-aged " + d.group + " were enrolled in preschool."; });

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					svg.selectAll("rect")
						.transition()
						.duration(animateTime)
						.attr("width", function(d) { return xScale(d.pct); });

			}});

		// draw y-axis above bars

		svg.append("g")
			.attr("class", "y axis")
			.attr("aria-hidden", "true")
			.call(yAxis)

		// notes and sources

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// resize

		window.addEventListener("resize", function() {

			// update width

			width = parseInt(d3.select("#" + sectionID).style("width"), 10);
			widthAdj = width - marginLeft - margin.right;

			// resize chart

			xScale.range([0, widthAdj]);
			xDomain();
			xAxis.ticks(Math.max(widthAdj/100, 2));

			d3.select("#" + sectionID)
				.classed("activated", null)

			dom.selectAll(".bar-chart")
				.attr("width", width);

			svg.select(".x.axis")
				.call(xAxis);

			svg.select("text.x.axis")
				.attr("x", widthAdj)
				.attr("dx", "0.5em");

			svg.selectAll("rect")
				.attr("width", 0);

			var gs2 = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					svg.selectAll("rect")
						.transition()
						.duration(animateTime)
						.attr("width", function(d) { return xScale(d.pct); });

			}});

		});

		});

	};

  chart.height = function(value) {

      if (!arguments.length) return height;
      height = value;
      return chart;

  };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.barWidth = function(value) {

		if (!arguments.length) return barWidth;
		barWidth = value;
		return chart;

	};

	chart.title = function(value) {

		if (!arguments.length) return title;
		title = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.notes = function(value) {

		if (!arguments.length) return notes;
		notes = value;
		return chart;

	};

	chart.source = function(value) {

		if (!arguments.length) return source;
		source = value;
		return chart;

	};

	chart.caption = function(value) {

		if (!arguments.length) return caption;
		caption = value;
		return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		width = parseInt(d3.select("#" + sectionID).style("width"), 10);
		return chart;

	};

  chart.data = function(value) {

      if (!arguments.length) return data;
      data = value;
      return chart;

  };

	return chart;

};

// Small multiples bar charts

function smBarChart() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 650,
		marginTop = 20,
		marginLeft = 100,
		marginBottom = 45,
		barWidth = 15,
		chartsPerRow = 3, // Charts per row
		animateTime = 1000,
		catdefs = 0,
		axisdefs = 0,
		title = "Generic chart title. Update me using .title()!",
		altText = "Fill in alt text for screen readers!",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
				formatPercent = d3.format(",%");

		// margins; adjust width and height to account for margins

		var width = Math.floor(parseInt(d3.select("#" + sectionID).style("width"), 10)/chartsPerRow);

		function checkMinWidth() {
			if (width < 275) { width = 275; }
			else { return width; };
		};

		checkMinWidth();

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

		// chart title

		d3.select(this).append("div")
			.attr("class", "title")
			.text(title);

		// nest data by level

		dataNest = d3.nest()
			.key(function(d) { return d.level; })
			.entries(data);

		// color scales

		var color = d3.scale.ordinal()
			//.domain([function(d) { return d.key; }])
			.range(["#5D42A6", "#A6426C", "#C07A98"]);

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID)
			.attr("width", width)
			.style("text-align", "center");

		dom.append("p");

		var chartDivs = dom.selectAll("div.smChartDiv")
			.data(dataNest);

		chartDivs.enter()
			.append("div")
				.attr("class", "smChartDiv")
				.attr("width", width)
				//.style("max-width", width)
				.style("display", "inline-block");

		chartDivs.append("div")
			.attr("class", "smTitleDiv")
			.style("color", function(d) { return color(d.key); })
			.text(function(d) { return d.key; });

		chartDivs.append("div")
			.attr("class", "smSubTitleDiv")
			.style("color", function(d) { return color(d.key); })
			.text(function(d) {

				if (d.key == "Districts" && d.values[0].chartlevel == "Districts") { return "% of " + d.key.toLowerCase() + " in each concentration category"; }
				if (d.key == "ELs" && d.values[0].chartlevel == "Districts") { return "% of " + d.key + " in each district category"; }
				if (d.key == "All students" && d.values[0].chartlevel == "Districts") { return "% of " + d.key.toLowerCase() + " in each district category"; }
				if (d.key == "Schools" && d.values[0].chartlevel == "Schools") { return "% of " + d.key.toLowerCase() + " in each concentration category"; }
				if (d.key == "ELs" && d.values[0].chartlevel == "Schools") { return "% of " + d.key + " in each school category"; }
				if (d.key == "All students" && d.values[0].chartlevel == "Schools") { return "% of " + d.key.toLowerCase() + " in each school category"; }

			});

		var svg = chartDivs.append("svg")
			.data(dataNest)
			.attr("class", "smBarChart")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText);

		// tooltips using d3-tip

		var tipBar = d3.tip()
			.attr("class", "d3-tip")
			.direction("e")
			.offset([0, 10])
			.html(function(d) {

			return d.level + ": " + formatPercent(d.pct);

		});

		var tipDefs = d3.tip()
			.attr("class", "d3-tip")
			.style("max-width", "400px")
			.direction("e")
			.offset([0, 10])
			.html(function(d) {	return d.definition; });

		svg.call(tipBar);
		svg.call(tipDefs);

		// axis scales

		var xScale = d3.scale.linear().range([0, widthAdj]),
			yScale = d3.scale.ordinal().range([heightAdj, 0]).rangeRoundBands([0, heightAdj], 0.5);

		// domains

		function xDomain() {
			if (window.innerWidth <= 736) { xScale.domain([0, d3.max(data, function(d) { return d.pct; })]).nice() }
			else { xScale.domain([0, 1]); }
		};
		xDomain();
		yScale.domain(data.map(function(d) { return d.group; }));

		// axes

		function formatValueAxis(d) {

			var TickValue = formatNumber(d * 100);

			return TickValue;

		};

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(formatValueAxis).tickSize(-1 * heightAdj).ticks(Math.max(widthAdj/100, 2)),
			yAxis = d3.svg.axis().scale(yScale).orient("left").outerTickSize(0);

		// draw x-axis below bars

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)

		svg.append("text")
			.attr("class", "x axis")
			.attr("x", widthAdj)
			.attr("dx", "0.5em")
			.attr("y", heightAdj)
			.attr("dy", "3.1em")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.text(function(d) { return "% OF " + d.key.toUpperCase() + " IN 2014–15"; });

		// draw bars

		var bars = svg.selectAll("rect.bar")
			.data(function(d) { return d.values; });

		bars.enter()
			.append("g")
				.attr("transform", "translate(0,0)")
				.append("rect")
					.attr("class", function(d) {
						if (d.group == "Overall") { return "overallBar"; }
						else { return "bar"; }
					})
					.attr("x", 0)
					.attr("width", 0)
					.attr("y", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2) - (barWidth/2); })
					.attr("height", barWidth)
					.style("fill", function(d) { return color(d.level); })
					.on("mouseover", tipBar.show)
					.on("mouseout", tipBar.hide)
					.append("aria-label")
						.text(function(d) {
							if (d.level == "LEAs") { return "In 2014–15, " + formatPercent(d.pct) + " of " + d.level + " had " + d.group + " concentrations of ELs."; }
							else { return "In 2014–15, " + formatPercent(d.pct) + " of " + d.level + " were in " + d.chartlevel + " with " + d.group + " concentrations of ELs."; }
						});

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					svg.selectAll("rect")
						.transition()
						.duration(animateTime)
						.attr("width", function(d) { return xScale(d.pct); });

			}});

		// draw y-axis above bars

		svg.append("g")
			.attr("class", "y axis")
			.attr("aria-hidden", "true")
			.call(yAxis)

		function catDefTips() {
			if (catdefs == 1) {
				svg.selectAll(".y.axis .tick")
					.data(function(d) { return d.values; })
					.on("mouseover", tipDefs.show)
					.on("mouseout", tipDefs.hide);
			}
			else if (catdefs == 0) { };
		};

		catDefTips();

		function axisDefCheck() {
			if (axisdefs == 1) {
				svg.selectAll(".y.axis .tick")
					.selectAll("text")
					.attr("dy", "-0.25em");

				svg.selectAll(".y.axis .tick")
					.data(function(d) { return d.values; })
					.append("text")
						.attr("class", "def_tick")
						.attr("x", -9)
						.attr("dy", "0.75em")
						.attr("text-anchor", "end")
						.text(function(d) { return d.definition; });
			}
			else if (axisdefs == 0) { };
		}

		axisDefCheck();

		// notes

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// add space below charts

		chartDivs.append("p");

		// resize

		window.addEventListener("resize", function() {

			// update width

			width = Math.floor(parseInt(d3.select("#" + sectionID).style("width"), 10)/chartsPerRow);

			checkMinWidth();

			widthAdj = width - marginLeft - margin.right;

			// resize chart

			xScale.range([0, widthAdj]);
			xDomain();
			xAxis.ticks(Math.max(widthAdj/100, 2));

			d3.select("#" + sectionID)
				.classed("activated", null)

			dom.selectAll(".smChartDiv")
				.attr("width", width);

			dom.selectAll(".smBarChart")
				.attr("width", width);

			svg.select(".x.axis")
				.call(xAxis);

			svg.select("text.x.axis")
				.attr("x", widthAdj)
				.attr("dx", "0.5em");

			svg.selectAll("rect")
				.attr("width", 0);

			var gs2 = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					svg.selectAll("rect")
						.transition()
						.duration(animateTime)
						.attr("width", function(d) { return xScale(d.pct); });

			}});

		});

		});

	};

  chart.height = function(value) {

        if (!arguments.length) return height;
        height = value;
        return chart;

    };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.catdefs = function(value) {

		if (!arguments.length) return catdefs;
		catdefs = value;
		return chart;

	};

	chart.axisdefs = function(value) {

		if (!arguments.length) return axisdefs;
		axisdefs = value;
		return chart;

	};

	chart.barWidth = function(value) {

		if (!arguments.length) return barWidth;
		barWidth = value;
		return chart;

	};

	chart.chartsPerRow = function(value) {

		if (!arguments.length) return chartsPerRow;
		chartsPerRow = value;
		return chart;

	};

	chart.title = function(value) {

		if (!arguments.length) return title;
		title = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.notes = function(value) {

		if (!arguments.length) return notes;
		notes = value;
		return chart;

	};

	chart.source = function(value) {

			if (!arguments.length) return source;
			source = value;
			return chart;

		};

	chart.caption = function(value) {

		if (!arguments.length) return caption;
		caption = value;
		return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		//width = parseInt(d3.select("#" + sectionID).style("width"), 10);
		return chart;

	};

  chart.data = function(value) {

    if (!arguments.length) return data;
    data = value;
    return chart;

  };

	return chart;

};

// Column chart function

function colChart() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 500,
		marginTop = 60,
		marginLeft = 20,
		marginBottom = 20,
		animateTime = 1000,
		colWidth = 15,
		yMax = 1,
		yAxisLabel = "",
		title = "Generic chart title. Update me using .title()!",
		altText = "Fill in alt text for screen readers!",
		subgroup = "",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
			formatPercent = d3.format(",.1%");

		// margins; adjust width and height to account for margins

		width = parseInt(d3.select("#" + sectionID).style("width"), 10);

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right;
			/*heightAdj = height - marginTop - marginBottom;*/

		// chart title

		d3.select(this).append("div")
			.attr("class", "title")
			.text(title);

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID);

		var svg = dom.append("svg")
			.attr("class", "col-chart")
			.attr("width", width - margin.right)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText);

		// tooltips using d3-tip

		var tipCol = d3.tip()
			.attr("class", "d3-tip")
			.offset([-10, 0])
			.html(function(d) {

			return formatPercent(d.pct) + " (" + formatNumber(d.num) + " students)";

		});

		svg.call(tipCol);

		// axis scales

		var xScale = d3.scale.ordinal().rangeRoundBands([0, widthAdj], .5);
			/*yScale = d3.scale.linear().range([heightAdj, 0]);*/

		// domains

		xScale.domain(data.map(function(d, i) { return d.group; }));

		// axes

		function formatValueAxis(d) {
			var TickValue = formatNumber(d * 100);
			return TickValue;
		};

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom").outerTickSize(0);

		// draw x-axis above columns

		svg.append("g")
			.attr("class", "x axis")
			/*.attr("transform", "translate(0," + heightAdj + ")")*/
			.attr("aria-hidden", "true")
			.call(xAxis)
			.selectAll(".tick text")
				.call(wrap, xScale.rangeBand());

		// figure out max number of tspans from wrapping

		var tspanMax;

		function tspanMaxCount() {

			// find all tspans within the chart

			var tspans = document.getElementById(chartID).getElementsByTagName("tspan");

			// nest the tspans by the label

			var tspanNest = d3.nest()
				.key(function(d) { return d.__data__; })
				.entries(tspans);

			// find maximum length of the nested tspans

			tspanMax = d3.max(tspanNest, function(d) { return d.values.length; });

		}

		tspanMaxCount();

		var marginBottomAdj;

		function marginBottomAdjustment() {
			marginBottomAdj = tspanMax * marginBottom;
		};

		marginBottomAdjustment();

		var heightAdj = height - marginTop - marginBottomAdj;

		svg.selectAll(".x.axis").remove();

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)
			.selectAll(".tick text")
				.call(wrap, xScale.rangeBand());

		// y axis

		var yScale = d3.scale.linear().range([heightAdj, 0]).domain([0, yMax]);
		var yAxis = d3.svg.axis().scale(yScale).orient("left").tickFormat(formatValueAxis).tickSize(-1 * widthAdj).ticks(Math.max(heightAdj/100, 2));

		svg.append("g")
			.attr("class", "y axis")
			.attr("aria-hidden", "true")
			.call(yAxis);

		svg.append("text")
			.attr("class", "y axis")
			.attr("x", -15)
			.attr("y", "-2.1em")
			.attr("aria-hidden", "true")
			.attr("text-anchor", "start")
			.text(yAxisLabel);

		// draw columns

		var cols = svg.selectAll("rect.column")
			.data(data);

		cols.enter()
			.append("g")
				.attr("transform", "translate(0,0)")
				.append("rect")
					.attr("class","column")
					.attr("x", function(d, i) { return xScale(d.group) + (xScale.rangeBand() / 2) - (colWidth / 2); })
					.attr("width", colWidth)
					.attr("y", heightAdj)
					.attr("height", 0)
					.on("mouseover", tipCol.show)
					.on("mouseout", tipCol.hide)
					.append("aria-label")
						.text(function(d) { return "In 2013–14, " + formatPercent(d.pct) + " of " + d.group + ", or " + formatNumber(d.num) + ", were " + d.level + "."; });

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {
				if (document.getElementById(sectionID).className == "graph-scroll-active") {

					svg.selectAll("rect.column")
						.transition()
							.duration(animateTime)
							.attr("height", function(d) { return heightAdj - yScale(d.pct); })
							.attr("y", function(d) { return yScale(d.pct); });

			}});

		// redraw x axis above bars

		svg.selectAll(".x.axis").remove();

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)
			.selectAll(".tick text")
				.call(wrap, xScale.rangeBand());

		// notes and sources

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// resize

		window.addEventListener("resize", function() {

			// update width

			width = parseInt(d3.select("#" + sectionID).style("width"), 10);
			widthAdj = width - marginLeft - margin.right;

			// resize chart

			xScale.rangeRoundBands([0, widthAdj], .5);
			yAxis.tickSize(-1 * widthAdj);

			dom.selectAll(".col-chart")
				.attr("width", width - margin.right);

			svg.select(".x.axis")
				.call(xAxis)
				.selectAll(".tick text")
					.call(wrap, xScale.rangeBand());

			tspanMaxCount();
			marginBottomAdjustment();

			// redraw the x-axis based on new bottom margin

			heightAdj = height - marginTop - marginBottomAdj;

			dom.selectAll(".x.axis")
				.remove();

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + heightAdj + ")")
				.attr("aria-hidden", "true")
				.call(xAxis)
				.selectAll(".tick text")
					.call(wrap, xScale.rangeBand());

			// redraw the y axis

			yScale.range([heightAdj, 0]);

			dom.selectAll(".y.axis")
				.remove();

			svg.append("g")
				.attr("class", "y axis")
				.attr("aria-hidden", "true")
				.call(yAxis);

			svg.selectAll("rect.column")
				.attr("x", function(d, i) { return xScale(d.group) + (xScale.rangeBand() / 2) - (colWidth / 2); })
				.attr("height", 0)
				.attr("y", heightAdj);

			var gs2 = graphScroll()
				.container(d3.select("#" + containerID))
				.graph(d3.selectAll("#" + chartID))
				.sections(d3.selectAll("#" + subcontainerID + " > div"))
				.on("active", function() {
					if (document.getElementById(sectionID).className == "graph-scroll-active") {

						svg.selectAll("rect.column")
							.transition()
								.duration(animateTime)
								.attr("height", function(d) { return heightAdj - yScale(d.pct); })
								.attr("y", function(d) { return yScale(d.pct); });

				}});

		});

		});

	};

  chart.height = function(value) {

      if (!arguments.length) return height;
      height = value;
      return chart;

  };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.yMax = function(value) {

		if (!arguments.length) return yMax;
		yMax = value;
		return chart;

	};

	chart.colWidth = function(value) {

		if (!arguments.length) return colWidth;
		colWidth = value;
		return chart;

	};

	chart.title = function(value) {

		if (!arguments.length) return title;
		title = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.yAxisLabel = function(value) {

		if (!arguments.length) return yAxisLabel;
		yAxisLabel = value;
		return chart;

	};

	chart.subgroup = function(value) {

		if (!arguments.length) return subgroup;
		subgroup = value;
		return chart;

	};

	chart.notes = function(value) {

		if (!arguments.length) return notes;
		notes = value;
		return chart;

	};

	chart.source = function(value) {

		if (!arguments.length) return source;
		source = value;
		return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		return chart;

	};

  chart.data = function(value) {

      if (!arguments.length) return data;
      data = value;
      return chart;

  };

	return chart;

};

// Column chart with three tabs function

function columnThree() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		maxWidth = 650,
		height = 500,
		marginTop = 60,
		marginLeft = 20,
		marginBottom = 45,
		animateTime = 1000,
		colWidth = 15,
		title1 = "Generic chart title. Update me using .title1()!",
		title2 = "Generic chart title. Update me using .title2()!",
		title3 = "Generic chart title. Update me using .title3()!",
		altText1 = "Fill in alt text for screen readers! Use .altText1().",
		altText2 = "Fill in alt text for screen readers! Use .altText2().",
		altText3 = "Fill in alt text for screen readers! Use .altText3().",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	var updateTitle,
		updateAltText,
		updateData;

	var marginBottom1;

	marginBottom1 = marginBottom;

	function chart(selection) {
		selection.each(function() {

		// filter data to show gender by default

		var subchartID = 1;

		dataFiltered = data.filter(function(d) { return d.subchart == subchartID; });

		// formats

		var	formatNumber = d3.format(",f"),
			formatPercent = d3.format(",.1%");

		// margins; adjust width and height to account for margins

		if (maxWidth < parseInt(d3.select("#" + sectionID).style("width"), 10)) { width = maxWidth; }
		else { width = parseInt(d3.select("#" + sectionID).style("width"), 10); }

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

		// buttons for filtering

		var buttons = d3.select(this)
			.append("div")
				.style({
					"margin": "0 auto"
				})
				.attr("id", "buttons" + chartID)
				.attr("class", "filters")

		d3.select("#buttons" + chartID)
			.append("button")
			.attr("class", "filterButton buttonSelected")
			.text("Gender")
			.on("click", function() {

				updateData(1);
				updateTitle(1);
				updateAltText(1);

				d3.select("#buttons" + chartID)
					.selectAll("button")
						.attr("class", "filterButton");

				d3.select(this)
					.classed("buttonSelected", true);

			});

		d3.select("#buttons" + chartID)
			.append("button")
			.attr("class", "filterButton")
			.text("Disability Status")
			.on("click", function() {

				updateData(2);
				updateTitle(2);
				updateAltText(2);

				d3.select("#buttons" + chartID)
					.selectAll("button")
						.attr("class", "filterButton");

				d3.select(this)
					.classed("buttonSelected", true);

			});

		d3.select("#buttons" + chartID)
			.append("button")
			.attr("class", "filterButton")
			.text("English Learner Status")
			.on("click", function() {

				updateData(3);
				updateTitle(3);
				updateAltText(3);

				d3.select("#buttons" + chartID)
					.selectAll("button")
						.attr("class", "filterButton");

				d3.select(this)
					.classed("buttonSelected", true);

			});

		d3.select("#buttons" + chartID)
			.append("p");

		// chart title

		d3.select(this).append("div")
			.attr("id", "title" + chartID)
			.style("margin", "0 auto")
			.html("<span class = 'title'>" + title1 + "</span>");

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID)
			.style("width", function() {
				if (document.getElementById(sectionID).width < maxWidth) { return document.getElementById(sectionID).width; }
				else { return maxWidth; }
			})
			.style("margin", "0 auto")
			.style("max-width", maxWidth + "px");

		var svg = dom.append("svg")
			.attr("class", "col-chart")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText1);

		// tooltips using d3-tip

		var tipCol = d3.tip()
			.attr("class", "d3-tip")
			.offset([-10, 0])
			.html(function(d) {

			return formatPercent(d.overall_p) + " (" + formatNumber(d.overall_n) + " students)";


		});

		svg.call(tipCol);

		// axis scales

		var xScale = d3.scale.ordinal().rangeRoundBands([0, widthAdj], .5),
			yScale = d3.scale.linear().range([heightAdj, 0]);

		// domains

		xScale.domain(dataFiltered.map(function(d) { return d.group; }));
		yScale.domain([0, 0.25]);

		// axes

		function formatValueAxis(d) {

			var TickValue = formatNumber(d * 100);

			return TickValue;

		};

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom").outerTickSize(0),
			yAxis = d3.svg.axis().scale(yScale).orient("left").tickFormat(formatValueAxis).tickSize(-1 * widthAdj).ticks(Math.max(heightAdj/100, 2));

		// draw y-axis under columns

		svg.append("g")
			.attr("class", "y axis")
			.attr("aria-hidden", "true")
			.call(yAxis);

		svg.append("text")
			.attr("class", "y axis")
			.attr("x", -15)
			.attr("y", "-2.1em")
			.attr("text-anchor", "start")
			.attr("aria-hidden", "true")
			.text("% SUSPENDED IN 2013-14");

		// draw columns

		var cols = svg.selectAll("rect.column")
			.data(dataFiltered);

		cols.enter()
			.append("g")
				.attr("transform", "translate(0,0)")
				.append("rect")
					.attr("class", function(d) {
						if (d.group == "Overall") { return "overallColumn"; }
						else { return "column"; }
					})
					.attr("x", function(d, i) { return xScale(d.group) + (xScale.rangeBand() / 2) - (colWidth / 2); })
					.attr("width", colWidth)
					.attr("y", heightAdj)
					.attr("height", 0)
					.on("mouseover", tipCol.show)
					.on("mouseout", tipCol.hide)
					.append("aria-label")
						.text(function(d) { return "In 2013-14, " + formatPercent(d.overall_p) + " of " + d.group + " students, or " + formatNumber(d.overall_n) + " students, received one or more out-of-school suspensions."; });

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					svg.selectAll("rect")
						.transition()
							.duration(animateTime)
							.attr("height", function(d) { return heightAdj - yScale(d.overall_p); })
							.attr("y", function(d) { return yScale(d.overall_p); });

			}});

		// draw x-axis above columns

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)
			.selectAll(".tick text")
				.call(wrap, xScale.rangeBand());

		// notes and sources

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// update functions

		function updateTitle(titleID) {

			d3.select("#title" + chartID)
				.html(function() {
					if (titleID == 1) { return "<span class = 'title'>" + title1 + "</span>"; }
					if (titleID == 2) { return "<span class = 'title'>" + title2 + "</span>"; }
					if (titleID == 3) { return "<span class = 'title'>" + title3 + "</span>"; }
				})

		};

		function updateAltText(altTextID) {

			svg.select("aria-label")
				.text(function() {
					if (altTextID == 1) { return altText1; }
					if (altTextID == 2) { return altText2; }
					if (altTextID == 3) { return altText3; }
				})

		};

		function updateData(subchartID) {

			// re-filter data

			dataFiltered = data.filter(function(d) { return d.subchart == subchartID; });

			// update scales

			xScale.domain(dataFiltered.map(function(d) { return d.group; }));
			yScale.domain([0, 0.25]);

			// update columns

			var updateCols = svg.selectAll("rect")
				.data(dataFiltered);

			updateCols.transition()
				.duration(animateTime)
				.attr("x", function(d, i) { return xScale(d.group) + (xScale.rangeBand() / 2) - (colWidth / 2); })
				.attr("width", colWidth)
				.attr("height", function(d) { return heightAdj - yScale(d.overall_p); })
				.attr("y", function(d) { return yScale(d.overall_p); });

			updateCols.select("aria-label")
				.text(function(d) { return "In 2013-14, " + formatPercent(d.overall_p) + " of " + d.group + " students, or " + formatNumber(d.overall_n) + " students, received one or more out-of-school suspensions."; });

			updateCols.enter()
				.append("g")
					.attr("transform", "translate(0,0)")
					.append("rect")
						.attr("class", function(d) {
							if (d.group == "Overall") { return "overallColumn"; }
							else { return "column"; }
						})
						.attr("x", function(d, i) { return xScale(d.group) + (xScale.rangeBand() / 2) - (colWidth / 2); })
						.attr("width", colWidth)
						.attr("y", heightAdj)
						.attr("height", 0)
						.on("mouseover", tipCol.show)
						.on("mouseout", tipCol.hide)
						.transition()
							.duration(animateTime)
							.attr("height", function(d) { return heightAdj - yScale(d.overall_p); })
							.attr("y", function(d) { return yScale(d.overall_p); });

			updateCols.select("rect")
				.append("aria-label")
					.text(function(d) { return "In 2013-14, " + formatPercent(d.overall_p) + " of " + d.group + " students, or " + formatNumber(d.overall_n) + " students, received one or more out-of-school suspensions."; });

			updateCols.exit()
				.transition()
					.duration(animateTime)
					.style("opacity", 0)
					.attr("width", 0)
					.attr("y", heightAdj)
					.attr("height", 0)
					.remove();

			// update x axis

			svg.selectAll(".x.axis")
				.remove();

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + heightAdj + ")")
				.style("opacity", 1)
				.attr("aria-hidden", "true")
				.call(xAxis)
				.selectAll(".tick text")
					.call(wrap, xScale.rangeBand());

			};

		// resize

		window.addEventListener("resize", function() {

			// update width

			if (maxWidth < parseInt(d3.select("#" + sectionID).style("width"), 10)) { width = maxWidth; }
			else { width = parseInt(d3.select("#" + sectionID).style("width"), 10); }
			widthAdj = width - marginLeft - margin.right;

			// Update height if width < 575

			if (parseInt(d3.select("#" + sectionID).style("width"), 10) < 575) { marginBottom = marginBottom1 + 20; }
			else { marginBottom = marginBottom1 };

			heightAdj = height - marginTop - marginBottom;

			d3.select("#" + chartID)
				.style("width", function() {
					if (document.getElementById(sectionID).width < maxWidth) { return document.getElementById(sectionID).width; }
					else { return maxWidth; }
				})
				.style("margin", "0 auto")
				.style("max-width", maxWidth + "px");

			// resize chart

			xScale.rangeRoundBands([0, widthAdj], .5);
			yScale = d3.scale.linear().range([heightAdj, 0]);
			yScale.domain([0, 0.25]);
			yAxis.scale(yScale).tickSize(-1 * widthAdj).ticks(Math.max(heightAdj/100, 2));

			d3.select("#" + sectionID)
				.classed("activated", null);

			dom.selectAll(".col-chart")
				.attr("width", width)
				.attr("height", height);

			svg.select(".x.axis")
				.attr("transform", "translate(0," + heightAdj + ")")
				.call(xAxis)
				.selectAll(".tick text")
					.call(wrap, xScale.rangeBand());

			svg.select(".y.axis")
				.call(yAxis);

			svg.selectAll("rect.column")
				.attr("x", function(d, i) { return xScale(d.group) + (xScale.rangeBand() / 2) - (colWidth / 2); })
				.attr("height", 0)
				.attr("y", heightAdj);

			svg.selectAll("rect.overallColumn")
				.attr("x", function(d, i) { return xScale(d.group) + (xScale.rangeBand() / 2) - (colWidth / 2); })
				.attr("height", 0)
				.attr("y", heightAdj);

			var gs2 = graphScroll()
				.container(d3.select("#" + containerID))
				.graph(d3.selectAll("#" + chartID))
				.sections(d3.selectAll("#" + subcontainerID + " > div"))
				.on("active", function() {

					if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
					else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

						d3.select("#" + sectionID)
							.classed("activated", "true");

						svg.selectAll("rect")
							.transition()
								.duration(animateTime)
								.attr("height", function(d) { return heightAdj - yScale(d.overall_p); })
								.attr("y", function(d) { return yScale(d.overall_p); });

				}});

		});

		});

	};

    /* chart.width = function(value) {

        if (!arguments.length) return width;
        width = value;
        return chart;

    }; */

    chart.maxWidth = function(value) {

        if (!arguments.length) return maxWidth;
        maxWidth = value;
        return chart;

    };

    chart.height = function(value) {

        if (!arguments.length) return height;
        height = value;
        return chart;

    };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.colWidth = function(value) {

		if (!arguments.length) return colWidth;
		colWidth = value;
		return chart;

	};

	chart.title1 = function(value) {

		if (!arguments.length) return title1;
		title1 = value;
		return chart;

	};

	chart.title2 = function(value) {

		if (!arguments.length) return title2;
		title2 = value;
		return chart;

	};

	chart.title3 = function(value) {

		if (!arguments.length) return title3;
		title3 = value;
		return chart;

	};

	chart.altText1 = function(value) {

		if (!arguments.length) return altText1;
		altText1 = value;
		return chart;

	};

	chart.altText2 = function(value) {

		if (!arguments.length) return altText2;
		altText2 = value;
		return chart;

	};

	chart.altText3 = function(value) {

		if (!arguments.length) return altText3;
		altText3 = value;
		return chart;

	};

	chart.notes = function(value) {

			if (!arguments.length) return notes;
			notes = value;
			return chart;

		};

	chart.source = function(value) {

		if (!arguments.length) return source;
		source = value;
		return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		return chart;

	};

    chart.data = function(value) {

        if (!arguments.length) return data;
        data = value;
        return chart;

    };

	return chart;

};

// Dot plot (two dots) function

function dotTwo() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 500,
		marginTop = 20,
		marginLeft = 100,
		marginBottom = 45,
		dotSize = 4,
		animateTime = 1000,
		catdefs = 0,
		group1 = [],
		group2 = [],
		xAxisLabel = [],
		xMax = 1,
		title = "Generic chart title. Update me using .title()!",
		altText = "Fill in alt text for screen readers!",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
			formatNumberD = d3.format(",.1f"),
			formatPercent = d3.format(",.1%");

		// margins; adjust width and height to account for margins

		width = parseInt(d3.select("#" + sectionID).style("width"), 10);

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

		// chart title

		d3.select(this).append("div")
			.attr("class", "title")
			.text(title);

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID);

		var svg = dom.append("svg")
			.attr("class", "dotPlot")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText);

		// tooltips using d3-tip

		var tipGroup1 = d3.tip()
			.attr("class", "d3-tip")
			.direction(function(d) {
				if (d.group1_p > d.group2_p) { return "e"; }
				else { return "w"; }
			})
			.offset([0, 0])
			.html(function(d) {

			return group1 + ": " + formatPercent(d.group1_p) + "<br/>" + formatNumber(d.group1_n) + " students";

		});

		var tipGroup2 = d3.tip()
			.attr("class", "d3-tip")
			.direction(function(d) {
				if (d.group2_p > d.group1_p) { return "e"; }
				else { return "w"; }
			})
			.offset([0, 0])
			.html(function(d) {

			return group2 + ": " + formatPercent(d.group2_p) + "<br/>" + formatNumber(d.group2_n) + " students";

		});

		var tipLine = d3.tip()
			.attr("class", "d3-tip")
			.direction("n")
			.offset([-10, 0])
			.html(function(d) {

			return "Difference: " + formatNumberD(d.diff_ppt) + " percentage points";

		});

		var tipDefs = d3.tip()
			.attr("class", "d3-tip")
			.style("max-width", "400px")
			.direction("e")
			.offset([0, 10])
			.html(function(d) {	return d.definition; });

		svg.call(tipGroup1);
		svg.call(tipGroup2);
		svg.call(tipLine);
		svg.call(tipDefs);

		// axis scales and axes

		var xScale = d3.scale.linear().range([0, widthAdj]),
			yScale = d3.scale.ordinal().rangeRoundBands([0, heightAdj], .1);

		// domains
		// identify maximum value across male and female percentages
		// variables changed to EL

		var maxGroup1 = d3.max(data, function(d) { return d.group1_p; });
		var maxGroup2 = d3.max(data, function(d) { return d.group2_p; });
		var maxValue;

		if (maxGroup1 > maxGroup2) { maxValue = maxGroup1; }
		else { maxValue = maxGroup2; };

		function xDomain() {
			if (window.innerWidth <= 736) { xScale.domain([0, maxValue]).nice() }
			else { xScale.domain([0, xMax]); }
		};
		xDomain();
		yScale.domain(data.map(function(d) { return d.group; }));

		// axes

		function formatValueAxis(d) {

			var TickValue = formatNumber(d * 100);
			return TickValue;

		};

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(formatValueAxis).tickSize(-1 * heightAdj).ticks(Math.max(widthAdj/100, 2)),
			yAxis = d3.svg.axis().scale(yScale).orient("left").outerTickSize(0);

		// draw x-axis below bars

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)

		svg.append("text")
			.attr("class", "x axis")
			.attr("x", widthAdj)
			.attr("dx", "0.5em")
			.attr("y", heightAdj)
			.attr("dy", "3.1em")
			.attr("aria-hidden", "true")
			.attr("text-anchor", "end")
			.text(xAxisLabel);

		// draw dots and lines

		var lines = svg.selectAll("line.dotL")
			.data(data);

		lines.enter()
			.append("g")
			.attr("transform", "translate(0,0)")
			.append("line")
				.attr("class", "dotL")
				.attr("x1", function(d) { return xScale((d.group1_p + d.group2_p)/2); })
				.attr("x2", function(d) { return xScale((d.group1_p + d.group2_p)/2); })
				.attr("y1", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); })
				.attr("y2", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); });

		lines.enter()
			.append("g")
			.attr("transform", "translate(0,0)")
			.append("line")
				.attr("class", "dotLHit")
				.attr("x1", function(d) { return xScale((d.group1_p + d.group2_p)/2); })
				.attr("x2", function(d) { return xScale((d.group1_p + d.group2_p)/2); })
				.attr("y1", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); })
				.attr("y2", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); })
				.on("mouseover", tipLine.show)
				.on("mouseout", tipLine.hide);

		var dotsGroup1 = svg.selectAll("circle.dotGroup1")
			.data(data);

		dotsGroup1.enter()
			.append("g")
				.attr("transform", "translate(0,0)")
				.append("circle")
					.attr("class", "dotGroup1")
					.attr("clip-path", function() { return "url(#clip" + chartID + ")"; })
					.attr("cx", 0)
					.attr("cy", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); })
					.attr("r", dotSize/2)
					.on("mouseover", tipGroup1.show)
					.on("mouseout", tipGroup1.hide)
					.append("aria-label")
						.text(function(d) { return "In 2013–14, " + group1 + " comprised " + formatPercent(d.group1_p) + ", or " + formatNumber(d.group1_n) + ", of the total " + d.group; });

		dotsGroup1.append("text")
			.attr("x", function(d) { return xScale(d.group1_p); })
			.attr("y", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); })
			.attr("dy", (-2.5 * dotSize))
			.attr("text-anchor", "middle")
			.attr("class", "labelGroup1")
			.attr("aria-hidden", "true")
			.style("opacity", 0)
			.text(group1);

		var dotsGroup2 = svg.selectAll("circle.dotGroup2")
			.data(data);

		dotsGroup2.enter()
			.append("g")
				.attr("transform", "translate(0,0)")
				.append("circle")
					.attr("class", "dotGroup2")
					.attr("clip-path", function() { return "url(#clip" + chartID + ")"; })
					.attr("cx", 0)
					.attr("cy", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); })
					.attr("r", dotSize/2)
					.on("mouseover", tipGroup2.show)
					.on("mouseout", tipGroup2.hide)
					.append("aria-label")
						.text(function(d) { return "In 2013–14, " + group2 + " comprised " + formatPercent(d.group2_p) + ", or " + formatNumber(d.group2_n) + ", of the total " + d.group; });

		dotsGroup2.append("text")
			.attr("x", function(d) { return xScale(d.group2_p); })
			.attr("y", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); })
			.attr("dy", (-2.5 * dotSize))
			.attr("text-anchor", "middle")
			.attr("aria-hidden", "true")
			.attr("class", "labelGroup2")
			.style("opacity", 0)
			.text(group2);

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					svg.selectAll("line.dotL")
						.transition()
							.duration(animateTime)
							.delay(animateTime)
							.attr("x1", function(d) {
								if (d.group2_p > d.group1_p) { return xScale(d.group1_p) + dotSize; }
								else { return xScale(d.group2_p) + dotSize; }
							})
							.attr("x2", function(d) {
								if (d.group2_p > d.group1_p) { return xScale(d.group2_p) - dotSize; }
								else { return xScale(d.group1_p) - dotSize; }
							});

					svg.selectAll("line.dotLHit")
						.transition()
							.duration(animateTime)
							.delay(animateTime)
							.attr("x1", function(d) {
								if (d.group2_p > d.group1_p) { return xScale(d.group1_p) + dotSize; }
								else { return xScale(d.group2_p) + dotSize; }
							})
							.attr("x2", function(d) {
								if (d.group2_p > d.group1_p) { return xScale(d.group2_p) - dotSize; }
								else { return xScale(d.group1_p) - dotSize; }
							});

					svg.selectAll("circle.dotGroup1")
						.transition()
							.duration(animateTime)
							.attr("cx", function(d) { return xScale(d.group1_p); })
							.each("end", function(d) {
								d3.select(this)
									.transition()
										.duration(animateTime)
										.attr("r", dotSize);
							});

					svg.selectAll("text.labelGroup1")
						.transition()
							.duration(animateTime)
							.delay(animateTime)
							.style("opacity", function(d) {
								if (d.order == 1) { return 1; }
								else { return 0; }
							});

					svg.selectAll("circle.dotGroup2")
						.transition()
							.duration(animateTime)
							.attr("cx", function(d) { return xScale(d.group2_p); })
							.each("end", function(d) {
								d3.select(this)
									.transition()
										.duration(animateTime)
										.attr("r", dotSize);
							});

					svg.selectAll("text.labelGroup2")
						.transition()
							.duration(animateTime)
							.delay(animateTime)
							.style("opacity", function(d) {
								if (d.order == 1) { return 1; }
								else { return 0; }
							});

			}});

		// add clip path

		svg.append("defs")
			.append("clipPath")
				.attr("id", function() { return "clip" + chartID; })
					.append("rect")
						.attr("id", function() { return "clipRect" + chartID; })
						.attr("width", widthAdj + margin.right)
						.attr("height", heightAdj);

		// draw y-axis above

		svg.append("g")
			.attr("class", "y axis")
			.attr("aria-hidden", "true")
			.call(yAxis)

		if (catdefs == 1) {
			svg.selectAll(".y.axis .tick")
				.data(data)
				.on("mouseover", tipDefs.show)
				.on("mouseout", tipDefs.hide);
		}
		else if (catdefs == 0) { };

		// notes

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// resize

		window.addEventListener("resize", function() {

			// update width

			width = parseInt(d3.select("#" + sectionID).style("width"), 10);
			widthAdj = width - marginLeft - margin.right;

			// resize chart

			xScale.range([0, widthAdj]);
			xDomain();
			xAxis.ticks(Math.max(widthAdj/100, 2));

			/*d3.select("#" + chartID)
				.attr("width", width);*/

			dom.selectAll(".dotPlot")
				.attr("width", width);

			d3.select("#" + sectionID)
				.classed("activated", null);

			d3.select("#clipRect" + chartID)
				.attr("width", widthAdj + margin.right)
				.attr("height", heightAdj);

			svg.select(".x.axis")
				.call(xAxis);

			svg.select("text.x.axis")
				.attr("x", widthAdj)
				.attr("dx", "0.5em");

			svg.selectAll("line.dotL")
				.attr("x1", function(d) { return xScale((d.group1_p + d.group2_p)/2); })
				.attr("x2", function(d) { return xScale((d.group1_p + d.group2_p)/2); });

			svg.selectAll("line.dotLHit")
				.attr("x1", function(d) { return xScale((d.group1_p + d.group2_p)/2); })
				.attr("x2", function(d) { return xScale((d.group1_p + d.group2_p)/2); });

			svg.selectAll("circle.dotGroup1")
				.attr("clip-path", function() { return "url(#clip" + chartID + ")"; })
				.attr("cx", 0);

			svg.selectAll("text.labelGroup1")
				.attr("x", function(d) { return xScale(d.group1_p); })
				.style("opacity", 0);

			svg.selectAll("circle.dotGroup2")
				.attr("clip-path", function() { return "url(#clip" + chartID + ")"; })
				.attr("cx", 0);

			svg.selectAll("text.labelGroup2")
				.attr("x", function(d) { return xScale(d.group2_p); })
				.style("opacity", 0);

			var gsResize = graphScroll()
				.container(d3.select("#" + containerID))
				.graph(d3.selectAll("#" + chartID))
				.sections(d3.selectAll("#" + subcontainerID + " > div"))
				.on("active", function() {

					if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
					else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

						d3.select("#" + sectionID)
							.classed("activated", "true");

						svg.selectAll("line.dotL")
							.transition()
								.duration(animateTime)
								.delay(animateTime)
								.attr("x1", function(d) {
									if (d.group2_p > d.group1_p) { return xScale(d.group1_p) + dotSize; }
									else { return xScale(d.group2_p) + dotSize; }
								})
								.attr("x2", function(d) {
									if (d.group2_p > d.group1_p) { return xScale(d.group2_p) - dotSize; }
									else { return xScale(d.group1_p) - dotSize; }
								});

						svg.selectAll("line.dotLHit")
							.transition()
								.duration(animateTime)
								.delay(animateTime)
								.attr("x1", function(d) {
									if (d.group2_p > d.group1_p) { return xScale(d.group1_p) + dotSize; }
									else { return xScale(d.group2_p) + dotSize; }
								})
								.attr("x2", function(d) {
									if (d.group2_p > d.group1_p) { return xScale(d.group2_p) - dotSize; }
									else { return xScale(d.group1_p) - dotSize; }
								});

						svg.selectAll("circle.dotGroup1")
							.transition()
								.duration(animateTime)
								.attr("cx", function(d) { return xScale(d.group1_p); })
								.each("end", function(d) {
									d3.select(this)
										.transition()
											.duration(animateTime)
											.attr("r", dotSize);
								});

						svg.selectAll("text.labelGroup1")
						.transition()
							.duration(animateTime)
							.delay(animateTime)
							.style("opacity", function(d) {
								if (d.order == 1) { return 1; }
								else { return 0; }
							});

						svg.selectAll("circle.dotGroup2")
							.transition()
								.duration(animateTime)
								.attr("cx", function(d) { return xScale(d.group2_p); })
								.each("end", function(d) {
									d3.select(this)
										.transition()
											.duration(animateTime)
											.attr("r", dotSize);
								});

					svg.selectAll("text.labelGroup2")
						.transition()
							.duration(animateTime)
							.delay(animateTime)
							.style("opacity", function(d) {
								if (d.order == 1) { return 1; }
								else { return 0; }
							});

				}});
			});

		});

	};

   /* chart.width = function(value) {

        if (!arguments.length) return width;
        width = value;
        return chart;

    }; */

  chart.height = function(value) {

      if (!arguments.length) return height;
      height = value;
      return chart;

  };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.dotSize = function(value) {

		if (!arguments.length) return dotSize;
		dotSize = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.catdefs = function(value) {

		if (!arguments.length) return catdefs;
		catdefs = value;
		return chart;

	};

	chart.xMax = function(value) {

		if (!arguments.length) return xMax;
		xMax = value;
		return chart;

	};

	chart.group1 = function(value) {

		if (!arguments.length) return group1;
		group1 = value;
		return chart;

	};

	chart.group2 = function(value) {

		if (!arguments.length) return group2;
		group2 = value;
		return chart;

	};

	chart.xAxisLabel = function(value) {

		if (!arguments.length) return xAxisLabel;
		xAxisLabel = value;
		return chart;

	};

	chart.title = function(value) {

		if (!arguments.length) return title;
		title = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.notes = function(value) {

		if (!arguments.length) return notes;
		notes = value;
		return chart;

	};

	chart.source = function(value) {

			if (!arguments.length) return source;
			source = value;
			return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		return chart;

	};

    chart.data = function(value) {

        if (!arguments.length) return data;
        data = value;
        return chart;

    };

	return chart;

};

// Grouped bar chart function

function groupedBar() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 650,
		marginTop = 20,
		marginLeft = 100,
		marginBottom = 60,
		animateTime = 1000,
		barWidth = 15,
		title1 = "Generic chart title #1. Update me using .title1()!",
		title2 = "Generic chart title #2. Update me using .title2()!",
		title3 = "Generic chart title #3. Update me using .title3()!",
		title4 = "Generic chart title #4. Update me using .title4()!",
		altText1 = "Fill in alt text for screen readers! Use .altText1().",
		altText2 = "Fill in alt text for screen readers! Use .altText2().",
		altText3 = "Fill in alt text for screen readers! Use .altText3().",
		altText4 = "Fill in alt text for screen readers! Use .altText4().",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	var updateTitle,
		updateAltText,
		updateData;

	function chart(selection) {
		selection.each(function() {

		// filter data for default to show r/e categories

		var subChartID = 1;

		dataFiltered = data.filter(function(d) { return d.subchart == subChartID; });

		// formats

		var	formatNumber = d3.format(",f"),
			formatNumberD = d3.format(",.1f"),
			formatPercent = d3.format(",.1%");

		// margins; adjust width and height to account for margins

		width = (parseInt(d3.select("#" + sectionID).style("width"), 10) < 360) ? 360 : parseInt(d3.select("#" + sectionID).style("width"), 10);

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

		// buttons for filtering

		var buttons = d3.select(this)
			.append("div")
			.style({
					"margin": "0 auto"
				})
				.attr("id", "buttons" + chartID)
				.attr("class", "filters")

		d3.select("#buttons" + chartID)
			.append("button")
			.attr("class", "filterButton buttonSelected")
			.text("Race & Ethnicity")
			.on("click", function() {

				updateData(1);
				updateTitle(1);
				updateAltText(1);

				d3.select("#buttons" + chartID)
					.selectAll("button")
						.attr("class", "filterButton");

				d3.select(this)
					.classed("buttonSelected", true);

			});

		d3.select("#buttons" + chartID)
			.append("button")
			.attr("class", "filterButton")
			.text("Gender")
			.on("click", function() {

				updateData(2);
				updateTitle(2);
				updateAltText(2);

				d3.select("#buttons" + chartID)
					.selectAll("button")
						.attr("class", "filterButton");

				d3.select(this)
					.classed("buttonSelected", true);

			});

		d3.select("#buttons" + chartID)
			.append("button")
			.attr("class", "filterButton")
			.text("Disability Status")
			.on("click", function() {

				updateData(3);
				updateTitle(3);
				updateAltText(3);

				d3.select("#buttons" + chartID)
					.selectAll("button")
						.attr("class", "filterButton");

				d3.select(this)
					.classed("buttonSelected", true);

			});

		d3.select("#buttons" + chartID)
			.append("button")
			.attr("class", "filterButton")
			.text("English Learner Status")
			.on("click", function() {

				updateData(4);
				updateTitle(4);
				updateAltText(4);

				d3.select("#buttons" + chartID)
					.selectAll("button")
						.attr("class", "filterButton");

				d3.select(this)
					.classed("buttonSelected", true);

			});

		d3.select("#buttons" + chartID)
			.append("p");

		// chart title

		d3.select(this).append("div")
			.attr("id", "title" + chartID)
			.html("<span class = 'title'>" + title1 + "</span>");

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID);

		var svg = dom.append("svg")
			.attr("class", "groupedBar")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText1);

		// tooltips using d3-tip

		var tipBar = d3.tip()
			.attr("class", "d3-tip")
			.direction("e")
			.offset([0, 10])
			.html(function(d) {
				return d.level + "</br>" + formatPercent(d.overall_p) + " (" + formatNumber(d.overall_n) + " students)";
			});

		svg.call(tipBar);

		// axis scales

		var xScale = d3.scale.linear().range([0, widthAdj - 100]),
			yScale0 = d3.scale.ordinal().rangeRoundBands([0, heightAdj], 0.15),
			yScale1 = d3.scale.ordinal();

		// domains

		data_nest = d3.nest()
			.key(function(d) { return d.group; })
			.entries(dataFiltered);

		data_levels = d3.nest()
			.key(function(d) { return d.level; })
			.entries(dataFiltered);

		var levels = ["Enrolled","Suspended"];

		function xDomain() {
			if (window.innerWidth <= 736) {

				xScale.domain([0, d3.max(data, function(d) { return d.overall_p; })]).nice()

			}
			/*else { xScale.domain([0, 0.5]); }*/
		};
		xDomain();
		yScale0.domain(data_nest.map(function(d) { return d.key; }));
		yScale1.domain(levels).rangeRoundBands([0, yScale0.rangeBand()], 0.15);

		// axes

		function formatValueAxis(d) {

			var TickValue = formatNumber(d * 100);

			return TickValue;

		};

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(formatValueAxis).tickSize(-1 * heightAdj).ticks(Math.max((widthAdj - 100)/100, 2)),
			yAxis = d3.svg.axis().scale(yScale0).orient("left").outerTickSize(0);

		// draw x-axis below bars

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)

		svg.append("text")
			.attr("id", "xAxisT_a")
			.attr("class", "x axis")
			.attr("x", widthAdj - 100)
			.attr("dx", ".5em")
			.attr("y", heightAdj)
			.attr("dy", "3.1em")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.text(function() {
				if (window.innerWidth <= 736) { return "% ENROLLED VS. % OF"; }
				else { return "% OF ENROLLED VS. % OF SUSPENDED IN 2013-14"; }
			});

		svg.append("text")
			.attr("id", "xAxisT_b")
			.attr("class", "x axis")
			.attr("x", widthAdj - 100)
			.attr("dx", ".5em")
			.attr("y", heightAdj)
			.attr("dy", "4.1em")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.style("opacity", function() {
				if (window.innerWidth <= 736) { return 1; }
				else { return 0; }
			})
			.text("SUSPENDED IN 2013-14");

		// draw national bars

	/*	data_national = dataFiltered.filter(function(d) { return d.level == "Overall"; });

		var nationalBar = svg.selectAll(".national-bar")
			.data(data_national);

		nationalBar.enter()
			.append("g")
				.attr("transform", "translate(0,0)")
				.append("rect")
					.attr("class", function(d) { return "national-bar " + d.level; })
					.attr("x", 0)
					.attr("width", 0)
					.attr("y", function(d) { return yScale0(d.group) + (yScale0.rangeBand() / 2) - ((((1.25 * levels.length) * barWidth)) / 2); })
					.attr("height", ((1.25 * levels.length) * barWidth))
					.on("mouseover", tipBar.show)
					.on("mouseout", tipBar.hide)
					.append("aria-label")
						.text(function(d) { return "In 2013-14, " + d.level + ", " + formatPercent(d.pct) + " of " + d.group + " students, or " + formatNumber(d.number) + " students, were chronically absent."; }); */

		// draw level bars

		data_noavg = dataFiltered.filter(function(d) { return d.level != "Overall"; });

		data_nest_noavg = d3.nest()
			.key(function(d) { return d.group; })
			.entries(data_noavg);

		var group = svg.selectAll(".group")
			.data(data_nest_noavg, function(d) { return d.key; });

		group.enter()
			.append("g")
				.attr("class", "group")
				.attr("transform", function(d) { return "translate(0," + yScale0(d.key) + ")"; });

		var levelBars = group.selectAll(".bar")
			.data(function(d) { return d.values; });

		levelBars.enter()
			.append("rect")
				.attr("class", function(d) { return "bar " + d.level; })
				.attr("x", 0)
				.attr("width", 0)
				.attr("y", function(d, i) { return (yScale0.rangeBand() / 2) - ((.85 * (((1.25 * levels.length) * barWidth)) / 2)) + (1.09 * barWidth * i); })
				.attr("height", 0)
				//.style("fill", function(d) { return color(d.level); })
				.on("mouseover", tipBar.show)
				.on("mouseout", tipBar.hide)
				.append("aria-label")
					.text(function(d) {
						if (d.level == "Enrolled") { return "In 2013-14, " + d.group + " students comprised " + formatPercent(d.overall_p) + " of the total students enrolled in pre-school."; }
						else if (d.level == "Suspended") { return "In 2013-14, " + d.group + " students comprised " + formatPercent(d.overall_p) + " of the total pre-school students receiving one or more out-of-school suspensions."; }
					});

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					/*svg.selectAll(".national-bar")
						.transition()
							.duration(animateTime)
							.attr("width", function(d) { return xScale(d.overall_p); });*/

					svg.selectAll(".bar")
						.transition()
							.duration(animateTime)
							.attr("width", function(d) { return xScale(d.overall_p); })
							.attr("height", barWidth);

			}});

		// draw y-axis above bars

		svg.append("g")
			.attr("class", "y axis")
			.style("opacity", 0)
			.attr("aria-hidden", "true")
			.call(yAxis)
			.transition()
				.duration(animateTime)
				.style("opacity", 1);

		// legend

		var legend = svg.selectAll(".legend")
			.data(levels)
			.enter()
			.append("g")
				.attr("class", "legend")
				.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("circle")
			.attr("class", function(d) { return d; })
			.attr("cx", widthAdj - 77)
			.attr("cy", 9)
			.attr("r", 6.5);
			//.style("fill", color);

		legend.append("text")
			.attr("x", widthAdj - 65)
			.attr("y", 9)
			.attr("dy", ".35em")
			.attr("aria-hidden", "true")
			.style("text-anchor", "start")
			.text(function(d) { return d; });

		// notes and sources

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// update functions

		function updateTitle(titleID) {

			d3.select("#title" + chartID)
				.html(function() {
					if (titleID == 1) { return "<span class = 'title'>" + title1 + "</span>"; }
					if (titleID == 2) { return "<span class = 'title'>" + title2 + "</span>"; }
					if (titleID == 3) { return "<span class = 'title'>" + title3 + "</span>"; }
					if (titleID == 4) { return "<span class = 'title'>" + title4 + "</span>"; }
				})

		};

		function updateAltText(altTextID) {

			svg.select("aria-label")
				.text(function() {
					if (altTextID == 1) { return altText1; }
					if (altTextID == 2) { return altText2; }
					if (altTextID == 3) { return altText3; }
					if (altTextID == 4) { return altText4; }
				})

		};

		function updateData(subChartID) {

			// re-filter data

			dataFiltered = data.filter(function(d) { return d.subchart == subChartID; });

			var data_nest = d3.nest()
				.key(function(d) { return d.group; })
				.entries(dataFiltered);

			// update scales

			xDomain();
			yScale0.domain(data_nest.map(function(d) { return d.key; }));
			yScale1.domain(levels).rangeRoundBands([0, yScale0.rangeBand()], 0.15);

			// update national bars

			/*data_national = dataFiltered.filter(function(d) { return d.level == "Overall"; });

			var updateNational = svg.selectAll(".national-bar")
				.data(data_national);

			updateNational.transition()
				.duration(animateTime)
				.attr("x", 0)
				.attr("width", function(d) { return xScale(d.pct); })
				.attr("y", function(d) { return yScale0(d.group) + (yScale0.rangeBand() / 2) - ((((1.25 * levels.length) * barWidth)) / 2); })
				.attr("height", ((1.25 * levels.length) * barWidth));

			updateNational.select("aria-label")
				.text(function(d) { return "In 2013-14, " + d.level + ", " + formatPercent(d.pct) + " of " + d.group + " students, or " + formatNumber(d.number) + " students, were chronically absent."; });

			updateNational.enter()
				.append("g")
					.attr("transform", "translate(0,0)")
					.append("rect")
						.attr("class", function(d) { return "national-bar " + d.level; })
						.attr("x", 0)
						.attr("width", 0)
						.attr("y", function(d) { return yScale0(d.group) + (yScale0.rangeBand() / 2) - ((((1.25 * levels.length) * barWidth)) / 2); })
						.attr("height", ((1.25 * levels.length) * barWidth))
						.on("mouseover", tipBar.show)
						.on("mouseout", tipBar.hide)
						.transition()
							.duration(animateTime)
							.attr("width", function(d) { return xScale(d.pct); })

			updateNational.selectAll(".national-bar")
				.append("aria-label")
					.text(function(d) { return "In 2013-14, " + d.level + ", " + formatPercent(d.pct) + " of " + d.group + " students, or " + formatNumber(d.number) + " students, were chronically absent."; });

			updateNational.exit()
				.transition()
					.duration(animateTime)
					.style("opacity", 0)
					.attr("x", 0)
					.attr("width", 0)
					.attr("height", 0)
					.remove();*/

			// update level bars

			data_noavg = dataFiltered.filter(function(d) { return d.level != "Overall"; });

			data_nest_noavg = d3.nest()
				.key(function(d) { return d.group; })
				.entries(data_noavg);

			var updateGroups = svg.selectAll(".group")
				.data(data_nest_noavg, function(d) { return d.key; });

			updateGroups.transition()
				.duration(animateTime)
				.attr("transform", function(d) { return "translate(0," + yScale0(d.key) + ")"; });

			updateGroups.enter()
				.append("g")
					.attr("class", "group")
					.attr("transform", function(d) { return "translate(0," + yScale0(d.key) + ")"; });

			updateGroups.exit()
				.transition()
					.duration(animateTime)
					.remove();

			updateGroups.exit()
				.selectAll(".bar")
				.transition()
					.duration(animateTime)
					.style("opacity", 0)
					.attr("x", 0)
					.attr("width", 0)
					.attr("height", 0);

			var updateBars = updateGroups.selectAll(".bar")
				.data(function(d) { return d.values; });

			updateBars.transition()
				.duration(animateTime / 2)
				.attr("x", 0)
				.attr("width", function(d) { return xScale(d.pct); })
				.attr("y", function(d, i) { return (yScale0.rangeBand() / 2) - ((.85 * (((1.25 * levels.length) * barWidth)) / 2)) + (1.09 * barWidth * i); })
				.attr("height", barWidth);

			updateGroups.selectAll("aria-label")
				.text(function(d) { return "In 2013-14, " + formatPercent(d.overall_p) + " of " + d.level + " school " + d.group + " students, or " + formatNumber(d.overall_n) + " students, received one or more out-of-school suspensions."; });

			updateBars.enter()
				.append("rect")
					.attr("class", function(d) { return "bar " + d.level; })
					.attr("x", 0)
					.attr("width", 0)
					.attr("y", function(d, i) { return (yScale0.rangeBand() / 2) - ((.85 * (((1.25 * levels.length) * barWidth)) / 2)) + (1.09 * barWidth * i); })
					.attr("height", 0)
					//.style("fill", function(d) { return color(d.level); })
					.on("mouseover", tipBar.show)
					.on("mouseout", tipBar.hide)
					.transition()
						.duration(animateTime)
						.attr("width", function(d) { return xScale(d.overall_p); })
						.attr("height", barWidth);

			updateGroups.selectAll("rect.bar")
				.append("aria-label")
					.text(function(d) {
						if (d.level == "Enrolled") { return "In 2013-14, " + d.group + " students comprised " + formatPercent(d.overall_p) + " of the total students enrolled in pre-school."; }
						else if (d.level == "Suspended") { return "In 2013-14, " + d.group + " students comprised " + formatPercent(d.overall_p) + " of the total pre-school students receiving one or more out-of-school suspensions."; }
					});

			updateBars.exit()
				.transition()
					.remove();

			// update y axis

			svg.selectAll(".y.axis")
				.transition()
					.duration(animateTime)
					.style("opacity", 0)
					.remove();

			svg.append("g")
				.attr("class", "y axis")
				.style("opacity", 0)
				.call(yAxis)
				.transition()
					.duration(animateTime)
					.style("opacity", 1);

			};

		// resize

		window.addEventListener("resize", function() {

			// update width

			width = (parseInt(d3.select("#" + sectionID).style("width"), 10) < 360) ? 360 : parseInt(d3.select("#" + sectionID).style("width"), 10);
			widthAdj = width - marginLeft - margin.right;

			// resize chart

			xScale.range([0, widthAdj - 100]);
			xDomain();
			xAxis.ticks(Math.max((widthAdj - 100)/100, 2))

			/*d3.select("#" + chartID)
				.attr("width", width);*/

			d3.select("#" + sectionID)
				.classed("activated", null);

			dom.selectAll(".groupedBar")
				.attr("width", width);

			svg.select(".x.axis")
				.call(xAxis);

			svg.selectAll("text.x.axis")
				.attr("x", widthAdj - 100)
				.attr("dx", "0.5em");

			svg.select("#xAxisT_a")
				.text(function() {
					if (window.innerWidth <= 736) { return "% OF ENROLLED VS. % OF"; }
					else { return "% OF ENROLLED VS. % OF SUSPENDED IN 2013-14"; }
				});

			svg.select("#xAxisT_b")
				.style("opacity", function() {
					if (window.innerWidth <= 736) { return 1; }
					else { return 0; }
				})
				.text("SUSPENDED IN 2013-14");

			/*dom.selectAll(".national-bar")
				.attr("width", 0);*/

			svg.selectAll(".bar")
				.attr("width", 0);

			var gsResize = graphScroll()
				.container(d3.select("#" + containerID))
				.graph(d3.selectAll("#" + chartID))
				.sections(d3.selectAll("#" + subcontainerID + " > div"))
				.on("active", function() {

					if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
					else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

						d3.select("#" + sectionID)
							.classed("activated", "true");

						/*svg.selectAll(".national-bar")
							.transition()
								.duration(animateTime)
								.attr("width", function(d) { return xScale(d.pct); }); */

						svg.selectAll(".bar")
							.transition()
								.duration(animateTime)
								.attr("width", function(d) { return xScale(d.overall_p); })
								.attr("height", barWidth);

				}});

			legend.selectAll("circle")
				.attr("cx", widthAdj - 77);

			legend.selectAll("text")
				.attr("x", widthAdj - 65);

		});

		});

	};

 /*   chart.width = function(value) {

        if (!arguments.length) return width;
        width = value;
        return chart;

    }; */

    chart.height = function(value) {

        if (!arguments.length) return height;
        height = value;
        return chart;

    };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.barWidth = function(value) {

		if (!arguments.length) return barWidth;
		barWidth = value;
		return chart;

	};

	chart.title1 = function(value) {

		if (!arguments.length) return title1;
		title1 = value;
		return chart;

	};

	chart.title2 = function(value) {

		if (!arguments.length) return title2;
		title2 = value;
		return chart;

	};

	chart.title3 = function(value) {

		if (!arguments.length) return title3;
		title3 = value;
		return chart;

	};

	chart.title4 = function(value) {

		if (!arguments.length) return title4;
		title4 = value;
		return chart;

	};

	chart.altText1 = function(value) {

		if (!arguments.length) return altText1;
		altText1 = value;
		return chart;

	};

	chart.altText2 = function(value) {

		if (!arguments.length) return altText2;
		altText2 = value;
		return chart;

	};

	chart.altText3 = function(value) {

		if (!arguments.length) return altText3;
		altText3 = value;
		return chart;

	};

	chart.altText4 = function(value) {

		if (!arguments.length) return altText4;
		altText4 = value;
		return chart;

	};

	chart.notes = function(value) {

			if (!arguments.length) return notes;
			notes = value;
			return chart;

		};

		chart.source = function(value) {

			if (!arguments.length) return source;
			source = value;
			return chart;

		};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		return chart;

	};

    chart.data = function(value) {

        if (!arguments.length) return data;
        data = value;
        if (typeof updateData === 'function') updateData();
        return chart;

    };

	return chart;

};

// Grouped bar (diverging)

function groupedBarDiv() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 650,
		marginTop = 35,
		marginLeft = 100,
		marginBottom = 60,
		animateTime = 1000,
		barWidth = 15,
		title = "Generic chart title. Update me using .title()!",
		altText = "Fill in alt text for screen readers! Use .altText().",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
			formatNumberD = d3.format(",.1f"),
			formatPercent = d3.format(",.1%");

		// margins; adjust width and height to account for margins

		width = (parseInt(d3.select("#" + sectionID).style("width"), 10) < 360) ? 360 : parseInt(d3.select("#" + sectionID).style("width"), 10);

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

		// chart title

		d3.select(this).append("div")
			.attr("id", "title" + chartID)
			.html("<span class = 'title'>" + title + "</span>");

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID);

			var svg = dom.append("svg")
			.attr("class", "groupedBarDiv")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText);

		// tooltips using d3-tip

		var tipBar = d3.tip()
			.attr("class", "d3-tip")
			.direction("e")
			.offset([0, 10])
			.html(function(d) {
				return d.group + ", " + d.level + "</br>Of Enrolled: " + formatPercent(d.enrolled_p) + "</br>Of Suspended: " + formatPercent(d.suspended_p) + "</br>Difference: " + formatNumberD(d.diff_ppt) + " percentage points";
			});

		svg.call(tipBar);

		// axis scales

		var xScale = d3.scale.linear().range([0, widthAdj - 100]),
			yScale0 = d3.scale.ordinal().rangeRoundBands([0, heightAdj], 0.15),
			yScale1 = d3.scale.ordinal();

		// domains

		data_nest = d3.nest()
			.key(function(d) { return d.group; })
			.entries(data);

		data_levels = d3.nest()
			.key(function(d) { return d.level; })
			.entries(data);

		var levels = ["Female","Male"];

		var maxPos = d3.max(data, function(d) { return d.diff_ppt; });
		var maxNeg = d3.min(data, function(d) { return d.diff_ppt; });
		var maxValue;

		function maxVal() {
			if ((-1 * maxNeg) > maxPos) { maxValue = (-1 * maxNeg); }
			else { maxValue = maxPos; }
		};

		maxVal();

		function xDomain() {
			if (window.innerWidth <= 736) {

				xScale.domain([-1 * maxValue, maxValue]).nice()

			}
			else { xScale.domain([-60, 60]); }
		};
		xDomain();
		yScale0.domain(data_nest.map(function(d) { return d.key; }));
		yScale1.domain(levels).rangeRoundBands([0, yScale0.rangeBand()], 0.15);

		// axes

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSize(-1 * heightAdj).ticks(Math.max((widthAdj - 100)/100, 2)),
			yAxis = d3.svg.axis().scale(yScale0).orient("left").outerTickSize(0);

		// draw x-axis below bars

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)

		svg.append("text")
			.attr("id", "xAxisT1")
			.attr("class", "x axis")
			.attr("x", widthAdj - 100)
			.attr("dx", ".5em")
			.attr("y", heightAdj)
			.attr("dy", "3.1em")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.text(function() {
				if (window.innerWidth <= 736) { return "DIFFERENCE BETWEEN % OF ENGLISH LEARNERS"; }
				else { return "DIFFERENCE BETWEEN % OF ENGLISH LEARNERS VS. % OF ALL STUDENTS IN 2013-14"; }
			});

		svg.append("text")
			.attr("id", "xAxisT2")
			.attr("class", "x axis")
			.attr("x", widthAdj - 100)
			.attr("dx", ".5em")
			.attr("y", heightAdj)
			.attr("dy", "4.1em")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.style("opacity", function() {
				if (window.innerWidth <= 736) { return 1; }
				else { return 0; }
			})
			.text("VS. % OF ENROLLED IN 2013-14");

		data_nest_noavg = d3.nest()
			.key(function(d) { return d.group; })
			.entries(data);

		var group = svg.selectAll(".group")
			.data(data_nest_noavg, function(d) { return d.key; });

		group.enter()
			.append("g")
				.attr("class", "group")
				.attr("transform", function(d) { return "translate(0," + yScale0(d.key) + ")"; });

		var levelBars = group.selectAll("rect.bar")
			.data(function(d) { return d.values; });

		levelBars.enter()
			.append("rect")
				.attr("class", function(d) { return "bar " + d.level; })
				.attr("x", xScale(0)/*function(d) { return xScale(Math.min(0, d.diff_ppt)); }*/)
				.attr("width", 0)
				.attr("y", function(d, i) { return (yScale0.rangeBand() / 2) - ((.85 * (((1.25 * levels.length) * barWidth)) / 2)) + (1.09 * barWidth * i); })
				.attr("height", 0)
				//.style("fill", function(d) { return color(d.level); })
				.on("mouseover", tipBar.show)
				.on("mouseout", tipBar.hide)
				.append("aria-label")
					.text(function(d) { return "In 2013-14, the difference in the percentage of preschool students who received one or more out-of-school suspensions and percentage of total preschool enrollment for " + d.group + " " + d.level + " students was " + d.diff_ppt + " percentage points."; });

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					svg.selectAll(".bar")
						.transition()
							.duration(animateTime)
							.attr("x", function(d) { return xScale(Math.min(0, d.diff_ppt)); })
							.attr("width", function(d) { return Math.abs(xScale(d.diff_ppt) - xScale(0)); })
							.attr("height", barWidth);

			}});

		// draw y-axis above bars

		svg.append("g")
			.attr("class", "y axis")
			.style("opacity", 0)
			.attr("aria-hidden", "true")
			.call(yAxis)
			.transition()
				.duration(animateTime)
				.style("opacity", 1);

		// add 0 line above bars

		svg.append("line")
			.attr("class", "zeroLine")
			.attr("x1", xScale(0))
			.attr("x2", xScale(0))
			.attr("y1", 0)
			.attr("y2", heightAdj);

		// add under/overrepresented text

		svg.append("text")
			.attr("id", "guide1")
			.attr("x", 0)
			.attr("y", 0)
			.attr("dx", "0.5em")
			.attr("dy", "-0.5em")
			.attr("class", "guide")
			.attr("aria-hidden", "true")
			.style("opacity", function() {
				if (window.innerWidth <= 736) { return 0; }
				else { return 1; }
			})
			.text("< UNDERREPRESENTED");

		svg.append("text")
			.attr("id", "guide2")
			.attr("x", widthAdj - 100)
			.attr("y", 0)
			.attr("dx", "-0.5em")
			.attr("dy", "-0.5em")
			.attr("class", "guide")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.style("opacity", function() {
				if (window.innerWidth <= 736) { return 0; }
				else { return 1; }
			})
			.text("OVERREPRESENTED >");

		// legend

		var legend = svg.selectAll(".legend")
			.data(levels)
			.enter()
			.append("g")
				.attr("class", "legend")
				.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("circle")
			.attr("class", function(d) { return d; })
			.attr("cx", widthAdj - 77)
			.attr("cy", 9)
			.attr("r", 6.5);
			//.style("fill", color);

		legend.append("text")
			.attr("x", widthAdj - 65)
			.attr("y", 9)
			.attr("dy", ".35em")
			.attr("aria-hidden", "true")
			.style("text-anchor", "start")
			.text(function(d) { return d; });

		// notes and sources

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// resize

		window.addEventListener("resize", function() {

			// update width

			width = (parseInt(d3.select("#" + sectionID).style("width"), 10) < 360) ? 360 : parseInt(d3.select("#" + sectionID).style("width"), 10);
			widthAdj = width - marginLeft - margin.right;

			// resize chart

			xScale.range([0, widthAdj - 100]);
			maxVal();
			xDomain();
			xAxis.ticks(Math.max((widthAdj - 100)/100, 2))

			/*d3.select("#" + chartID)
				.attr("width", width);*/

			d3.select("#" + sectionID)
				.classed("activated", null);

			dom.selectAll(".groupedBarDiv")
				.attr("width", width);

			svg.select("#guide1")
				.style("opacity", function() {
					if (window.innerWidth <= 736) { return 0; }
					else { return 1; }
				})

			svg.select("#guide2")
				.style("opacity", function() {
					if (window.innerWidth <= 736) { return 0; }
					else { return 1; }
				})

			svg.select(".x.axis")
				.call(xAxis);

			svg.selectAll("text.x.axis")
				.attr("x", widthAdj - 100)
				.attr("dx", "0.5em");

			svg.select("#xAxisT1")
				.text(function() {
					if (window.innerWidth <= 736) { return "DIFFERENCE BETWEEN % OF SUSPENDED"; }
					else { return "DIFFERENCE BETWEEN % OF SUSPENDED VS. % ENROLLED IN 2013-14"; }
				});

			svg.select("#xAxisT2")
				.style("opacity", function() {
					if (window.innerWidth <= 736) { return 1; }
					else { return 0; }
				});

			svg.select("line.zeroLine")
				.attr("x1", xScale(0))
				.attr("x2", xScale(0));

			svg.select("#guide1")
				.attr("x", 0)
				.attr("dx", "0.5em");

			svg.select("#guide2")
				.attr("x", widthAdj - 100)
				.attr("dx", "-0.5em");

			/*dom.selectAll(".national-bar")
				.attr("width", 0);*/

			svg.selectAll(".bar")
				.attr("x", xScale(0))
				.attr("width", 0);

			var gsResize = graphScroll()
				.container(d3.select("#" + containerID))
				.graph(d3.selectAll("#" + chartID))
				.sections(d3.selectAll("#" + subcontainerID + " > div"))
				.on("active", function() {

					if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
					else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

						d3.select("#" + sectionID)
							.classed("activated", "true");

						/*svg.selectAll(".national-bar")
							.transition()
								.duration(animateTime)
								.attr("width", function(d) { return xScale(d.pct); }); */

						svg.selectAll(".bar")
							.transition()
								.duration(animateTime)
								.attr("x", function(d) { return xScale(Math.min(0, d.diff_ppt)); })
								.attr("width", function(d) { return Math.abs(xScale(d.diff_ppt) - xScale(0)); })
								.attr("height", barWidth);

				}});

			legend.selectAll("circle")
				.attr("cx", widthAdj - 77);

			legend.selectAll("text")
				.attr("x", widthAdj - 65);

		});

		});

	};

 /*   chart.width = function(value) {

        if (!arguments.length) return width;
        width = value;
        return chart;

    }; */

    chart.height = function(value) {

        if (!arguments.length) return height;
        height = value;
        return chart;

    };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.barWidth = function(value) {

		if (!arguments.length) return barWidth;
		barWidth = value;
		return chart;

	};

	chart.title = function(value) {

		if (!arguments.length) return title;
		title = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.notes = function(value) {

			if (!arguments.length) return notes;
			notes = value;
			return chart;

		};

	chart.source = function(value) {

		if (!arguments.length) return source;
		source = value;
		return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		return chart;

	};

    chart.data = function(value) {

        if (!arguments.length) return data;
        data = value;
        return chart;

    };

	return chart;

};

// stacked bar chart

function stackedBar() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 1300,
		marginTop = 35,
		marginLeft = 100,
		marginBottom = 60,
		animateTime = 1000,
		barWidth = 20,
		title = "Generic chart title. Update me using .title()!",
		altText = "Fill in alt text for screen readers! Use .altText().",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
			formatNumberD = d3.format(",.1f"),
			formatPercent = d3.format(",.1%");

		// margins; adjust width and height to account for margins

		width = (parseInt(d3.select("#" + sectionID).style("width"), 10) < 360) ? 360 : parseInt(d3.select("#" + sectionID).style("width"), 10);

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

		// sorter buttons

		var sorter = d3.select(this)
			.append("div")
				.style({
					"margin": "0 auto"
				})
				.attr("id", "buttons" + chartID)
				.attr("class", "filters");

		sorter.append("button")
			.attr("class", "filterButton buttonSelected")
			.text("Sort by state")
			.on("click", function() {

				d3.select("#buttons" + chartID)
					.selectAll("button")
						.attr("class", "filterButton");

				d3.select(this)
					.classed("buttonSelected", true);

				sortState();

			});

		sorter.append("button")
			.attr("class", "filterButton")
			.text("Sort by % of EL students speaking State's top language")
			.on("click", function() {

				d3.select("#buttons" + chartID)
					.selectAll("button")
						.attr("class", "filterButton");

				d3.select(this)
					.classed("buttonSelected", true);

				sortPerc();

			});

		sorter.append("p")

		// chart title

		d3.select(this).append("div")
			.attr("id", "title" + chartID)
			.html("<span class = 'title'>" + title + "</span>");

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID);

		var svg = dom.append("svg")
			.attr("class", "stackedBar")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText);

		// tooltips using d3-tip

		var tipStackedBar = d3.tip()
			.attr("class", "d3-tip")
			.direction("n")
			.offset([-5, 0])
			.html(function(d) {
				if (d.segment == "lang1_p1") { return d.lang1_name + ": " + formatPercent(d.lang1_p) + " (" + formatNumber(d.lang1_n) + " ELs)"; }
				if (d.segment == "lang2_p1") { return d.lang2_name + ": " + formatPercent(d.lang2_p) + " (" + formatNumber(d.lang2_n) + " ELs)"; }
				if (d.segment == "lang3_p1") { return d.lang3_name + ": " + formatPercent(d.lang3_p) + " (" + formatNumber(d.lang3_n) + " ELs)"; }
				if (d.segment == "lang4_p1") { return d.lang4_name + ": " + formatPercent(d.lang4_p) + " (" + formatNumber(d.lang4_n) + " ELs)"; }
				if (d.segment == "lang5_p1") { return d.lang5_name + ": " + formatPercent(d.lang5_p) + " (" + formatNumber(d.lang5_n) + " ELs)"; }
				if (d.segment == "lang6_p1") { return d.lang6_name + ": " + formatPercent(d.lang6_p) + " (" + formatNumber(d.lang6_n) + " ELs)"; }
				if (d.segment == "lang7_p1") { return d.lang7_name + ": " + formatPercent(d.lang7_p) + " (" + formatNumber(d.lang7_n) + " ELs)"; };
			});

		svg.call(tipStackedBar);

		// axis scales

		var xScale = d3.scale.linear().range([0, widthAdj]),
			yScale = d3.scale.ordinal().rangeRoundBands([0, heightAdj], 0.15);

		// domains and colors

		var color = d3.scale.ordinal()
			.domain(["lang1_p1", "lang2_p1", "lang3_p1", "lang4_p1", "lang5_p1", "lang6_p1", "lang7_p1"])
			.range(["#5D42A6", "#A6426C", "#C07A98", "#DBB3C4", "#EBD4DE", "#DCDCDC", "#E8E8E8"]);

		var color2 = d3.scale.ordinal()
			.domain(["lang1_p1", "lang2_p1", "lang3_p1", "lang4_p1", "lang5_p1", "lang6_p1", "lang7_p1"])
			.range(["#FFF", "#FFF", "#FFF", "#202020", "#202020", "#202020", "#202020"]);

		// round up to 1% if < 1% and not missing

		data.forEach(function(d) {

			if ((d.lang1_p < 0.01) && (d.lang1_p > 0) && (d.lang1_name != "Missing")) { d.lang1_p1 = 0.01; }
			else { d.lang1_p1 = d.lang1_p; };

			if ((d.lang2_p < 0.01) && (d.lang2_p > 0)  && (d.lang2_name != "Missing")) { d.lang2_p1 = 0.01; }
			else { d.lang2_p1 = d.lang2_p; };

			if ((d.lang3_p < 0.01) && (d.lang3_p > 0)  && (d.lang3_name != "Missing")) { d.lang3_p1 = 0.01; }
			else { d.lang3_p1 = d.lang3_p; };

			if ((d.lang4_p < 0.01) && (d.lang4_p > 0)  && (d.lang4_name != "Missing")) { d.lang4_p1 = 0.01; }
			else { d.lang4_p1 = d.lang4_p; };

			if ((d.lang5_p < 0.01) && (d.lang5_p > 0)  && (d.lang5_name != "Missing")) { d.lang5_p1 = 0.01; }
			else { d.lang5_p1 = d.lang5_p; };

			if ((d.lang6_p < 0.01) && (d.lang6_p > 0)  && (d.lang6_name != "Missing")) { d.lang6_p1 = 0.01; }
			else { d.lang6_p1 = d.lang6_p; };

			if ((d.lang7_p < 0.01) && (d.lang7_p > 0)  && (d.lang7_name != "Missing")) { d.lang7_p1 = 0.01; }
			else { d.lang7_p1 = d.lang7_p; };

		});

		data.forEach(function(d) {
			var y0 = 0;
			d.segment = color.domain().map(function(name) { return {
				segment: name,
				y0: y0,
				y1: y0 += +d[name],
				state: d.state,
				lang1_p: +d.lang1_p,
				lang2_p: +d.lang2_p,
				lang3_p: +d.lang3_p,
				lang4_p: +d.lang4_p,
				lang5_p: +d.lang5_p,
				lang6_p: +d.lang6_p,
				lang7_p: +d.lang7_p,
				lang1_p1: +d.lang1_p1,
				lang2_p1: +d.lang2_p1,
				lang3_p1: +d.lang3_p1,
				lang4_p1: +d.lang4_p1,
				lang5_p1: +d.lang5_p1,
				lang6_p1: +d.lang6_p1,
				lang7_p1: +d.lang7_p1,
				lang1_n: +d.lang1_n,
				lang2_n: +d.lang2_n,
				lang3_n: +d.lang3_n,
				lang4_n: +d.lang4_n,
				lang5_n: +d.lang5_n,
				lang6_n: +d.lang6_n,
				lang7_n: +d.lang7_n,
				lang1_code: d.lang1_code,
				lang2_code: d.lang2_code,
				lang3_code: d.lang3_code,
				lang4_code: d.lang4_code,
				lang5_code: d.lang5_code,
				lang6_code: d.lang6_code,
				lang7_code: d.lang7_code,
				lang1_name: d.lang1_name,
				lang2_name: d.lang2_name,
				lang3_name: d.lang3_name,
				lang4_name: d.lang4_name,
				lang5_name: d.lang5_name,
				lang6_name: d.lang6_name,
				lang7_name: d.lang7_name };
			});
		});

		xScale.domain([0, 1]);
		yScale.domain(data.map(function(d) { return d.state; }));

		// axes

		function formatValueAxis(d) {
			var TickValue = formatNumber(d * 100);
			return TickValue;
		};

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(formatValueAxis).tickSize(-1 * heightAdj).ticks(Math.max((widthAdj - 100)/100, 2)),
			yAxis = d3.svg.axis().scale(yScale).orient("left").outerTickSize(0);

		// draw x-axis below bars

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)

		svg.append("text")
			.attr("class", "x axis")
			.attr("x", widthAdj)
			.attr("dx", ".5em")
			.attr("y", heightAdj)
			.attr("dy", "3.1em")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.text(function() {
				if (window.innerWidth <= 736) { return "% OF ENGLISH LEARNERS"; }
				else { return "% OF ENGLISH LEARNERS IN 2014–15"; }
			});

		// draw bars

		var state = svg.selectAll(".stateBar")
			.data(data)
			.enter()
				.append("g")
					.attr("class", "stateBar")
					.attr("transform", function(d) { return "translate(0," + yScale(d.state) + ")"; });

		state.selectAll(".bar")
			.data(function(d) { return d.segment; })
			.enter()
				.append("rect")
					.attr("class", "bar")
					.attr("clip-path", function() { return "url(#clip" + chartID + ")"; })
					.attr("height", barWidth)
					.attr("x", function(d) { return xScale(d.y0); })
					.attr("width", 0)
					.style("fill", function(d) { return color(d.segment); })
					.on("mouseover", tipStackedBar.show)
					.on("mouseout", tipStackedBar.hide)
					.append("aria-label")
						.text(function(d) {
							if (d.segment == "lang1_p1") { return "In 2014–15, " + formatPercent(d.lang1_p) + " of ELs, or " + formatNumber(d.lang1_n) + " ELs, in " + d.state + " primarily spoke " + d.lang1_name }
							if (d.segment == "lang2_p1") { return "In 2014–15, " + formatPercent(d.lang2_p) + " of ELs, or " + formatNumber(d.lang2_n) + " ELs, in " + d.state + " primarily spoke " + d.lang2_name }
							if (d.segment == "lang3_p1") { return "In 2014–15, " + formatPercent(d.lang3_p) + " of ELs, or " + formatNumber(d.lang3_n) + " ELs, in " + d.state + " primarily spoke " + d.lang3_name }
							if (d.segment == "lang4_p1") { return "In 2014–15, " + formatPercent(d.lang4_p) + " of ELs, or " + formatNumber(d.lang4_n) + " ELs, in " + d.state + " primarily spoke " + d.lang4_name }
							if (d.segment == "lang5_p1") { return "In 2014–15, " + formatPercent(d.lang5_p) + " of ELs, or " + formatNumber(d.lang5_n) + " ELs, in " + d.state + " primarily spoke " + d.lang5_name }
							if (d.segment == "lang6_p1") { return "In 2014–15, " + formatPercent(d.lang6_p) + " of ELs, or " + formatNumber(d.lang6_n) + " ELs, in " + d.state + " primarily spoke " + d.lang6_name }
							if (d.segment == "lang7_p1") { return "In 2014–15, data on the language spoken by ELs was missing for " + formatPercent(d.lang7_p) + " of ELs, or " + formatNumber(d.lang7_n) + " ELs, in " + d.state };
						});

		state.selectAll("text")
			.data(function(d) { return d.segment; })
			.enter()
				.append("text")
					.attr("class", "label")
					.attr("x", function(d) { return (xScale(d.y0) + xScale(d.y1))/2; })
					.attr("y", barWidth/2)
					.attr("dy", "0.3em")
					.attr("text-anchor", "middle")
					.style("opacity", 0)
					.style("fill", function(d) { return color2(d.segment); })
					.text(function(d) {
						if (d.segment == "lang1_p1") { return d.lang1_code; }
						if (d.segment == "lang2_p1") { return d.lang2_code; }
						if (d.segment == "lang3_p1") { return d.lang3_code; }
						if (d.segment == "lang4_p1") { return d.lang4_code; }
						if (d.segment == "lang5_p1") { return d.lang5_code; }
						if (d.segment == "lang6_p1") { return d.lang6_code; }
						if (d.segment == "lang7_p1") { return d.lang7_code; };
					});

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					state.selectAll(".bar")
						.transition()
							.duration(animateTime)
							.delay(function(d, i) { return animateTime * i; })
							.attr("width", function(d) { return xScale(d.y1) - xScale(d.y0); })

					state.selectAll(".label")
						.transition()
							.duration(animateTime)
							.delay(function(d, i) { return (animateTime * i)+animateTime/2; })
							.style("opacity", function(d) {
								if ((xScale(d.y1)-xScale(d.y0)) < 30) { return 0; }
								else { return 1; };
							});

			}});

		// draw y-axis above bars

		svg.append("g")
			.attr("class", "y axis")
			.style("opacity", 0)
			.attr("aria-hidden", "true")
			.call(yAxis)
			.transition()
				.duration(animateTime)
				.style("opacity", 1);

		svg.select(".y.axis")
			.selectAll("text")
				.each(function() {
					if (this.textContent == "National") { this.setAttribute("style", "font-weight: bold; text-anchor: end;") };
				});

		// add clip path

		svg.append("defs")
			.append("clipPath")
				.attr("id", function() { return "clip" + chartID; })
					.append("rect")
						.attr("id", function() { return "clipRect" + chartID; })
						.attr("width", widthAdj)
						.attr("height", heightAdj);

		// notes

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// sort by state

		function sortState() {

			// sort data

			data.sort(function(a, b) { return d3.ascending(+a.order, +b.order); });

			// reset domain on y-axis

			yScale.domain(data.map(function(d) { return d.state; }));

			// move things

			svg.selectAll(".stateBar")
				.transition()
					.duration(animateTime/3)
					.style("opacity", 0.85)
						.transition()
							.duration(animateTime)
							.attr("transform", function(d) { return "translate(0," + yScale(d.state) + ")"; })
							.transition()
								.duration(animateTime/3)
								.style("opacity", 1);

			svg.transition()
				.delay(animateTime/3)
				.duration(animateTime)
				.select(".y.axis")
					.call(yAxis);

		};

		// sort by percentage

		function sortPerc() {

			// sort data

			data.sort(function(a, b) { return +b.lang1_p - +a.lang1_p; });

			// reset domain on y-axis

			yScale.domain(data.map(function(d) { return d.state; }));

			// move things

			svg.selectAll(".stateBar")
				.transition()
					.duration(animateTime/3)
					.style("opacity", .85)
					.transition()
						.duration(animateTime)
							.attr("transform", function(d) { return "translate(0," + yScale(d.state) + ")"; })
							.transition()
								.duration(animateTime/3)
								.style("opacity", 1);

			svg.transition()
				.delay(animateTime/3)
				.duration(animateTime)
				.select(".y.axis")
					.call(yAxis);

		};

		// resize

		window.addEventListener("resize", function() {

			// update width

			width = (parseInt(d3.select("#" + sectionID).style("width"), 10) < 360) ? 360 : parseInt(d3.select("#" + sectionID).style("width"), 10);
			widthAdj = width - marginLeft - margin.right;

			// resize chart

			xScale.range([0, widthAdj]);
			xAxis.ticks(Math.max((widthAdj)/100, 2))

			d3.select("#" + chartID)
				.attr("width", width);

			d3.select("#" + sectionID)
				.classed("activated", null);

			dom.selectAll(".stackedBar")
				.attr("width", width);

			svg.select(".x.axis")
				.call(xAxis);

			svg.selectAll("text.x.axis")
				.attr("x", widthAdj)
				.attr("dx", "0.5em");

			svg.selectAll("defs")
				.selectAll("clipPath")
				.selectAll("rect")
				.attr("width", widthAdj);

			state.selectAll(".bar")
				.transition()
					.attr("x", function(d) { return xScale(d.y0); })
					.attr("width", 0);

			state.selectAll(".label")
				.transition()
				.style("opacity", 0)
				.attr("x", function(d) { return (xScale(d.y0) + xScale(d.y1))/2; });

			var gsResize = graphScroll()
				.container(d3.select("#" + containerID))
				.graph(d3.selectAll("#" + chartID))
				.sections(d3.selectAll("#" + subcontainerID + " > div"))
				.on("active", function() {

					if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
					else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

						d3.select("#" + sectionID)
							.classed("activated", "true");

							state.selectAll(".bar")
								.transition()
									.duration(animateTime)
									.delay(function(d, i) { return animateTime * i; })
									.attr("width", function(d) { return xScale(d.y1) - xScale(d.y0); })

							state.selectAll(".label")
								.transition()
									.duration(animateTime)
									.delay(function(d, i) { return (animateTime * i)+animateTime/2; })
									.style("opacity", function(d) {
										if ((xScale(d.y1)-xScale(d.y0)) < 30) { return 0; }
										else { return 1; };
									});

				}});

		});

	});

	};

 /*   chart.width = function(value) {

        if (!arguments.length) return width;
        width = value;
        return chart;

    }; */

  chart.height = function(value) {

      if (!arguments.length) return height;
      height = value;
      return chart;

  };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.barWidth = function(value) {

		if (!arguments.length) return barWidth;
		barWidth = value;
		return chart;

	};

	chart.title = function(value) {

		if (!arguments.length) return title;
		title = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.notes = function(value) {

		if (!arguments.length) return notes;
		notes = value;
		return chart;

	};

	chart.source = function(value) {

			if (!arguments.length) return source;
			source = value;
			return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		return chart;

	};

  chart.data = function(value) {

      if (!arguments.length) return data;
      data = value;
      return chart;

  };

	return chart;

};

// Multiple bar chart function

function multiBar() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 650,
		marginTop = 20,
		marginLeft = 100,
		marginBottom = 60,
		animateTime = 1000,
		barWidth = 15,
		title = "Generic chart title. Update me using .title()!",
		altText = "Fill in alt text for screen readers! Use .altText().",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
			formatNumberD = d3.format(",.1f"),
			formatPercent = d3.format(",%"); // 6/14/17: Changed to remove rounding because figures were already rounded

		// margins; adjust width and height to account for margins

		width = (parseInt(d3.select("#" + sectionID).style("width"), 10) < 360) ? 360 : parseInt(d3.select("#" + sectionID).style("width"), 10);

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

		// chart title

		d3.select(this).append("div")
			.attr("id", "title" + chartID)
			.html("<span class = 'title'>" + title + "</span>");

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID);

		var svg = dom.append("svg")
			.attr("class", "multiBar")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText);

		// tooltips using d3-tip

		var tipBar = d3.tip()
			.attr("class", "d3-tip")
			.direction("e")
			.offset([0, 10])
			.html(function(d) {
				return d.level + ": " + formatPercent(d.pct);
			});

		svg.call(tipBar);

		// axis scales

		var xScale = d3.scale.linear().range([0, widthAdj - 100]),
			yScale0 = d3.scale.ordinal().rangeRoundBands([0, heightAdj], 0.15),
			yScale1 = d3.scale.ordinal();

		// domains

		data_nest = d3.nest()
			.key(function(d) { return d.group; })
			.entries(data);

		data_levels = d3.nest()
			.key(function(d) { return d.level; })
			.entries(data);

		var levels = d3.values(data_levels).map(function(d) { return d.key; });

		var color = d3.scale.ordinal().range(["#5D42A6","#A6426C","#C07A98"]);

		function xDomain() {
			if (window.innerWidth <= 736) {

				xScale.domain([0, d3.max(data, function(d) { return d.pct; })]).nice()

			}
			/*else { xScale.domain([0, 0.5]); }*/
		};
		xDomain();
		yScale0.domain(data_nest.map(function(d) { return d.key; }));
		yScale1.domain(levels).rangeRoundBands([0, yScale0.rangeBand()], 0.15);

		// axes

		function formatValueAxis(d) {

			var TickValue = formatNumber(d * 100);

			return TickValue;

		};

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(formatValueAxis).tickSize(-1 * heightAdj).ticks(Math.max((widthAdj - 100)/100, 2)),
			yAxis = d3.svg.axis().scale(yScale0).orient("left").outerTickSize(0);

		// draw x-axis below bars

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)

		svg.append("text")
			.attr("id", "xAxisT_a")
			.attr("class", "x axis")
			.attr("x", widthAdj - 100)
			.attr("dx", ".5em")
			.attr("y", heightAdj)
			.attr("dy", "3.1em")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.text("% OF TOTAL IN 2014–15");

		/*svg.append("text")
			.attr("id", "xAxisT_b")
			.attr("class", "x axis")
			.attr("x", widthAdj - 100)
			.attr("dx", ".5em")
			.attr("y", heightAdj)
			.attr("dy", "4.1em")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.style("opacity", function() {
				if (window.innerWidth <= 736) { return 1; }
				else { return 0; }
			})
			.text("SUSPENDED IN 2013-14");*/

		// draw level bars

		var group = svg.selectAll(".group")
			.data(data_nest, function(d) { return d.key; });

		group.enter()
			.append("g")
				.attr("class", "group")
				.attr("transform", function(d) { return "translate(0," + yScale0(d.key) + ")"; });

		var levelBars = group.selectAll(".bar")
			.data(function(d) { return d.values; });

		levelBars.enter()
			.append("rect")
				.attr("class", function(d) { return "bar" })
				.attr("x", 0)
				.attr("width", 0)
				.attr("y", function(d, i) { return (yScale0.rangeBand() / 2) - ((.85 * (((1.25 * levels.length) * barWidth)) / 2)) + (1.09 * barWidth * i); })
				.attr("height", 0)
				.style("fill", function(d) { return color(d.level); })
				.on("mouseover", tipBar.show)
				.on("mouseout", tipBar.hide)
				.append("aria-label")
					.text(function(d) { return "In 2014–15, " + formatPercent(d.pct) + " of " + d.level + "had " + d.group + " concentrations of ELs.";
					});

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					svg.selectAll(".bar")
						.transition()
							.duration(animateTime)
							.attr("width", function(d) { return xScale(d.pct); })
							.attr("height", barWidth);

			}});

		// draw y-axis above bars

		svg.append("g")
			.attr("class", "y axis")
			.style("opacity", 0)
			.attr("aria-hidden", "true")
			.call(yAxis)
			.transition()
				.duration(animateTime)
				.style("opacity", 1);

		// legend

		var legend = svg.selectAll(".legend")
			.data(levels)
			.enter()
			.append("g")
				.attr("class", "legend")
				.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("circle")
			.attr("cx", widthAdj - 77)
			.attr("cy", 9)
			.attr("r", 6.5)
			.style("fill", function(d) { return color(d); });

		legend.append("text")
			.attr("x", widthAdj - 65)
			.attr("y", 9)
			.attr("dy", ".35em")
			.attr("aria-hidden", "true")
			.style("text-anchor", "start")
			.text(function(d) { return d; });

		// notes and sources

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// resize

		window.addEventListener("resize", function() {

			// update width

			width = (parseInt(d3.select("#" + sectionID).style("width"), 10) < 360) ? 360 : parseInt(d3.select("#" + sectionID).style("width"), 10);
			widthAdj = width - marginLeft - margin.right;

			// resize chart

			xScale.range([0, widthAdj - 100]);
			xDomain();
			xAxis.ticks(Math.max((widthAdj - 100)/100, 2))

			/*d3.select("#" + chartID)
				.attr("width", width);*/

			d3.select("#" + sectionID)
				.classed("activated", null);

			dom.selectAll(".multiBar")
				.attr("width", width);

			svg.select(".x.axis")
				.call(xAxis);

			svg.selectAll("text.x.axis")
				.attr("x", widthAdj - 100)
				.attr("dx", "0.5em");

			/*svg.select("#xAxisT_b")
				.style("opacity", function() {
					if (window.innerWidth <= 736) { return 1; }
					else { return 0; }
				})
				.text("SUSPENDED IN 2013-14");*/

			/*dom.selectAll(".national-bar")
				.attr("width", 0);*/

			svg.selectAll(".bar")
				.attr("width", 0);

			var gsResize = graphScroll()
				.container(d3.select("#" + containerID))
				.graph(d3.selectAll("#" + chartID))
				.sections(d3.selectAll("#" + subcontainerID + " > div"))
				.on("active", function() {

					if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
					else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

						d3.select("#" + sectionID)
							.classed("activated", "true");

						svg.selectAll(".bar")
							.transition()
								.duration(animateTime)
								.attr("width", function(d) { return xScale(d.pct); })
								.attr("height", barWidth);

				}});

			legend.selectAll("circle")
				.attr("cx", widthAdj - 77);

			legend.selectAll("text")
				.attr("x", widthAdj - 65);

		});

		});

	};

 /*   chart.width = function(value) {

        if (!arguments.length) return width;
        width = value;
        return chart;

    }; */

  chart.height = function(value) {

      if (!arguments.length) return height;
      height = value;
      return chart;

  };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.barWidth = function(value) {

		if (!arguments.length) return barWidth;
		barWidth = value;
		return chart;

	};

	chart.title = function(value) {

		if (!arguments.length) return title;
		title = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.notes = function(value) {

			if (!arguments.length) return notes;
			notes = value;
			return chart;

		};

	chart.source = function(value) {

		if (!arguments.length) return source;
		source = value;
		return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		return chart;

	};

    chart.data = function(value) {

        if (!arguments.length) return data;
        data = value;
        if (typeof updateData === 'function') updateData();
        return chart;

    };

	return chart;

};

// divering bars

function divergingBar() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 650,
		marginTop = 35,
		marginLeft = 100,
		marginBottom = 60,
		animateTime = 1000,
		barWidth = 15,
		title = "Generic chart title. Update me using .title()!",
		altText = "Fill in alt text for screen readers! Use .altText().",
		xAxisLabel = "",
		toggles = 0,
		group1 = "",
		group2 = "",
		notes = "",
		source = "",
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
			formatNumberD = d3.format(",.1f"),
			formatPercent = d3.format(",.1%");

		// margins; adjust width and height to account for margins

		width = (parseInt(d3.select("#" + sectionID).style("width"), 10) < 360) ? 360 : parseInt(d3.select("#" + sectionID).style("width"), 10);

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

			// add buttons if indicated

			var button_vals = d3.map(data, function(d) { return d.level; }).keys();
			var selected_val = button_vals[0];
			var data_all = data;
			var titles_all = title;

			if (toggles == 1) {

				// values for buttons

				var buttons = d3.select(this)
					.append("div")
					.attr("id", "buttons" + chartID)
					.attr("class", "filters");

				buttons.selectAll(".filterButton")
					.data(button_vals)
					.enter()
						.append("button")
							.attr("class", "filterButton")
							.classed("buttonSelected", function(d) {
								if (d === selected_val) { return true; }
								else { return false; };
							})
							.attr("value", function(d) { return d; })
							.attr("title", function(d, i) { return title[i]; })
							.on("click", function(d) {

								d3.select("#buttons" + chartID)
									.selectAll(".filterButton")
										.classed("buttonSelected", false);

								d3.select(this)
									.classed("buttonSelected", true);

								selected_val = d3.select(this).property("value");
								title = d3.select(this).property("title");
								data = data_all.filter(function(d) { return d.level == selected_val; });

								updateData();

							})
							.append("text")
								.text(function(d) { return d; });

				d3.select(this).append("br");

				data = data_all.filter(function(d) { return d.level == selected_val; });

			}
			else {};

			// chart title

			d3.select(this).append("div")
				.attr("class", "title")
				.append("text")
					.text(function() {
						if (toggles == 1) { return title[0]; }
						else { return title; };
					});

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID);

		var svg = dom.append("svg")
			.attr("class", "divergingBar")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText);

		// tooltips using d3-tip

		var tipGroup1 = d3.tip()
			.attr("class", "d3-tip")
			.direction("n")
			.offset([-10, 0])
			.html(function(d) {	return group1 + ": " + formatPercent(d.group1_p) + " (" + formatNumber(d.group1_n) + " students)"; });

		var tipGroup2 = d3.tip()
			.attr("class", "d3-tip")
			.direction("n")
			.offset([-10, 0])
			.html(function(d) {	return group2 + ": " + formatPercent(d.group2_p) + " (" + formatNumber(d.group2_n) + " students)"; });

		svg.call(tipGroup1);
		svg.call(tipGroup2);

		// axis scales

		var xScale = d3.scale.linear().range([0, widthAdj]),
				yScale = d3.scale.ordinal().rangeRoundBands([0, heightAdj], 0.15);

		// domains
		// x domain max depends on max values across both groups

		var	group1_max = d3.max(data, function(d) { return d.group1_p; }),
				group2_max = d3.max(data, function(d) { return d.group2_p; });

		if (group1_max >= group2_max) { maxVal = group1_max; }
		else { maxVal = group2_max; };

		function xDomain() {
			if (window.innerWidth > 736) { xScale.domain([-1, 1]).nice(); }
			else { xScale.domain([-1 * maxVal, maxVal]); }
		};

		xDomain();

		yScale.domain(d3.map(data, function(d) { return d.group; }).keys());

		// axes

		function formatValueAxis(d) {

			if (d < 0) { TickValue = formatNumber(d * -100) }
			else { TickValue = formatNumber(d * 100) };
			return TickValue;

		};

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom")
			.tickSize(-1 * heightAdj)
			.ticks(Math.max((widthAdj - 100)/100, 2))
			.tickFormat(formatValueAxis);

		var	yAxis = d3.svg.axis().scale(yScale).orient("left").outerTickSize(0);

		// draw x-axis below bars

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis);

		svg.append("text")
			.attr("class", "x axis")
			.attr("x", widthAdj)
			.attr("dx", ".5em")
			.attr("y", heightAdj)
			.attr("dy", "3.1em")
			.attr("text-anchor", "end")
			.attr("aria-hidden", "true")
			.text(xAxisLabel);

		// group 1 bars go left
		// group 2 bars go right

		var group1_bars = svg.selectAll(".group1")
			.data(data);

		group1_bars.enter()
			.append("rect")
				.attr("class", "bar group1")
				.attr("x", xScale(0))
				.attr("width", 0)
				.attr("y", function(d) { return yScale(d.group) + yScale.rangeBand()/2 - barWidth/2; })
				.attr("height", barWidth)
				.on("mouseover", tipGroup1.show)
				.on("mouseout", tipGroup1.hide)
				.append("aria-label")
					.text(function(d) { return "In 2013–14, " + formatPercent(d.group1_p) + ", or " + formatNumber(d.group1_n) + ", of " + group1 + " were " + d.group; });

		var group2_bars = svg.selectAll(".group2")
			.data(data);

		group2_bars.enter()
			.append("rect")
				.attr("class", "bar group2")
				.attr("x", xScale(0))
				.attr("width", 0)
				.attr("y", function(d) {return yScale(d.group) + yScale.rangeBand()/2 - barWidth/2; })
				.attr("height", barWidth)
				.on("mouseover", tipGroup2.show)
				.on("mouseout", tipGroup2.hide)
				.append("aria-label")
					.text(function(d) { return "In 2013–14, " + formatPercent(d.group2_p) + ", or " + formatNumber(d.group2_n) + ", of " + group2 + " were " + d.group; });

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {

				if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
				else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

					d3.select("#" + sectionID)
						.classed("activated", "true");

					svg.selectAll(".bar.group1")
						.transition()
							.duration(animateTime)
							.attr("x", function(d) { return xScale(-1 * d.group1_p); })
							.attr("width", function(d) { return xScale(d.group1_p) - xScale(0); });

					svg.selectAll(".bar.group2")
						.transition()
							.duration(animateTime)
							.attr("width", function(d) { return xScale(d.group2_p) - xScale(0); });

			}});

		// draw y-axis above bars

		svg.append("g")
			.attr("class", "y axis")
			.style("opacity", 0)
			.attr("aria-hidden", "true")
			.call(yAxis)
			.transition()
				.duration(animateTime)
				.style("opacity", 1);

		// add 0 line above bars

		svg.append("line")
			.attr("class", "zeroLine")
			.attr("x1", xScale(0))
			.attr("x2", xScale(0))
			.attr("y1", 0)
			.attr("y2", heightAdj);

		// add under/overrepresented text

		svg.append("text")
			.attr("id", "guide1")
			.attr("x", widthAdj/2)
			.attr("y", 0)
			.attr("dx", "-0.75em")
			.attr("dy", "-0.5em")
			.attr("class", "guide group1")
			.attr("aria-hidden", "true")
			.attr("text-anchor", "end")
			.style("font-weight", "bold")
			.text(group1);

		svg.append("text")
			.attr("id", "guide2")
			.attr("x", widthAdj/2)
			.attr("y", 0)
			.attr("dx", "0.75em")
			.attr("dy", "-0.5em")
			.attr("class", "guide group2")
			.attr("text-anchor", "start")
			.attr("aria-hidden", "true")
			.style("font-weight", "bold")
			.text(group2);

		// legend

		/*var groups = [group1, group2];

		var legend = svg.selectAll(".legend")
			.data(groups)
			.enter()
			.append("g")
				.attr("class", "legend")
				.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("circle")
			.attr("class", function(d) { return d; })
			.attr("cx", widthAdj - 77)
			.attr("cy", 9)
			.attr("r", 6.5);
			//.style("fill", color);

		legend.append("text")
			.attr("x", widthAdj - 65)
			.attr("y", 9)
			.attr("dy", ".35em")
			.attr("aria-hidden", "true")
			.style("text-anchor", "start")
			.text(function(d) { return d; });*/

		// notes and sources

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// resize

		window.addEventListener("resize", function() {

			// update width

			width = (parseInt(d3.select("#" + sectionID).style("width"), 10) < 360) ? 360 : parseInt(d3.select("#" + sectionID).style("width"), 10);
			widthAdj = width - marginLeft - margin.right;

			// resize chart

			xScale.range([0, widthAdj]);
			xDomain();
			xAxis.ticks(Math.max((widthAdj - 100)/100, 2))

			d3.select("#" + sectionID)
				.classed("activated", null);

			dom.selectAll(".divergingBar")
				.attr("width", width);

			svg.select("#guide1")
				.style("opacity", function() {
					if (window.innerWidth <= 736) { return 0; }
					else { return 1; }
				})

			svg.select("#guide2")
				.style("opacity", function() {
					if (window.innerWidth <= 736) { return 0; }
					else { return 1; }
				})

			svg.select(".x.axis")
				.call(xAxis);

			svg.selectAll("text.x.axis")
				.attr("x", widthAdj)
				.attr("dx", "0.5em");

			svg.select("line.zeroLine")
				.attr("x1", xScale(0))
				.attr("x2", xScale(0));

			svg.select("#guide1")
				.attr("x", widthAdj/2)
				.attr("dx", "-0.75em");

			svg.select("#guide2")
				.attr("x", widthAdj/2)
				.attr("dx", "0.75em");

			svg.selectAll(".bar.group1")
				.attr("x", xScale(0))
				.attr("width", 0);

			svg.selectAll(".bar.group2")
				.attr("x", xScale(0))
				.attr("width", 0);

			var gsResize = graphScroll()
				.container(d3.select("#" + containerID))
				.graph(d3.selectAll("#" + chartID))
				.sections(d3.selectAll("#" + subcontainerID + " > div"))
				.on("active", function() {

					if (document.getElementById(sectionID).className.indexOf("activated") >= 0) { return; }
					else if (document.getElementById(sectionID).className.indexOf("graph-scroll") >= 0) {

						d3.select("#" + sectionID)
							.classed("activated", "true");

						svg.selectAll(".bar.group1")
							.transition()
								.duration(animateTime)
								.attr("x", function(d) { return xScale(-1 * d.group1_p); })
								.attr("width", function(d) { return xScale(d.group1_p) - xScale(0); });

						svg.selectAll(".bar.group2")
							.transition()
								.duration(animateTime)
								.attr("width", function(d) { return xScale(d.group2_p) - xScale(0); });

				}});

			/*legend.selectAll("circle")
				.attr("cx", widthAdj - 77);

			legend.selectAll("text")
				.attr("x", widthAdj - 65);*/

		});

		// update data function

		function updateData() {

			var group1_bars = svg.selectAll(".group1")
				.data(data);

			var group2_bars = svg.selectAll(".group2")
				.data(data);

			svg.select(".y.axis")
				.remove();

			yScale.domain(d3.map(data, function(d) { return d.group; }).keys());

			svg.append("g")
				.attr("class", "y axis")
				.attr("aria-hidden", "true")
				.call(yAxis);

			svg.selectAll(".bar.group1")
				.transition()
					.duration(animateTime)
					.attr("x", function(d) { return xScale(-1 * d.group1_p); })
					.attr("width", function(d) { return xScale(d.group1_p) - xScale(0); });

			svg.selectAll(".bar.group2")
				.transition()
					.duration(animateTime)
					.attr("width", function(d) { return xScale(d.group2_p) - xScale(0); });

			svg.selectAll(".bar")
				.selectAll("aria-label").remove();

			/*svg.selectAll("circle.dot")
				.append("aria-label")
					.text(function(d) { return "In 2013–14, " + formatPercent(d.pct) + " of " + d.group + ", or " + formatNumber(d.num) + ", offered " + d.level + "."; });*/

			d3.select("#" + sectionID)
				.select(".title")
				.text(title);

		};

		});

	};

 /*   chart.width = function(value) {

        if (!arguments.length) return width;
        width = value;
        return chart;

    }; */

  chart.height = function(value) {

      if (!arguments.length) return height;
      height = value;
      return chart;

  };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.barWidth = function(value) {

		if (!arguments.length) return barWidth;
		barWidth = value;
		return chart;

	};

	chart.group1 = function(value) {

		if (!arguments.length) return group1;
		group1 = value;
		return chart;

	};

	chart.group2 = function(value) {

		if (!arguments.length) return group2;
		group2 = value;
		return chart;

	};

	chart.xAxisLabel = function(value) {

		if (!arguments.length) return xAxisLabel;
		xAxisLabel = value;
		return chart;

	};

	chart.title = function(value) {

		if (!arguments.length) return title;
		title = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.notes = function(value) {

			if (!arguments.length) return notes;
			notes = value;
			return chart;

		};

	chart.source = function(value) {

		if (!arguments.length) return source;
		source = value;
		return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		return chart;

	};

	chart.toggles = function(value) {

		if (!arguments.length) return toggles;
		toggles = value;
		return chart;

	};

  chart.data = function(value) {

      if (!arguments.length) return data;
      data = value;
      return chart;

  };

	return chart;

};

// Reusable dot plot function for chronic absenteeism storymap

function dotPlot() {

	// Options accessible to the caller
	// These are the default values

	var	width = [],
		height = 500,
		marginTop = 20,
		marginLeft = 100,
		marginBottom = 45,
		dotSize = 5,
		animateTime = 1000,
		title = "Generic chart title. Update me using .title()!",
		altText = "Fill in alt text for screen readers!",
		group = "",
		xAxisLabel = "DEFINE X AXIS LABEL",
		notes = "",
		source = "",
		toggles = 0,
		axisdefs = 0,
		containerID = [],
		subcontainerID = [],
		chartID = [],
		sectionID = [],
		data = [];

	function chart(selection) {
		selection.each(function() {

		// formats

		var	formatNumber = d3.format(",f"),
			formatPercent = d3.format(",.1%");

		// margins; adjust width and height to account for margins

		width = parseInt(d3.select("#" + sectionID).style("width"), 10);

		var margin = {right: 20},
			widthAdj = width - marginLeft - margin.right,
			heightAdj = height - marginTop - marginBottom;

		// add buttons if indicated

		var button_vals = d3.map(data, function(d) { return d.level; }).keys();
		var selected_val = button_vals[0];
		var data_all = data;
		var titles_all = title;

		if (toggles == 1) {

			// values for buttons

			var buttons = d3.select(this)
				.append("div")
				.attr("id", "buttons" + chartID)
				.attr("class", "filters");

			buttons.selectAll(".filterButton")
				.data(button_vals)
				.enter()
					.append("button")
						.attr("class", "filterButton")
						.classed("buttonSelected", function(d) {
							if (d === selected_val) { return true; }
							else { return false; };
						})
						.attr("value", function(d) { return d; })
						.attr("title", function(d, i) { return title[i]; })
						.on("click", function(d) {

							d3.select("#buttons" + chartID)
								.selectAll(".filterButton")
									.classed("buttonSelected", false);

							d3.select(this)
								.classed("buttonSelected", true);

							selected_val = d3.select(this).property("value");
							title = d3.select(this).property("title");
							data = data_all.filter(function(d) { return d.level == selected_val; });

							updateData();

						})
						.append("text")
							.text(function(d) { return d; });

			d3.select(this).append("br");

			data = data_all.filter(function(d) { return d.level == selected_val; });

		}
		else {};

		// chart title

		d3.select(this).append("div")
			.attr("class", "title")
			.append("text")
				.text(function() {
					if (toggles == 1) { return title[0]; }
					else { return title; };
				});

		// selections

		var dom = d3.select(this)
			.append("div")
			.attr("id", chartID);

		// add svg

		var svg = dom.append("svg")
			.attr("class", "dotPlot")
			.attr("width", width)
			.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

		svg.append("aria-label")
			.text(altText);

		// tooltips using d3-tip

		var tipDot = d3.tip()
			.attr("class", "d3-tip")
			.direction("e")
			.offset([0, 10])
			.html(function(d) {
			return formatPercent(d.pct) + " (" + formatNumber(d.num) + " " + group + ")";
		});

		svg.call(tipDot);

		// axis scales and axes

		var xScale = d3.scale.linear().range([0, widthAdj]),
			yScale = d3.scale.ordinal().rangeRoundBands([0, heightAdj], .1);

		// domains

		function xDomain() {
			if (window.innerWidth <= 736) { xScale.domain([0, d3.max(data, function(d) { return d.pct; })]).nice() }
			else { xScale.domain([0, 1]); }
		};
		xDomain();
		yScale.domain(data.map(function(d) { return d.group; }));

		// axes

		function formatValueAxis(d) {

			var TickValue = formatNumber(d * 100);
			return TickValue;

		};

		var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(formatValueAxis).tickSize(-1 * heightAdj).ticks(Math.max(widthAdj/100, 2)),
			yAxis = d3.svg.axis().scale(yScale).orient("left").outerTickSize(0);

		// draw x-axis below bars

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + heightAdj + ")")
			.attr("aria-hidden", "true")
			.call(xAxis)

		svg.append("text")
			.attr("class", "x axis")
			.attr("x", widthAdj)
			.attr("dx", "0.5em")
			.attr("y", heightAdj)
			.attr("dy", "3.1em")
			.attr("aria-hidden", "true")
			.attr("text-anchor", "end")
			.text(xAxisLabel);

		// draw dots and lines

		var lines = svg.selectAll("line.dotLine")
			.data(data);

		lines.enter()
			.append("g")
			.attr("transform", "translate(0,0)")
			.append("line")
				.attr("class", "dotLine")
				.attr("x1", 0)
				.attr("x2", 0)
				.attr("y1", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); })
				.attr("y2", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); });

		var dots = svg.selectAll("circle.dot")
			.data(data);

		dots.enter()
			.append("g")
				.attr("transform", "translate(0,0)")
				.append("circle")
					.attr("class", "dot")
					.attr("clip-path", function() { return "url(#clip" + chartID + ")"; })
					.attr("cx", 0)
					.attr("cy", function(d) { return yScale(d.group) + (yScale.rangeBand() / 2); })
					.attr("r", dotSize/2)
					.on("mouseover", tipDot.show)
					.on("mouseout", tipDot.hide)
					.append("aria-label")
						.text(function(d) { return "In 2013–14, " + formatPercent(d.pct) + " of " + d.group + ", or " + formatNumber(d.num) + ", offered " + d.level + "."; });

		var gs = graphScroll()
			.container(d3.select("#" + containerID))
			.graph(d3.selectAll("#" + chartID))
			.sections(d3.selectAll("#" + subcontainerID + " > div"))
			.on("active", function() {
				if (document.getElementById(sectionID).className == "graph-scroll-active") {

					svg.selectAll("line.dotLine")
						.transition()
							.duration(animateTime)
							.attr("x2", function(d) { return xScale(d.pct); })
							.each("end", function(d) {
								d3.select(this)
									.transition()
										.duration(animateTime)
										.attr("x2", function(d) { return xScale(d.pct) - dotSize; });
							});

					svg.selectAll("circle.dot")
						.transition()
							.duration(animateTime)
							.attr("cx", function(d) { return xScale(d.pct); })
							.each("end", function(d) {
								d3.select(this)
									.transition()
										.duration(animateTime)
										.attr("r", dotSize);
							});

			}});

		// add clip path

		svg.append("defs")
			.append("clipPath")
				.attr("id", function() { return "clip" + chartID; })
					.append("rect")
						.attr("width", widthAdj + margin.right)
						.attr("height", heightAdj);

		// draw y-axis above

		svg.append("g")
			.attr("class", "y axis")
			.attr("aria-hidden", "true")
			.call(yAxis)

		function axisDefCheck() {
			if (axisdefs == 1) {
				svg.selectAll(".y.axis .tick")
					.data(data)
					.selectAll("text")
					.style("opacity", 0);

				/*svg.selectAll(".y.axis .tick")
					.data(data)
					.enter()
					.append("text")
						.attr("class", "def_tick")
						.attr("x", -9)
						.attr("dy", function(d, i) {
							if (d.definition == null) { return "0.32em"; }
							else { return "-0.25em"; };
						})
						.attr("text-anchor", "end")
						.text(function(d, i) { return d.level; });*/

				svg.selectAll(".y.axis .tick")
					.append("text")
						.attr("class", "def_tick")
						.attr("x", -9)
						.attr("dy", function(d) {
							if (d.definition == null) { return "0.32em"; }
							else { return "-0.25em"; };
						})
						.attr("text-anchor", "end")
						.text(function(d) { return d.group; });

				svg.selectAll(".y.axis .tick")
					.append("text")
						.attr("class", "def_tick")
						.attr("x", -9)
						.attr("dy", "0.75em")
						.attr("text-anchor", "end")
						.text(function(d) { return d.definition; });

				svg.selectAll(".def_tick")
					.style("opacity", function(d) {
						if (d.definition == "") { return 0; }
						else { return 1; };
					});

			}
			else if (axisdefs == 0) { };
		}

		axisDefCheck();

		// notes and sources

		function writeNotes() {
			if (!notes) {}
			else {

				d3.select("#"+ sectionID).append("div")
						.attr("id", "notes" + chartID)
						.html("<span class = 'chartNotes'><strong style='color: #000;''>Note(s): </strong>" + notes + "</span>");

			};
		};

		writeNotes();

		function writeSource() {
			if (!source) {}
			else {
				d3.select("#"+ sectionID).append("div")
					.attr("id", "notes" + chartID)
					.html("<span class = 'chartNotes'><strong style='color: #000;''>Source(s): </strong>" + source + "</span>");
			};
		};

		writeSource();

		// resize

		window.addEventListener("resize", function() {

			// update width

			width = parseInt(d3.select("#" + sectionID).style("width"), 10);
			widthAdj = width - marginLeft - margin.right;

			// resize chart

			xScale.range([0, widthAdj]);
			xDomain();
			xAxis.ticks(Math.max(widthAdj/100, 2));

			/*d3.select("#" + chartID)
				.attr("width", width);*/

			dom.selectAll(".dotPlot")
				.attr("width", width);

			dom.select(".x.axis")
				.call(xAxis);

			dom.select("text.x.axis")
				.attr("x", widthAdj)
				.attr("dx", "0.5em");

			dom.selectAll("line.dotLine")
				.attr("x2", 0);

			dom.selectAll(".dot")
				.attr("cx", 0)
				.attr("r", dotSize/2);

			var gs2 = graphScroll()
				.container(d3.select("#" + containerID))
				.graph(d3.selectAll("#" + chartID))
				.sections(d3.selectAll("#" + subcontainerID + " > div"))
				.on("active", function() {
					if (document.getElementById(sectionID).className == "graph-scroll-active") {

						svg.selectAll("line.dotLine")
							.transition()
								.duration(animateTime)
								.attr("x2", function(d) { return xScale(d.pct); })
								.each("end", function(d) {
									d3.select(this)
										.transition()
											.duration(animateTime)
											.attr("x2", function(d) { return xScale(d.pct) - dotSize; });
								});

						svg.selectAll("circle.dot")
							.transition()
								.duration(animateTime)
								.attr("cx", function(d) { return xScale(d.pct); })
								.each("end", function(d) {
									d3.select(this)
										.transition()
											.duration(animateTime)
											.attr("r", dotSize);
								});

				}});

		});

		// update data function

		function updateData() {

			var lines = svg.selectAll("line.dotLine")
				.data(data);

			svg.selectAll("line.dotLine")
				.transition()
					.duration(animateTime)
					.attr("x2", function(d) { return xScale(d.pct); })
					.each("end", function(d) {
						d3.select(this)
							.transition()
								.duration(animateTime)
								.attr("x2", function(d) { return xScale(d.pct) - dotSize; });
					});

			var dots = svg.selectAll("circle.dot")
				.data(data);

			svg.selectAll("circle.dot")
				.transition()
					.duration(animateTime)
					.attr("cx", function(d) { return xScale(d.pct); })
					.each("end", function(d) {
						d3.select(this)
							.transition()
								.duration(animateTime)
								.attr("r", dotSize);
					});

			svg.selectAll("circle.dot")
				.selectAll("aria-label").remove();

			svg.selectAll("circle.dot")
				.append("aria-label")
					.text(function(d) { return "In 2013–14, " + formatPercent(d.pct) + " of " + d.group + ", or " + formatNumber(d.num) + ", offered " + d.level + "."; });

			d3.select("#" + sectionID)
				.select(".title")
				.text(title);

		};

		});

	};

   /* chart.width = function(value) {

        if (!arguments.length) return width;
        width = value;
        return chart;

    }; */

	chart.group = function(value) {

      if (!arguments.length) return group;
      group = value;
      return chart;

  };

	chart.xAxisLabel = function(value) {

      if (!arguments.length) return xAxisLabel;
      xAxisLabel = value;
      return chart;

  };

  chart.height = function(value) {

      if (!arguments.length) return height;
      height = value;
      return chart;

  };

	chart.marginTop = function(value) {

		if (!arguments.length) return marginTop;
		marginTop = value;
		return chart;

	};

	chart.marginLeft = function(value) {

		if (!arguments.length) return marginLeft;
		marginLeft = value;
		return chart;

	};

	chart.marginBottom = function(value) {

		if (!arguments.length) return marginBottom;
		marginBottom = value;
		return chart;

	};

	chart.dotSize = function(value) {

		if (!arguments.length) return dotSize;
		dotSize = value;
		return chart;

	};

	chart.animateTime = function(value) {

		if (!arguments.length) return animateTime;
		animateTime = value;
		return chart;

	};

	chart.title = function(value) {

		if (!arguments.length) return title;
		title = value;
		return chart;

	};

	chart.altText = function(value) {

		if (!arguments.length) return altText;
		altText = value;
		return chart;

	};

	chart.containerID = function(value) {

		if (!arguments.length) return containerID;
		containerID = value;
		return chart;

	};

	chart.subcontainerID = function(value) {

		if (!arguments.length) return subcontainerID;
		subcontainerID = value;
		return chart;

	};

	chart.chartID = function(value) {

		if (!arguments.length) return chartID;
		chartID = value;
		return chart;

	};

	chart.toggles = function(value) {

		if (!arguments.length) return toggles;
		toggles = value;
		return chart;

	};

	chart.axisdefs = function(value) {

		if (!arguments.length) return axisdefs;
		axisdefs = value;
		return chart;

	};

	chart.sectionID = function(value) {

		if (!arguments.length) return sectionID;
		sectionID = value;
		return chart;

	};

	chart.source = function(value) {

		if (!arguments.length) return source;
		source = value;
		return chart;

	};

	chart.notes = function(value) {

		if (!arguments.length) return notes;
		notes = value;
		return chart;

	};

  chart.data = function(value) {

      if (!arguments.length) return data;
      data = value;
      return chart;

  };

	return chart;

};

// this is for wrapping long axis labels
// need to examine this for bar charts because it's causing some unintended side effects...

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
};
